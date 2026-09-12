# ADR-0001 — Provisional admin auth (cookie role mock) -> Supabase JWT claims

- Status: accepted (temporary) — **UNVERIFIED** until a Supabase project is linked.
- Context: no Supabase Auth linked yet; admin needs a role gate now.
- Decision (G1 P0 migration, CODE READY-TO-APPLY):
  - `apps/admin/src/lib/auth.ts` now verifies the session via `@supabase/ssr`
    (`auth.getUser()`) and resolves role from the server-issued JWT custom claim
    `app_metadata.role` (never `user_metadata` — user-editable, unsafe).
  - `apps/admin/src/lib/supabase/server.ts` builds the canonical per-request
    `createServerClient` with the Next.js cookie store.
  - Migration `supabase/migrations/0002_auth_roles.sql` adds `current_role()`
    (allow-list resolver for `admin`/`manager`) and a `security_invoker`
    `my_auth_context` view, plus minimal grant/revoke hardening.
  - **Fallback:** when `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` are absent
    (no project provisioned), `requireAuth`/`getRole` degrade to the previous
    `khal_role` cookie mock so local dev does not break.
- Consequences: the cookie mock is NOT production-safe (client-settable). Until
  Supabase is provisioned and JWT claims are issued by the auth service, the
  fallback path is active and the real JWT path is UNVERIFIED.
- Exit criteria: Supabase project linked + JWT `app_metadata.role` claims issued
  + `requireAuth` verifying JWT (fallback removed) + E2E login test. (UNVERIFIED)