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
strictly at boot (`apps/web/src/config/env.ts`).

## Production gates (blocking)

- **Auth**: resolved (ADR-0001 applied, ORN-79) — the `khal_role` cookie mock is
  fully removed; `requireAuth` verifies a Supabase session and resolves the role
  from the JWT `app_metadata.role` claim, fail-closed. Real OTP login ships in
  `apps/admin` (`login-form.tsx`); the staff user holds the `admin` claim.
- **RLS**: policies ship in `supabase/migrations/0001_initial_schema.sql`
  but no live Supabase project is linked — UNVERIFIED against a real DB.
- **Payments**: manual transfer flow (alias/CBU + WhatsApp proof). No
  Mercado Pago / online capture wired.
- **Deploy**: no live URL verified in this repo state.

## Docs

- `docs/` — constitution, automations, Supabase migration notes.
- `docs/auditoria-nocturna-2026-09-12.md` — latest full audit (UNVERIFIED).
- `openspec/` — specs (`virtual-agenda`, `limpiar-codigo-errores-warnings-tree`).
- `docs/SECURITY.md` — disclosure policy (pendiente mover a raíz, ORN-220).
- Set infaltables v2 (rutas canónicas): [AGENTS.md](AGENTS.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [CHANGELOG.md](CHANGELOG.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [LICENSE](LICENSE) · [DESIGN.md](docs/DESIGN.md) · [API.md](docs/API.md) · [DATABASE.md](docs/DATABASE.md) · [plan-accion-2026-09-12.md](docs/plan-accion-2026-09-12.md).
