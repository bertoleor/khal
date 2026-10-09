-- Khal — 0010 rollback: drop get_availability.
--
-- Reverts 0010_get_availability_rpc.sql. The storefront fails closed per
-- day afterwards (availability.ts renders all days closed), so pair this
-- with re-applying 0010 promptly in any real incident.
--
-- Does NOT delete the schema_migrations row: supabase_migrations is the
-- CLI's history ledger; removing rows by hand desynchronizes
-- `supabase db push` reconciliation (0006 down convention).

begin;

drop function if exists public.get_availability(uuid, date);

commit;
