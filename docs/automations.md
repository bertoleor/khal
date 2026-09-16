# Automatizaciones — Guía de conexión (slice 6)

Estado: **scaffold listo, infraestructura pendiente.** El código de resiliencia e
integridad webhook está implementado y testeado en `apps/api-workers`. El cableado
a servicios externos (n8n, Upstash QStash, Telegram/WhatsApp) se hace al momento
del provisioning — no hay forma de "code-earlo" sin credenciales reales.

## Arquitectura (RES-03 — nunca sincrónico en el request path)

```
Supabase (DB) ── Database Webhook ──> n8n ──> WhatsApp Business API (recordatorio 24h)
        │                              └──> Telegram Bot API (alerta a la dueña)
        └── pg_cron (TTL libera slots) + QStash (entrega programada/queued)
```

La clienta completa el request en <200ms. Los terceros fallan sin afectar la
respuesta: la intención se persiste en Supabase (`failed_webhooks_log` / DLQ) y se
reintenta asíncronamente.

## Qué está implementado y testeado (apps/api-workers)

| Módulo | Regla | Qué hace |
|---|---|---|
| `circuit-breaker.ts` | RESILIENCIA-01 | Circuit breaker closed→open→half_open (3 fallos/60s abre, 30s half-open). Tiempo inyectable → determinístico. |
| `webhook.ts` | WEBHOOKS-01 | `isValidSignature` (HMAC-SHA256, comparación constant-time, capa 3) + `EventDeduplicator` (idempotencia, capa 1). |
| `env.ts` | ENV-01 | Schema Zod validado al boot; rechaza arrancar con variables faltantes/malformadas. |

## Variables de entorno (clasificación SEC-02)

| Variable | Clase |
|---|---|
| `N8N_WEBHOOK_URL` | SERVER |
| `N8N_WEBHOOK_SECRET` | SERVER |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | SERVER |
| `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY` | CRITICAL (rotación 90 días) |

## Pasos de conexión (cuando provisiones la infra)

1. **Supabase**: activar `pg_cron` para el job TTL (ya en la migración del slice 1b
   al linkear) y crear el Database Webhook `INSERT` en `appointments` con
   `status = 'confirmado'` hacia el endpoint de n8n.
2. **n8n**: workflow que reciba el webhook, valide la firma (HMAC) con el helper de
   `apps/api-workers`, y despache el recordatorio vía WhatsApp Business API.
3. **QStash**: para entrega programada (recordatorio exacto 24h antes) y reintentos;
   rotar las signing keys en `.env` y validar la firma entrante con `isValidSignature`.
4. **Alerta Telegram**: otro webhook/micro-workflow que avise a la dueña en turno nuevo
   y en confirmación.

## Pendiente hasta el provisioning

- El `EventDeduplicator` es en-memoria; en producción se respalda en la tabla
  `processed_events` (ya declarada en `supabase/migrations/0001_initial_schema.sql`).
- El dispatcher real que ORQUESTA `CircuitBreaker` + fetch a n8n/Telegram se escribe
  una vez exista el endpoint (falta el `fetch` real + reintentos con backoff/jitter,
  RES-02).