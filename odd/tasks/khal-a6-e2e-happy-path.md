# ODD Feature — khal-a6-e2e-happy-path

> **Búsqueda:** keywords: `e2e, playwright, happy-path, booking, khal-a6, stub-supabase, ci-e2e` · clasificación: `odd-feature` · estado: in-progress · actualizado: 2026-10-02

## Objective
First real E2E test for KHAL: the booking happy path (home → service → reservar → slot → submit → payment screen), plus a CI e2e job that runs it instead of passing vacuously with 0 specs.

## Problem / Why
KHAL-A6 (P2): `apps/web/e2e` does not exist, so `playwright.config.ts` (testDir `./apps/web/e2e`) finds 0 specs. The CI `e2e` job therefore gives a false green (0 specs = exit 0) on PRs/main. The booking flow (catalog → slots → booking → payment) is the repo's hottest spot (7 churn commits on booking-form.tsx + reservar/page.tsx) with zero integration confidence.

## Scope
- In:
  - `apps/web/e2e/` directory with the booking happy-path spec.
  - Zero-dep Supabase REST stub server (EROS `tests/e2e/server.mjs` pattern) so the app runs against deterministic fixtures: services rows, `create_booking` RPC contract `{ok, code, booking_id}`.
  - `playwright.config.ts` wired to the stub (one command, two servers) so server-side fetches hit the stub, not the live project.
  - CI e2e job runs real specs (build step stays).
- Out:
  - A2 availability swap (t_715635aa) — but the spec MUST be written against target behavior (slots from DB data), not dying mocks. The stub models the `business_hours` + `blocked_periods` surface so the A2 branch lands without breaking this spec.
  - A1 CVU/alias mock swap (t_f3bec8b8), A4 antibot/rate-limit.
  - New unit tests (vitest) — A6 is about the E2E layer only.
  - Production seed or DB changes.

## Constraints
- TDD strict: spec first (RED), then infra (GREEN). Runner: Playwright (project standard, `pnpm e2e`).
- Zero-dep stub: node:http only, no new packages (EROS pattern).
- English artifacts, Conventional Commits, work-unit commits, no AI co-author.
- Base branch: khal/orn-80-seed-prod @ 99d4424 (ticket), own worktree `.worktrees/t_2ba19668`.
- Next dev server compiles on demand; webServer timeout must be generous (EROS: 300s).
- vitest must NOT pick up e2e specs: root vitest include is `**/test/**/*.test.ts` — specs live in `apps/web/e2e/*.spec.ts` → safe by default; keep it that way.
- tsconfig of apps/web excludes `e2e` — specs use Playwright globals imported explicitly, no tsconfig changes needed.

