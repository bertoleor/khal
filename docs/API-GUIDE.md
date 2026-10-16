# API Guide — superficie pública de khal

> **Fecha:** 2026-10-15 · **Autor:** 24-gentle (hermes) · **Motivo:** documentar la superficie de integración: lecturas PostgREST, RPC create_booking y el stub de E2E como contrato ejecutable
> **Búsqueda:** keywords: `api, rpc, create_booking, postgrest, rls, webhook, contrato` · clasificación: `product` · estado: `vigente`
> **Resumen:** La API pública del producto: lectura del catálogo vía PostgREST con RLS anon, la reserva vía RPC `create_booking` (contrato de entrada/salida y códigos de error), y el stub determinista que espeja el contrato para E2E. Para integradores, QA y ventas técnicas.
> **Parte de:** [[README]] · Relacionados: [[02-arquitectura-stack]], [[flujo-cliente]], [[SECURITY]], [[adr/ADR-0003-e2e-supabase-stub]]

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
-- (service_id, name, phone, email, date, duration_minutes, provider_id, slot_start)
```

**Salida (contrato documentado en 0003 y en el stub):**

```json
{ "ok": true, "booking_id": "<uuid>" }
{ "ok": false, "code": "duplicate" | "conflict" | "unavailable" | "blacklisted" | "invalid" }
```

| Código | Significado | UX en la web |
|---|---|---|
| `duplicate` | Misma clienta ya reservó ese turno | `error.duplicate` inline |
| `conflict` | El slot fue tomado mientras reservaba | `error.conflict` inline |
| `unavailable` | El horario ya no es válido (fuera de business hours / bloqueo) | `error.unavailable` inline |
| `blacklisted` | Clienta bloqueada por el admin | `error.blacklisted` inline |
| `invalid` | Datos inválidos / más de un provider activo por servicio | `error.invalid` inline |

Garantías verificadas en vivo (audit 2026-10-07): idempotencia por clienta+slot, rechazo de overlap, rechazo de servicio invisible.

## 3. Stub de E2E — el contrato ejecutable

`apps/web/e2e/server.mjs` implementa el mismo contrato (servicios espejo de `supabase/seed.sql`, handler `create_booking`, passthrough de auth) con cero dependencias. **Regla del repo:** si cambiás el contrato de la RPC, cambiás stub + specs juntos — el verde del E2E sin la DB viva valida el CONTRATO, no la DB.

## 4. Webhooks

- `apps/web/src/app/api/webhooks/mercadopago/` existe en código, pero Mercado Pago está **fuera por decisión de la dueña** (dual flow: la operación real es transferencia manual + WhatsApp). No conectar, no provisionar `MP_WEBHOOK_SECRET` salvo decisión explícita.

## 5. Entorno

| Variable | Ámbito | Estado en Vercel |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | pública | configurada (prod/preview/dev) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | configurada (prod/preview/dev) |
| `APP_URL` | build | configurada |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | NO deployada (correcto: la web no la usa) |

## Evidencia

- Grant de la RPC: `supabase/migrations/0003_create_booking_rpc.sql` (assert textual en `apps/web/test/seed-contract.test.ts`).
- Verificación en vivo: `docs/audits/rls-verify-khal-2026-10-07.md`.
- Contrato del stub: `apps/web/e2e/server.mjs` + `apps/web/e2e/booking-happy-path.spec.ts`.
