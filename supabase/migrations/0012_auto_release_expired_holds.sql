-- Khal — 0012: auto-release of expired booking holds (D2 second half).
--
-- Owner rule D2 (2026-10-20, odd/tasks/khal-ux-skeletons-v2.md): after 12h
-- without a comprobante the held slot auto-releases. Migration 0011 set the
-- hold TTL to 12 hours; THIS migration adds the sweeper that flips expired
-- rows so the panel state stays honest.
--
-- Live probe evidence (2026-10-22, Management API, ref epykihchzlbbptrvvawg):
-- pg_cron not installed yet (enabled below, idempotent no-op if present),
-- appointments 0 rows, live enum appointment_status = (pendiente, confirmado,
-- cancelado, no_asistio).
--
-- Design decisions:
--   * Released rows become status='cancelado' + hold_released_at=now(). NO
--     enum surgery: Postgres cannot drop an enum value once it exists, so
--     extending the enum today would be effectively irreversible — the D4
--     'liberada' state machine lands with the admin phase (F3/F4) where its
--     real consumers exist. 'cancelado' + hold_released_at fully encodes
--     "auto-released" for the current UI.
--   * The 0007 overlap probe already treats expired pendiente holds as free
--     for NEW bookings, so a delayed sweep never blocks a reservation; this
--     job only corrects row state for the panel.
--   * Helper function (not inlined SQL): service_role can run it manually
--     and the admin phase can reuse it. Scheduled every 10 minutes via
--     pg_cron; naturally idempotent (the WHERE set excludes flipped rows).
--     updated_at is maintained by the set_updated_at trigger from 0001.
--   * pg_cron is enabled OUTSIDE the transaction (idempotent); the job and
--     the helper live INSIDE it, so a mid-migration failure leaves no orphan
--     cron job behind.
--
-- Down: 0012_auto_release_expired_holds.down.sql — unschedules and drops the
-- helper. Rows already released stay released (each was genuinely expired by
-- the D2 rule); the down never resurrects expired holds.

create extension if not exists pg_cron;

begin;

create or replace function public.release_expired_holds()
returns integer
language plpgsql
set search_path = public, extensions
as $$
declare
  v_released integer;
begin
  update public.appointments
     set status = 'cancelado',
         hold_released_at = now()
   where status = 'pendiente'
     and hold_expires_at <= now()
     and hold_released_at is null
     and deleted_at is null;

  get diagnostics v_released = row_count;
  return v_released;
end;
$$;

-- ACL (0009 hardening discipline): maintenance helper — nobody but the cron
-- owner (postgres) and service_role may invoke it. Supabase grants EXECUTE on
-- new public-schema functions to anon/authenticated via ALTER DEFAULT
-- PRIVILEGES, so revoking PUBLIC alone is NOT enough (live evidence
-- 2026-10-22: routine_privileges showed anon+authenticated right after apply).
revoke all on function public.release_expired_holds() from public, anon, authenticated;
grant execute on function public.release_expired_holds() to service_role;

-- Sweep every 10 minutes. Overlap safety does not depend on this schedule
-- (see design notes above); 10 min keeps the panel at most ~10 min behind.
select cron.schedule(
  'khal-release-expired-holds',
  '*/10 * * * *',
  $$select public.release_expired_holds();$$
);

-- ---------------------------------------------------------------------------
-- Ledger (0006 convention): supabase_migrations.schema_migrations is the
-- applied-migrations registry. Idempotent insert.
-- ---------------------------------------------------------------------------
insert into supabase_migrations.schema_migrations (version)
values ('0012')
on conflict (version) do nothing;

commit;
