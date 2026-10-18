# khal API — superficie pública e interna

> **Fecha:** 2026-10-17 · **Autor:** 24-gentle (original, 2026-10-16) · consolidado a `docs/API.md` del set v2 por 16-backend (ticket [FLEET-DOCS] t_0fae1500) · **Motivo:** unificar la superficie de integración en el doc canónico del set: lecturas PostgREST, RPC `create_booking`, server actions, webhook y la librería `apps/api-workers`
> **Búsqueda:** keywords: `api, rpc, create_booking, postgrest, rls, webhook, mercadopago, server actions, api-workers, circuit breaker, business_hours, stub` · clasificación: `referencia` · estado: `canónico` · actualizado: 2026-10-17
> **Resumen:** La API de khal: lectura del catálogo vía PostgREST con RLS anon, la reserva vía RPC `create_booking` (contrato de entrada/salida y códigos), server actions de web y admin, el webhook de MercadoPago (presente en código, fuera del producto por decisión de la dueña), la librería de resiliencia `apps/api-workers` y el stub determinista que espeja el contrato para E2E.
> **Parte de:** [[README]] · Relacionados: [[02-arquitectura-stack]], [[flujo-cliente]], [[SECURITY]], [[automations]], [[adr/ADR-0003-e2e-supabase-stub]]

## 1. Lecturas — PostgREST + RLS (rol `anon`)

| Recurso | Regla RLS | Uso |
|---|---|---|
| `services` | `using (is_visible and deleted_at is null)` | Catálogo público (web + sitemap) |
| `business_hours` | lectura anon | Horario del estudio (Lun-Sáb 09:00-18:00, Dom cerrado) |
| `create_booking` | grant execute a `anon, authenticated, service_role` | Reserva (abajo) |

Todo lo demás (turnos, clientas, blacklist, providers, settings) **no es legible por anon** — la RLS de 0001 lo cierra (17/17 tablas, verificadas en vivo).

## 2. Reserva — RPC `create_booking`

```sql
create_booking(uuid, text, text, text, date, integer, uuid, text)
-- (service_id, name, phone, email, date, slot_start_minutes, idempotency_key, client_ip)
```

**Salida (contrato documentado en 0003/0007 y en el stub):**

```json
{ "ok": true, "booking_id": "<uuid>" }
{ "ok": false, "code": "duplicate" | "conflict" | "unavailable" | "blacklisted" | "invalid" }
```

| Código | Significado | UX en la web |
|---|---|---|
| `duplicate` | Misma clienta ya reservó ese turno | `error.duplicate` inline |
| `conflict` | El slot fue tomado mientras reservaba | `error.conflict` inline |
| `unavailable` | El horario ya no es válido: **fuera de la ventana de atención** (desde 0007: el bloque completo `[slot, slot+duración+buffer)` debe entrar en una ventana de `provider_schedules` del profesional o, en su defecto, `business_hours` del estudio) o bloqueado por `calendar_exception` | `error.unavailable` inline |
| `blacklisted` | Clienta bloqueada por el admin | `error.blacklisted` inline |
| `invalid` | Datos inválidos / más de un provider activo por servicio | `error.invalid` inline |

Garantías verificadas en vivo (audit 2026-10-07 + probe matrix ORN-170 2026-10-16): idempotencia por clienta+slot, rechazo de overlap, rechazo de servicio invisible, **rechazo de slots fuera de la ventana de horario** (03:00 y domingos → `unavailable`; 17:00 con bloque de 75min que termina 18:15 → `unavailable`; el override de `provider_schedules` manda sobre `business_hours`).

## 3. Server Actions (verificadas 2026-10-17)

### apps/web (público)

| Acción | Fuente | Notas |
|---|---|---|
| `createBooking` | `apps/web/src/lib/actions/booking.ts` | zod `bookingInputSchema`; idempotency key generada client-side (un retry reenvía la MISMA key); RPC `create_booking`; salida re-validada con `createBookingResultSchema` |
| `getCatalog`, `getService` | `apps/web/src/lib/actions/catalog.ts` | lecturas anon vía RLS; zod defensivo — una row mala se salta, jamás 500 la página de catálogo |
| `createCheckoutPreference` | `apps/web/src/lib/actions/payment.ts` | preferencia de MercadoPago (ver §4: MP fuera del producto) |
| `getPaymentSettings` | `apps/web/src/lib/actions/settings.ts` | lee `global_settings` (seed 2026-09-28); nunca throw en dev local |

### apps/admin (panel)

