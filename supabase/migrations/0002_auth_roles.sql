-- Khal — auth roles on JWT custom claims (G1 P0)
-- Greenfield migration; NOT YET applied to a live Supabase project (UNVERIFIED).
-- Builds on 0001's `org_id()` / `org_role()` claim readers (auth.jwt() -> app_metadata.*).
--
-- Contract (see docs/ADR-0001-auth-provisoria.md):
--   * role  := auth.jwt()->'app_metadata'->>'role'   (never user_metadata — user-editable)
--   * org_id := auth.jwt()->'app_metadata'->>'org_id'
--   * No Supabase project is linked yet; the app layer falls back to the mock
--     `khal_role` cookie when env vars are absent (safe anon default).
--
-- Applied via `supabase db push` when the project is provisioned. Do not run
-- against production without DB-DRIFT-01 pre-inspection.

begin;

-- ---------------------------------------------------------------------------
-- Canonical role resolver. Single source of truth for the allowed role set so
-- app code and RLS agree on the vocabulary. Unknown/missing -> null (anon).
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns text
language sql stable
as $$
  select
    case auth.jwt()->'app_metadata'->>'role'
      when 'admin' then 'admin'
      when 'manager' then 'manager'
      else null
    end;
$$;

-- ---------------------------------------------------------------------------
-- View exposing the caller's resolved role + org to the app layer.
-- Postgres 15+: security_invoker so it does NOT bypass RLS (unlike a normal
-- view, which runs as the owner and leaks rows). Falls back to anon when the
-- request carries no authenticated JWT.
-- ---------------------------------------------------------------------------
create view public.my_auth_context with (security_invoker = true) as
  select
    auth.uid()::uuid as user_id,
    public.current_role() as role,
    public.org_id() as org_id
  where auth.uid() is not null;

-- ---------------------------------------------------------------------------
-- Minimal access policy: this view is readable only by an authenticated
-- caller (identity check), and resolves everything from server-issued claims
-- rather than caller-supplied data. No write path is exposed.
-- ---------------------------------------------------------------------------
revoke all on public.my_auth_context from public, anon;
grant select on public.my_auth_context to authenticated;

-- ---------------------------------------------------------------------------
-- Hardening: `current_role()` and `org_role()` are claim readers (safe, they
-- only inspect auth.jwt()), but revoke EXECUTE from anon to keep the role
-- vocabulary out of the anonymous surface. SERVICE ROLE keeps access so
-- SECURITY DEFINER functions in later slices can still resolve org/role.
-- (These grant/revokes are safe to re-run — idempotent by design.)
-- ---------------------------------------------------------------------------
revoke execute on function public.current_role() from anon;
grant execute on function public.current_role() to authenticated;

commit;