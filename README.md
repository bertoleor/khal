# KHAL — Virtual Appointment Agenda

Monorepo (pnpm + Turbo): online service catalog + booking + admin agenda.

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
strictly at server boot (`apps/web/src/config/env.ts`, imported by
`apps/web/src/instrumentation.ts` — Next instrumentation hook); a missing
REQUIRED var aborts startup with a listing of every bad key. The check is
skipped during `next build` (CI builds without env vars).

## Production gates (blocking)

- **Auth**: admin auth is provisional (cookie `khal_role` mock). Swap to
  Supabase JWT custom claims (`app_metadata.role`) before production.
- **RLS**: policies ship in `supabase/migrations/0001_initial_schema.sql`
  but no live Supabase project is linked — UNVERIFIED against a real DB.
- **Payments**: manual transfer flow (alias/CBU + WhatsApp proof). No
  Mercado Pago / online capture wired.
- **Deploy**: no live URL verified in this repo state.

## Docs

- `DOCS/` — constitution, automations, Supabase migration notes.
- `DOCS/auditoria-nocturna-2026-09-12.md` — latest full audit (UNVERIFIED).
- `openspec/` — specs (`virtual-agenda`, `limpiar-codigo-errores-warnings-tree`).
- `SECURITY.md` — disclosure policy.