| Acción | Fuente | Notas |
|---|---|---|
| `fetchServices`, `createService`, `updateService`, `deleteService`, `toggleVisibility`, `uploadServicePhoto`, `bulkIncrease` | `apps/admin/src/lib/actions/services.ts` | **Supabase real**: `getSupabaseServerClient` + `org_id` del claim `app_metadata` + zod antes de cada mutación; contrato `ActionResult<T> = {ok:true,data} \| {ok:false,error}` |
| `transitionAppointment` | `apps/admin/src/lib/actions/appointments.ts` | respaldada por **mock store** (`@/lib/mocks/appointments`) — el dato aún no vive en Supabase |
| `toggleBlacklisted` | `apps/admin/src/lib/actions/clients.ts` | idem mock (`@/lib/mocks/clients`) |
| `addException` | `apps/admin/src/lib/actions/exceptions.ts` | idem mock (`@/lib/mocks/exceptions`) + zod `calendarExceptionInputSchema` |

Todas las admin actions pasan por `requireAuth()` (`@/lib/auth`) y devuelven `{ error }` en fallo.

## 4. Webhooks

`apps/web/src/app/api/webhooks/mercadopago/route.ts` existe en código: `POST` con HMAC-SHA256 verificado en cada llamada (`x-signature` / `x-request-id`), zod `webhookBodySchema` (`400 invalid_json` / `invalid_payload`), claim por evento en `processed_events`, efectos `notifyBookingConfirmed` + `sendBookingReminder`, `200 {received:true}`, `500 mp_not_configured` sin env.

Pero Mercado Pago está **fuera por decisión de la dueña** (dual flow: la operación real es transferencia manual + WhatsApp). No conectar, no provisionar `MP_WEBHOOK_SECRET` salvo decisión explícita.

## 5. apps/api-workers — librería de resiliencia webhook

No es un servicio desplegado: es la capa de resiliencia e integridad **implementada y testeada** que usará el cableado externo (n8n / QStash / Telegram) al momento del provisioning (ver `docs/automations.md` — estado: scaffold listo, infraestructura pendiente).

| Módulo | Regla | Qué hace |
|---|---|---|
| `circuit-breaker.ts` | RESILIENCIA-01 | closed→open→half_open (3 fallos/60s abre, 30s half-open), tiempo inyectable → determinístico |
| `webhook.ts` | WEBHOOKS-01 | `isValidSignature` (HMAC-SHA256, comparación constant-time, capa 3) + `EventDeduplicator` (idempotencia, capa 1) |
| `env.ts` | ENV-01 | schema Zod validado al boot; rechaza arrancar con vars faltantes/malformadas (`N8N_WEBHOOK_SECRET` etc.) |

Pendiente hasta el provisioning: dedup respaldado en `processed_events` y el dispatcher real (fetch + reintentos con backoff/jitter).

## 6. Stub de E2E — el contrato ejecutable

`apps/web/e2e/server.mjs` implementa el mismo contrato (servicios espejo de `supabase/seed.sql`, handler `create_booking`, passthrough de auth) con cero dependencias. **Regla del repo:** si cambiás el contrato de la RPC, cambiás stub + specs juntos — el verde del E2E sin la DB viva valida el CONTRATO, no la DB.

## 7. Entorno

| Variable | Ámbito | Estado en Vercel |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | pública | configurada (prod/preview/dev) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | configurada (prod/preview/dev) |
| `APP_URL` | build | configurada |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | NO deployada (correcto: la web no la usa) |

## Evidencia y re-verificación (gate del doc)

- Grant de la RPC: `supabase/migrations/0003_create_booking_rpc.sql` (assert textual en `apps/web/test/seed-contract.test.ts`).
- Gate de horarios: `supabase/migrations/0007_create_booking_schedule_gates.sql` (+ `.down.sql`) — search_path fijado, ledger `0007`, probe matrix en `reports/probes-live-0007-schedule-gates.log`.
- Verificación en vivo: `docs/audits/rls-verify-khal-2026-10-07.md`.
- Contrato del stub: `apps/web/e2e/server.mjs` + `apps/web/e2e/booking-happy-path.spec.ts`.

```bash
rg --files apps -g 'route.ts' | sort          # 1 route handler (webhooks/mercadopago)
rg -l "'use server'" apps | sort              # server actions (web + admin)
rg -n "\.rpc\(" apps --type ts | sort         # create_booking
```

Cualquier endpoint de este doc debe resolvar a un archivo real. Verificado por última vez: 2026-10-17 (branch `main`).
