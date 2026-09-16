# 03 — Funciones

Fuente: `DOCS/reporte-producto-marketing-estilo-2026-09-12.md` §1 +
`openspec/changes/virtual-agenda/proposal.md` + lectura de
`apps/web/src` y `packages/*`. Datos en memoria hasta linkear Supabase.

## Web pública (`apps/web`)

| Función | Dónde | Detalle |
|---|---|---|
| Catálogo | `components/catalog/catalog-grid.tsx`, `lib/actions/catalog.ts` | Grid de servicios visibles (`is_visible`), ordenados (`sort_order`) |
| Detalle | `app/[locale]/servicios/[id]` | Ficha + barra sticky precio/CTA |
| Selector de turnos | `components/booking/slot-picker.tsx` | Días (lun–sáb) + grilla de horarios de `computeAvailableSlots`; `aria-pressed` |
| Form express | `components/booking/booking-form.tsx` | Nombre/teléfono/email, validación Zod (`bookingInputSchema`: fecha `YYYY-MM-DD`, hora `HH:MM`) |
| Reserva server-side | `lib/actions/booking.ts` | Llama RPC `create_booking` (overlap + idempotencia UUID); sin env → `unavailable` amigable |
| Seña manual | `components/payment/payment-step.tsx` | Alias/CBU + copiar (`aria-live`) + link WhatsApp con mensaje pre-llenado |
| Mercado Pago | `lib/mercadopago.ts`, `lib/actions/payment.ts`, `app/api/webhooks/mercadopago/route.ts` | Checkout Pro REST, `external_reference` = id de turno, webhook HMAC + re-fetch. **Sin credenciales → cae a manual** |
| Errores amigables | `app/error.tsx`, `app/not-found.tsx` | Mensajes i18n + CTA reintentar / ir al inicio; códigos `duplicate/conflict/unavailable/blacklisted` |

### Catálogo mock actual (`lib/mocks/services.ts`)

| Servicio | Precio (ARS) | Duración | Buffer | Seña | Visible |
|---|---|---|---|---|---|
| Lifting de Pestañas | $45.000 | 60' | 15' | 30% (3000bp) | ✅ |
| Esmaltado Semipermanente | $38.000 | 75' | 15' | fija $15.000 | ✅ |
| Diseño de Cejas | $28.000 | 45' | 10' | full | ✅ |
| Spa de Uñas Completo | $55.000 | 90' | 15' | — | ❌ oculto |

## Admin (`apps/admin`)

| Función | Detalle |
|---|---|
| Agenda día/semana | Tarjetas de turno con puntos de estado y acciones |
| Clientes / CRM | LTV, no-show count, lista negra, tags visuales, notas por turno |
| Servicios | Crear/editar precio, mostrar-ocultar, alta, acciones bulk (ej. "Subir 10% a seleccionados") |
| Bloqueos | `holiday/vacation/event/block` — se restan de la disponibilidad |
| Auth | `requireAuth` + JWT `app_metadata.role` (**código listo**, fallback a cookie `khal_role` mock hasta provisionar — ver ADR-0001) |

## Automatizaciones (`apps/api-workers` + `DOCS/automations.md`)

- **Recordatorio 24h:** Supabase Database Webhook (`INSERT appointments`
  `status='confirmado'`) → n8n → WhatsApp Business API. QStash para entrega
  programada exacta + reintentos.
- **Alerta a la dueña:** Telegram Bot en turno nuevo / confirmación.
- **TTL anti-fantasmas:** `pg_cron` libera holds vencidos.
- **Resiliencia:** circuit breaker closed→open→half-open (3 fallos/60s abre,
  30s half-open), `EventDeduplicator` (en memoria hoy; en prod se respalda en
  `processed_events`), DLQ `failed_webhooks_log`.
- Estado: **scaffold listo, infraestructura pendiente** (sin endpoints reales
  no hay `fetch` de dispatch con backoff/jitter — RES-02).
