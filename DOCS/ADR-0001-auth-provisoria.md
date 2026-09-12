# ADR-0001 — Provisional admin auth (cookie role mock)

- Status: accepted (temporary).
- Context: no Supabase Auth linked yet; admin needs a role gate now.
- Decision: `apps/admin/src/lib/auth.ts` gates on `khal_role` cookie;
  single swap point (`requireAuth` / `getRole`) for Supabase JWT
  custom claims (`auth.jwt() -> app_metadata.role`).
- Consequences: NOT production-safe (client-settable cookie). Migration
  `0001_initial_schema.sql` already defines `app_org_id()` /
  `app_role()` helpers expecting the JWT claims — RLS assumes them.
- Exit criteria: Supabase project linked + JWT claims issued +
  `requireAuth` verifying JWT + E2E login test. (UNVERIFIED)
