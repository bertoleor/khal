# KHAL — Virtual Appointment Agenda

Monorepo (pnpm + Turbo): online service catalog + booking + admin agenda.

**Docs**: `docs/` es la única fuente documental — índice en [`docs/README.md`](docs/README.md). Producto: [`docs/PRODUCTO.md`](docs/PRODUCTO.md) · Seguridad: [`docs/SECURITY.md`](docs/SECURITY.md).

## Apps / packages

| Path | What |
|---|---|
| `apps/web` | Public catalog + booking flow (`es`/`en` via next-intl) |
| `apps/admin` | Staff agenda: appointments, clients, services, blocks |
| `apps/api-workers` | Webhooks (HMAC-SHA256 + idempotency), circuit breaker, worker env |
| `packages/db` | Availability engine (`computeAvailableSlots`, computed never pre-generated) + Supabase migration |
| `packages/validations` | Zod booking schemas |
| `packages/utils` | Money (integer cents), dates, links (WhatsApp) |
| `packages/types`, `packages/ui` | Shared types / UI |

## Quickstart

```bash
pnpm install
pnpm exec turbo run typecheck
pnpm exec vitest run
pnpm exec eslint . --max-warnings 0
pnpm exec prettier --check .
```

Copy `.env.example` to `.env.local` for local runs. Web env is validated
strictly at boot (`apps/web/src/config/env.ts`).

## Production status (2026-10-03)

Los gates que bloqueaban a septiembre ya están resueltos — detalle y evidencia en `docs/`:

- **Auth**: JWT Supabase con claims `app_metadata.role`, fail-closed (`khal_role` mock eliminado — ORN-79, ADR-0001).
- **RLS**: 17/17 tablas con policies, verificadas contra DB viva (go-live 2026-09-28 — `docs/supabase-golive-2026-09-28.md`).
- **Payments**: Mercado Pago Checkout Pro cableado (webhook + HMAC), transferencia manual como fallback.
- **Deploy**: pendiente de registrar URL verificada.

Restante conocido: swap de mocks del admin a Supabase (en revisión), automatizaciones sin provisionar (Turnstile/Sentry/env-only — ver `docs/SECURITY.md` §Aspiracional).

## Docs

- [`docs/README.md`](docs/README.md) — índice completo (producto, seguridad, ADRs, auditorías).
- `openspec/` — specs (`virtual-agenda`, `limpiar-codigo-errores-warnings-tree`).
- [`CHANGELOG.md`](CHANGELOG.md) — cambios del repo.
