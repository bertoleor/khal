# ADR-0003 — E2E strategy: zero-dep Supabase REST stub, not live DB
> Parte de: [[projects/khal/README|README]] · Relacionados: [[06-estado-gates]] · [[KHAL-A6]] · [[02-arquitectura-stack]]

- Status: accepted (implemented with KHAL-A6; recorded 2026-10-15).
- Context: E2E must exercise the booking happy path (the hottest, most churned
  flow) without depending on a live Supabase project, network, or seeded data —
  CI must be deterministic and hermetic.
- Decision: E2E runs against a **zero-dependency Supabase REST stub**
  (`apps/web/e2e/server.mjs`, node:http only, EROS pattern): services rows
  mirroring `supabase/seed.sql` fixtures, `create_booking` RPC handler with the
  `{ok, code, booking_id}` contract, auth passthrough. The Playwright webServer
  spawns the stub, which spawns `next dev`. Specs live in `apps/web/e2e/*.spec.ts`
  (excluded from vitest and app tsconfig by design).
- Consequences: deterministic CI, no secrets in runners, fast bootstrap. The
  stub does NOT validate RLS, real RPC behavior, or concurrency (gates G2/G4
  stay UNVERIFIED live). When the stub contract and live DB drift, the E2E
  green is a lie about production — the RPC contract must be versioned
  together (`packages/db`).