## Tasks (stable IDs)
- [ ] T1: Supabase stub server `apps/web/e2e/server.mjs` — services rows (mirroring supabase/seed.sql UUIDs/payloads), create_booking RPC handler returning `{ok:true, code:'ok', booking_id:<uuid>}`, auth 404-free passthrough.
- [ ] T2: Playwright config wired to stub (`webServer.command` spawns stub, stub spawns `next dev`), chromium, generous timeouts.
- [ ] T3: Booking happy-path spec `apps/web/e2e/booking-happy-path.spec.ts`: home → first service → reservar → pick first open day+slot → fill form → submit → payment screen visible with alias/CVU/amounts.
- [ ] T4: CI e2e job verification — job must run specs (non-empty), same trigger as before (PRs/main). Verify with `pnpm e2e` locally + `--list` count > 0.
- [ ] T5: Full verification battery: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check` green in worktree.
- [ ] T6: Commit (work-unit), RDD receipt (`gentle-ai review assess` → follow transitions), push branch.

## Accumulated evidence
- (2026-10-02) Exploratory reads: reservar/page.tsx (slots computed via computeAvailableSlots + businessHoursFor/blockedPeriodsFor), booking-form.tsx (useActionState → createBooking server action), booking.ts action (RPC contract `{ok, code, booking_id}` via PostgREST `client.rpc('create_booking', {...})`), payment-step.tsx (payment screen: alias/CVU copy rows + MP checkout + WhatsApp link), catalog actions (fail-soft null env), serviceSchema, seed.sql fixtures (UUIDs 11111111…/22222222…/33333333…/44444444…), messages/es.json (exact UI strings for selectors).
- (2026-10-02) `git worktree list` → own worktree created at `.worktrees/t_2ba19668` branch `khal/t_2ba19668-e2e-happy-path` @ 99d4424.

## Accepted changes and rationale
- (none yet)

## Next step
- [x] T1 stub + T3 spec drafted (run 1059, pre-crash). RED→GREEN cycle: run `pnpm e2e` locally, fix until green, then CI wiring (T2/T4).

## Progress
- 2026-10-02 (run 1059): Exploration + worktree + ODD doc created. pnpm install started.
- 2026-10-02 (run 1065, resumed after crash): recovered worktree — orphan `index.lock`
  removed via trash.py (auditable), deleted working-tree files restored via `git restore`,
  drafts of server.mjs + spec preserved. Exploration completed against real source:
  - `booking.ts` action: RPC payload keys `p_service_id/p_name/p_phone/p_email/p_date/
    p_slot_start_minutes/p_idempotency_key/p_client_ip` → env vars that gate the flow are
    `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` only (booking-client.ts).
  - `payment.ts` + `mercadopago.ts`: MP env keys are `MP_ACCESS_TOKEN` + `MP_WEBHOOK_SECRET`
    (NOT `MERCADO_PAGO_*` as drafted) — stub must neutralize those so "Pagar online" fails
    closed into the friendly unavailable path; RESEND vars don't exist in khal (notify.ts
    needs checking if the flow touches it).
  - Slots are precomputed server-side per day (reservar/page.tsx:34-54): businessHoursFor
    (Mon-Sat 09:00-18:00, Sunday null) + blockedPeriodsFor (TODAY only: 10:00-11:15 and
    14:30-15:45) + computeAvailableSlots step 15' → first future day offers 09:00-18:00
    slots; today's list starts at 11:15. Spec must pick day dynamically (skip closed
    Sunday), not hardcode slot times.
  - UI strings (messages/es.json): "Elegí el día"/"Elegí el horario"/"Confirmar turno" buttons;
    payment: "Seña pendiente", "Tu turno está reservado." inside `depositPendingBody`
    ("Tu turno está reservado. Transferí {amount} y enviá el comprobante..."), alias `khal.estudio`,
    CVU `0000003100000000000001`, link "Enviar comprobante por WhatsApp".
  - formatCents es-AR: $ 45.000,00 for 4500000 cents; seña 30% of 4500000 = 1350000 cents →
    $ 13.500,00 (deposit display in PaymentStep uses the same formatCents).
  - No .env.local in the worktree → the E2E stub supplies ALL env; catalog/booking fail-soft
    to empty when env missing, so tests must run against the stub, never bare dev.
  - Draft spec issues found (must fix before RED): step 3 day/slot loop is unfinished
    ("hmm" comment, breaks after first day unconditionally), step 5 uses
    `getByText('Nombre')` instead of getByLabel, step 6 asserts strings that don't exist
    ("Seña pendiente" yes, but "Tu turno está reservado." only as part of a longer body,
    "$ 13.500,00" formatting needs verify with actual Intl run). server.mjs exports
    `createBookingCalls` (dead export — nothing imports the stub as a module).
  - vitest include is `apps/**/test/**/*.test.ts` → e2e specs are NOT picked up by unit
    tests. tsconfig excludes `e2e`. eslint ignores playwright-report/test-results.
  - Cleanup done: killed orphan EROS stub holding 127.0.0.1:54321 (node tests/e2e/server.mjs,
    pid 39312, dead parent — leftover of the crashed run).
  - pnpm install restarted in background (proc_720f30f963c8).
