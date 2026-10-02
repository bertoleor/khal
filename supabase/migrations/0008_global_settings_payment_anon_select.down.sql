-- Khal — 0008 rollback: close the anon read surface on global_settings.
--
-- Reverts 0008_global_settings_payment_anon_select.sql: the storefront falls
-- back to "no payment settings" (getPaymentSettings -> null, transfer section
-- hidden), which is the safe pre-0008 behaviour for customers — never the
-- hardcoded dummy CVU (that mock constant is what A1 filed).
--
-- Does NOT touch:
--   * global_settings_member_all (migration 0001) — members keep full access.
--   * supabase_migrations rows — the CLI's history ledger; removing rows by
--     hand desynchronizes `supabase db push` reconciliation (cf. 0006 down).

begin;

drop policy if exists global_settings_anon_select on public.global_settings;

commit;
