-- Khal — 0006 rollback: restore create_booking search_path = public.
--
-- Reverts 0006_fix_create_booking_search_path.sql. WARNING: applying this
-- rollback re-introduces the digest() 42883 failure on hosted Supabase
-- (pgcrypto lives in the extensions schema). Only for emergencies where the
-- 0006 change itself must be undone; pair with a follow-up fix.
--
-- Does NOT delete the schema_migrations row: supabase_migrations is the CLI's
-- history ledger; removing rows by hand desynchronizes `supabase db push`
-- reconciliation. A manually-applied rollback is already off-ledger.

begin;

alter function public.create_booking(
  uuid, text, text, text, date, integer, uuid, text
) set search_path = public;

commit;
