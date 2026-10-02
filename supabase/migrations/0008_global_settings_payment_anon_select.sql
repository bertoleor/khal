-- Khal — 0008: global_settings anon read surface for store payment settings.
--
-- [KHAL-A1 / t_f3bec8b8] The booking flow's payment step needs the store's
-- real transfer details (alias / CVU / WhatsApp). They live in
-- public.global_settings (seed 2026-09-28, CMS-01 — admin-editable content),
-- but migration 0001 only created the member policy `global_settings_member_all`:
-- the anon storefront key sees ZERO rows, which is what pushed the web app to
-- the hardcoded mock in the first place (mocks/settings.ts, audit A1).
--
-- This migration opens the minimal read surface: a dedicated SELECT policy
-- scoped to the three storefront payment keys, soft-delete aware. Everything
-- else in global_settings stays member-only (deposit fallbacks, future keys).
--
-- Surface contract:
--   * SELECT only — no anon write path is opened here.
--   * setting_key IN ('payment_alias', 'payment_cvu', 'payment_whatsapp_phone')
--     — exactly the keys supabase/seed.sql §6 plants and lib/actions/settings.ts
--     queries. Adding a new storefront key means touching this list on
--     purpose, not by accident.
--   * deleted_at IS NULL — a soft-deleted row must stop paying the bill it
--     was paying before (mirrors business_hours_anon_select).
--
-- Idempotent: drop policy if exists, then create. Re-running is a no-op.
--
-- Down: 0008_global_settings_payment_anon_select.down.sql.

begin;

drop policy if exists global_settings_anon_select on public.global_settings;

create policy global_settings_anon_select on public.global_settings
  for select
  to anon
  using (
    deleted_at is null
    and setting_key in ('payment_alias', 'payment_cvu', 'payment_whatsapp_phone')
  );

insert into supabase_migrations.schema_migrations (version)
values ('0008')
on conflict (version) do nothing;

commit;
