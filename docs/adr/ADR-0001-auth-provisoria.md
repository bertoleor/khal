# ADR-0001 — Provisional admin auth (cookie role mock) -> Supabase JWT claims
> Parte de: [[projects/khal/README|README]] · Relacionados: [[ADR-CONVENTION]] · [[ADR-TEMPLATE]] · [[02-arquitectura-stack]] · [[03-funciones]]

- Status: superseded (2026-09-27) — the `khal_role` cookie mock has been fully
  removed (ORN-79). The JWT claims path described below is now the ONLY path.
- Context: no Supabase Auth linked yet; admin needs a role gate now.
- Decision (G1 P0 migration, APPLIED):
  - `apps/admin/src/lib/auth.ts` verifies the session via `@supabase/ssr`
    (`auth.getUser()`) and resolves role from the server-issued JWT custom claim
    `app_metadata.role` (never `user_metadata` — user-editable, unsafe).
  - `apps/admin/src/lib/supabase/server.ts` builds the canonical per-request
    `createServerClient` with the Next.js cookie store.
  - Migration `supabase/migrations/0002_auth_roles.sql` adds `current_role()`
    (allow-list resolver for `admin`/`manager`) and a `security_invoker`
    `my_auth_context` view, plus minimal grant/revoke hardening.
  - ~~Fallback: when env vars are absent, `requireAuth`/`getRole` degrade to the
    `khal_role` cookie mock~~ — **REMOVED 2026-09-27 (ORN-79)**: any error
    (env misconfig, network, invalid session) now fails CLOSED. The old
    fallback turned an infra outage into an open admin door.
  - Edge middleware (`apps/admin/src/middleware.ts`) no longer trusts any
    cookie for the role decision: it only redirects cookie-less requests to
    `/login` as a UX shell check; authorization happens server-side in every
    admin server action via `requireAuth()`.
  - The login page no longer mints credentials; it is informational until the
    Supabase email/password sign-in form lands (tracked with ORN-80 scope).
- Consequences: nobody can self-grant admin by setting a cookie. Admin actions
  require a verified Supabase session with `app_metadata.role` in
  {admin, manager}. Until staff users are provisioned in Supabase Auth with
  that claim, admin actions fail closed (by design).
- Exit criteria: ~~Supabase project linked + JWT claims issued + fallback
  removed + E2E login test~~ — project linked + fallback removed + staff user
  provisioned: DONE (verified live 2026-10-18, ORN-167: `auth.users` holds the
  owner account, confirmed, with `app_metadata.role = admin` + `org_id`).
  Login flow: real OTP sign-in shipped (`apps/admin/src/components/admin/login-form.tsx`,
  T3 khal-admin-100-operable) and covered by contract tests (`login-contract.test.ts`
  7/7, `auth.test.ts` 10/10 — 17/17 green); admin playwright e2e remains out of
  scope by cycle decision (playwright infra is web-only).
