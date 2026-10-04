# KHAL — Documento de producto

> **Búsqueda:** keywords: `khal, producto, agenda turnos, estudio estetica, catalogo, reserva, sena, mercadopago, admin` · clasificación: `producto` · estado: `canónico` · actualizado: 2026-10-03
> Relacionados: [[docs/README|índice docs]] · [[docs/SECURITY]] · [[../CHANGELOG]] · [[docs/supabase-migration]] · [[F0-2026-09-27]]

> Única fuente de verdad de producto. Guía técnica de conexión: `docs/supabase-migration.md`. Registro del go-live: `docs/supabase-golive-2026-09-28.md`. Estado de arranque: `docs/F0-2026-09-27.md`.
> Idioma: español rioplatense con voseo. Verificado contra código y seed el 2026-10-03.

## Qué es

**KHAL** es la agenda virtual de turnos de un estudio de estética (pestañas, uñas, cejas). Monorepo pnpm + Turbo con dos apps — `web` pública (catálogo + reserva) y `admin` para la dueña (agenda, clientes, servicios, bloqueos) — más 6 packages compartidos. Un solo estudio: una organización en DB, una operadora.

## Para quién

| Actor | Qué hace | Dónde |
|---|---|---|
| Clienta | Navega el catálogo, reserva turno, paga la seña | `apps/web` (`/[locale]`) |
| Dueña / staff | Administra agenda, clientes, servicios y bloqueos | `apps/admin` (`/admin`) |
| Sistema | Disponibilidad computada, webhooks de pago, liberado de slots | `packages/db`, `apps/api-workers` |

## Catálogo (seed de producción verificado)

| Servicio | Precio (ARS) | Duración | Buffer | Seña | Visible |
|---|---|---|---|---|---|
| Lifting de Pestañas | $45.000 | 60' | 15' | 30% | ✅ |
| Esmaltado Semipermanente | $38.000 | 75' | 15' | Fija $15.000 | ✅ |
| Diseño de Cejas | $28.000 | 45' | 10' | Sin seña (paga todo) | ✅ |
| Spa de Uñas Completo | $55.000 | 90' | 15' | Sin seña | ❌ (`is_visible: false`) |

Horarios: lunes a sábado 09:00–18:00, domingo cerrado (`business_hours` en seed). Los precios son centavos ARS en DB (`MONEY-01`); lo que ves acá es la versión humana.

## Flujo de reserva (web)

1. **Catálogo** `/{locale}` — servicios visibles con precio y duración.
2. **Detalle** `/{locale}/servicios/[id]` — descripción y CTA a reservar.
3. **Reserva** `/{locale}/servicios/[id]/reservar` — día + horario (slots computados al vuelo desde `packages/db`, nunca pre-generados) + datos de la clienta.
4. **Seña** — dos caminos:
   - **Mercado Pago Checkout Pro**: se crea la preferencia server-side (`apps/web/src/lib/actions/payment.ts`) y la clienta paga en MP; el webhook `/api/webhooks/mercadopago` confirma el pago. Cero números de tarjeta en KHAL (delegación total).
   - **Transferencia manual**: alias/CVU + aviso por WhatsApp (fallback; settings en `global_settings`: `payment_alias`, `payment_cvu`, `payment_whatsapp_phone`).
5. **Confirmación por WhatsApp** — link generado con `packages/utils`.

Idiomas: `es` y `en` vía next-intl (ruteo `/{locale}/...`).

## Admin (staff)

- `/login` — Supabase Auth; el rol sale del JWT (`app_metadata.role`), nunca de una cookie editable. **Fail-closed**: cualquier error de sesión/env cierra la puerta (ORN-79, ADR-0001).
- `/admin` — agenda de turnos del día.
- `/admin/clientes`, `/admin/servicios`, `/admin/bloqueos` — ABM de clientes, servicios y bloqueos de agenda.
- Roles: `admin` y `manager` (allow-list en `current_role()`, migración `0002_auth_roles.sql`).

## Datos y reglas duras

- **Supabase PostgreSQL** viva desde 2026-09-28 (RLS en 17/17 tablas). Los bookings de guest entran solo por el RPC `create_booking` (SECURITY DEFINER, validación de solapamientos y horario de negocio en DB).
- **Disponibilidad siempre computada**: `computeAvailableSlots` recalcula desde `business_hours` − turnos − bloqueos; `pg_cron` libera los slots vencidos (TTL).
- **Plata**: enteros en centavos ARS en toda la cadena (sin float).
- **Webhooks**: verificación HMAC-SHA256 + idempotencia por event-id + circuit breaker (`apps/api-workers`).
- Env validado con Zod al booteo, fail-closed (`apps/web/src/config/env.ts`).

## Estado real (2026-10-03, sin humo)

✅ Resuelto: auth JWT fail-closed · RLS 17/17 + RPC verificado contra DB viva · Mercado Pago Checkout Pro cableado · pila de booking web sin mocks.

🔄 En curso: admin todavía lee mocks en parte del stack (swap a Supabase en revisión, ticket t_e9779383) · automatizaciones (n8n/QStash/Telegram/WhatsApp recordatorios) son scaffold sin credenciales — ver `docs/automations.md`.

⚠️ Pendiente de producto: Turnstile (env contract listo, widget no cableado) · Sentry (solo env var) · deploy verificado pendiente de registrar.

## Estructura del monorepo

| Path | Qué es |
|---|---|
| `apps/web` | Catálogo público + reserva + pagos (Next.js 15, React 19, Tailwind 4, next-intl) |
| `apps/admin` | Agenda staff: turnos, clientes, servicios, bloqueos (Next.js 15) |
| `apps/api-workers` | Webhooks (HMAC + idempotencia), circuit breaker, env de workers |
| `packages/db` | Motor de disponibilidad + migraciones Supabase |
| `packages/validations` | Schemas Zod de booking |
| `packages/utils` | Plata (centavos), fechas, links de WhatsApp |
| `packages/types`, `packages/ui` | Tipos compartidos / UI |
