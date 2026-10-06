# 02 — Arquitectura y stack (cómo se arma)
> Parte de: [[projects/khal/README|README]] · Relacionados: [[03-funciones]] · [[supabase-migration]] · [[ADR-0001-auth-provisoria]]

## Stack

| Capa | Tecnología (versión fijada en `apps/web/package.json`) |
|---|---|
| Framework web | Next.js 15.5.6 (App Router, rutas `[locale]`) |
| UI | React 19.1.0, Tailwind CSS v4 (`@import 'tailwindcss'`, sin `tailwind.config`) |
| i18n | next-intl 3.26.5, locales `es`/`en`, default `es` |
| Datos | Supabase (Postgres + Auth + RLS + Storage + pg_cron) vía `@supabase/supabase-js` 2.45.0 |
| Validación | Zod 3.24.2 en el borde (server actions + env) |
| Monorepo | pnpm workspaces + Turbo (`turbo.json`: `build`/`lint`/`typecheck`/`test`) |
| Tests | Vitest (33/33 en auditoría 2026-09-12), Playwright (`playwright.config.ts`) |
| Async | Upstash Redis/QStash + n8n + Telegram/WhatsApp (scaffold en `apps/api-workers`, pendiente provisioning) |

## Mapa del monorepo

| Path | Qué es |
|---|---|
| `apps/web` | Catálogo público + flujo de reserva (es/en) |
| `apps/admin` | Agenda staff: turnos, clientes, servicios, bloqueos |
| `apps/api-workers` | Webhooks (HMAC-SHA256 + idempotencia), circuit breaker, env validado |
| `packages/db` | Motor de disponibilidad (`computeAvailableSlots`, computado al vuelo, nunca pre-generado) |
| `packages/validations` | Schemas Zod: servicio, `bookingInput`, máquina de estados de turno |
| `packages/utils` | Dinero (centavos enteros), fechas, links WhatsApp |
| `packages/types`, `packages/ui` | Tipos y UI compartidos |
| `supabase/migrations` | `0001_initial_schema` (tablas + RLS), `0002_auth_roles`, `0003_create_booking_rpc` |
| `openspec/` | Specs (`virtual-agenda`, `limpiar-codigo-errores-warnings-tree`, `khal-f3-cierre`) |

## Decisiones de arquitectura (ver `openspec/changes/virtual-agenda/design.md`)

- **Disponibilidad computada (SCH-01):** slots al vuelo desde
  `provider_schedules`/`business_hours` menos `calendar_exceptions` y turnos
  confirmados. Horario mock actual: lun–sáb 09:00–18:00, domingo cerrado
  (`apps/web/src/lib/mocks/schedule.ts`).
- **Dinero entero (MONEY-01):** `price_cents INT` + `currency_code CHAR(3)`;
  `computeAmountDueCents` con `ROUND_HALF_UP` en aritmética entera
  (`packages/utils/src/money.ts`). Seña: `full` / `fixed` / `percentage` (bp).
- **Fechas UTC (DB-01, TZ-01/02):** se guarda UTC, se muestra en
  `America/Argentina/Buenos_Aires`.
- **Estados estrictos (ECOM-03):** `pendiente → confirmado/cancelado/no_asistio`,
  sin saltos (`canTransitionAppointment` en `packages/validations`).
- **Env fail-closed:** `apps/web/src/config/env.ts` valida con Zod al boot y
  rechaza arrancar con variables faltantes. `NEXT_PUBLIC_*` = browser-safe,
  resto = server-only, service-role/QStash = críticas (rotación 90 días).
- **Webhooks desconfiados:** se verifica firma HMAC (`timingSafeEqual`), se
  deduplica por idempotencia y **se re-fetchea el pago** (nunca se confía en
  el body). Mercado Pago por REST puro, sin SDK; el monto se calcula
  server-side (`apps/web/src/lib/actions/payment.ts`).

## Cómo correrlo (de `README.md`)

```bash
pnpm install
pnpm exec turbo run typecheck
pnpm exec vitest run
pnpm exec eslint . --max-warnings 0
pnpm exec prettier --check .
```

Copiar `.env.example` a `.env.local`. Detalle de conexión Supabase:
`docs/supabase-migration.md`. Conexión de automatizaciones:
`docs/automations.md`.
