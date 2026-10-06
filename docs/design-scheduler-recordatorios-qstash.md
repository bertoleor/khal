# Scheduler de recordatorios de reserva — QStash → Next Route Handler
> Parte de: [[projects/khal/README|README]] · Relacionados: [[projects/khal/automations|automations]] · [[02-arquitectura-stack]] · [[ADR-CONVENTION]]

- Fecha: 2026-09-16 (verificar con `date` si hay duda)
- Rama: `feat/khal-payment-a11y`
- Rol: 03-sre (diseño/coordinación). No se implementa el envío de email acá — ver card 32-email.
- Fuente de decisiones: docs intra-repo (arquitectura-stack, supabase-migration) + inspección de `apps/web` y `apps/api-workers`.

## 1. Topología (qué se decide)

- **Scheduler (cron): QStash (Upstash).** Un job por lead time, ambos apuntando al mismo endpoint:
  - `leadHours: 24` → "recordar 24h antes"
  - `leadHours: 1` → "recordar 1h antes"
  - El lead time se pasa en el **body** del mensaje QStash, no se inventa un shadow cron por hora.
- **Worker (endpoint): Next.js Route Handler en `apps/web`** → `POST /api/reminders/run`.
  - Runtime verificado: la web es **Next.js 15.5.6 deployada en Vercel** (`amondnet/vercel-action` en `release.yml`).
  - **`apps/api-workers` NO hospeda el worker**: es un paquete Node ESM de lógica compartida (zod, `@types/node`; sin wrangler, sin `vercel.json`, sin handler `fetch`). No hay ni CF bindings ni comando de deploy que lo hagan ejecutable. Convertirlo a CF Worker sería scope nuevo sin base.
  - Precedente en repo: `apps/web/src/app/api/webhooks/mercadopago/route.ts` (mismo patrón: route handler, firma HMAC verificada, `@supabase/supabase-js` service-role, idempotencia). El endpoint de recordatorio replica ese molde.

Flujo: `QStash scheduler` --POST firma `Upstash-Signature`--> `/api/reminders/run` --query `appointments`--> eventos de recordatorio --> card 32-email (Resend).

## 2. Endpoint nuevo

`POST /api/reminders/run` en `apps/web/src/app/api/reminders/run/route.ts`

- **Runtime:** `export const runtime = 'nodejs'` (Vercel node).
- **Auth:** verificar header `Upstash-Signature` con `QSTASH_CURRENT_SIGNING_KEY` (fallback `QSTASH_NEXT_SIGNING_KEY` durante rotación) — reusar el patrón `isValidSignature` ya presente en `apps/api-workers/src/webhook.ts`.
- **Query:** `appointments` con `status='confirmado'`, `deleted_at is null`, `client_id` → `clients.email` + `clients.name`, y `scheduled_at` dentro de `(now + leadHours - grano, now + leadHours]`. Grano sugerido: 15 min (el job cron corre cada 15 min; la cola de antes-de-24h no necesita precisión de minuto).
- **Idempotencia:** registrar lo enviado (columna `reminder_sent_at` en `appointments`, o tabla espejo tipo `processed_events` con `event_id = appointment_id || leadHours`) para que retries de QStash no dupliquen email. Reusar patrón `EventDeduplicator` para el en-memoria; en prod persistido.

## 3. Contrato para card 32-email (consumer del envío)

El endpoint NO envía email. Proyecta por cada vencimiento un evento y lo entrega a la capa que wirea Resend.

**Trigger (lo que la card 32 debe poder leer):**

```
POST /api/reminders/run
Body (de QStash):
  { "leadHours": 24 }   // o 1

Respuesta 200:
  { "received": true, "due": N }  // N = booking vencidos proyectados
```

**Payload de recordatorio por booking (out → card 32-email):**

```ts
interface ReminderEvent {
  bookingId: string;       // appointments.id
  email: string;           // clients.email
  params: { nombre: string; hora: string };  // entrada de formatReminderEsAR
  leadHours: 24 | 1;
}
```

- `hora` = `scheduled_at` formateado a hora local es-AR (el copy de `formatReminderEsAR` espera `{ nombre, hora }`).
- card 32-email: por cada evento hace `formatReminderEsAR(params)` y lo manda por Resend a `email`. **Sin cambio de contrato del lado 32.**

## 4. Env vars (`.env.example`, nombres vacíos, sin secretos)

Ya presentes (huerfanas hoy, ahora con dueño):
- `UPSTASH_QSTASH_TOKEN` — para crear/ver el scheduler QStash (setup inicial, terminal/CI).
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — reservados para idempotencia persistida si se usa Upstash Redis; hoy opcional.
- `QSTASH_CURRENT_SIGNING_KEY` — verificación `Upstash-Signature` en el endpoint.

Se agregan:
- `QSTASH_NEXT_SIGNING_KEY` — rotación de firma QStash (ya referenciada en `apps/api-workers/src/env.ts`).
- `RESEND_API_KEY` — envío de email (card 32-email).
- `RESEND_FROM_EMAIL` — remitente (card 32-email).

Nota: `APP_URL` (ya presente) es la base del endpoint — el cron QStash debe apuntar a `<APP_URL>/api/reminders/run` de prod.

## 5. Comando de deploy del job (setup QStash, one-time)

El scheduler QStash se registra una vez con el token de gestión (no via redeploy):

```bash
# Setup del job "recordar 24h antes"
curl -X POST "https://qstash.upstash.io/v1/schedules" \
  -H "Authorization: Bearer $UPSTASH_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "cron": "*/15 * * * *", "destination": "<APP_URL>/api/reminders/run", "body": "{\"leadHours\":24}" }'

# Setup del job "recordar 1h antes"
curl -X POST "https://qstash.upstash.io/v1/schedules" \
  -H "Authorization: Bearer $UPSTASH_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "cron": "*/15 * * * *", "destination": "<APP_URL>/api/reminders/run", "body": "{\"leadHours\":1}" }'

# Listar/borrar: GET/DELETE https://qstash.upstash.io/v1/schedules
```

Deploy del **endpoint** = deploy normal de la web (Vercel via `release.yml`, push a main). No hay comando extra por job.

## 6. Gates de infra

- Build: el endpoint participa del build `turbo` (typecheck) — no toca deps nuevas (usar zod ya presente en web).
- Sin secretos en `.env.example` (solo nombres) ni en este doc.
- Documentado en `docs/` versionable; commit convencional + trailer Generated-By.