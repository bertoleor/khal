-- Khal — Production seed (ORN-80: linkear Supabase + RPC create_booking real).
--
-- Seeds the minimum live data the booking flow requires:
--   * one organization (the studio),
--   * one active provider per service (create_booking requires EXACTLY ONE
--     active offering provider per service — v_offering_count <> 1 returns
--     'invalid'),
--   * the four services from the mock catalog, same UUIDs and payload
--     (apps/web/src/lib/mocks/services.ts) so every URL /servicios/<id> and
--     every RPC call keeps working when the catalog swaps mocks for DB reads,
--   * business_hours Mon-Sat 09:00-18:00 (mirrors the mock schedule; Sunday closed),
--   * store payment settings in global_settings (mirrors lib/mocks/settings.ts).
--
-- Idempotency: every insert is `on conflict ... do nothing` (or updates the
-- upserted row), so re-running against a drifted or partially-seeded database
-- never fails and never duplicates rows. Zero grants/revoke statements — the
-- anon surface stays exactly what 0001/0003 established.
--
-- Money is in ARS cents (MONEY-01). Timezone: America/Argentina/Buenos_Aires.

begin;

-- ---------------------------------------------------------------------------
-- 1. Organization — stable UUID so business_hours / global_settings FKs are
--    deterministic across environments. values ('aaaaaaaa-…') anchor.
-- ---------------------------------------------------------------------------
insert into public.organizations (id, name, timezone, currency_code)
values ('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Khal Studio', 'America/Argentina/Buenos_Aires', 'ARS')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Providers — one per service, all active. Deterministic UUIDs so
--    provider_services and appointments FKs stay stable. The RPC requires
--    exactly ONE active provider offering each service.
-- ---------------------------------------------------------------------------
insert into public.providers (id, organization_id, name, is_active) values
  ('10000000-0000-4000-8000-000000000001', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Pestañas & Lifting', true),
  ('10000000-0000-4000-8000-000000000002', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Extensionista Clásicas', true),
  ('10000000-0000-4000-8000-000000000003', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Extensionista Híbridas', true),
  ('10000000-0000-4000-8000-000000000004', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Extensionista Volumen', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Services — mirror of apps/web/src/lib/mocks/services.ts (same UUIDs).
--    deposit_mode values are enum members (full|fixed|percentage); the CHECK
--    constraint in 0001 requires deposit_fixed_cents for 'fixed' and
--    deposit_percentage_bp for 'percentage'.
-- ---------------------------------------------------------------------------
insert into public.services (
  id, organization_id, name, description, price_cents, currency_code,
  duration_minutes, buffer_minutes, is_visible, sort_order,
  deposit_mode, deposit_fixed_cents, deposit_percentage_bp
) values
  (
    '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    'Lifting de Pestañas',
    'Curvado y lifting de pestañas naturales con fijador de larga duración. Venir sin rímel.',
    4500000, 'ARS', 60, 15, true, 1,
    'percentage', null, 3000
  ),
  (
    '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    'Extensiones Clásicas 1:1',
    'Una extensión por pestaña natural: efecto rimel natural de curvada limpia y duradera.',
    4000000, 'ARS', 90, 15, true, 2,
    'percentage', null, 3000
  ),
  (
    '33333333-3333-4333-8333-333333333333', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    'Extensiones Híbridas',
    'Mix de clásicas y volumen: abanicos suaves para un efecto espeso y natural.',
    4800000, 'ARS', 120, 15, true, 3,
    'percentage', null, 3000
  ),
  (
    '44444444-4444-4444-8444-444444444444', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    'Volumen Ruso',
    'Abanicos hechos a mano 3D-5D: máximo volumen con efecto delineado.',
    5500000, 'ARS', 150, 15, true, 4,
    'percentage', null, 3000
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. provider_services — each service offered by exactly one active provider
--    (RPC invariant). PK is (provider_id, service_id).
-- ---------------------------------------------------------------------------
insert into public.provider_services (provider_id, service_id) values
  ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111'),
  ('10000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222'),
  ('10000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333'),
  ('10000000-0000-4000-8000-000000000004', '44444444-4444-4444-8444-444444444444')
on conflict (provider_id, service_id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. business_hours — store-wide fallback Mon-Sat 09:00-18:00, Sunday closed
--    (mirrors businessHoursFor in lib/mocks/schedule.ts). day_of_week: 0=Sun.
--    CHECK constraints: 0..6 and close_time > open_time.
--    NOTE: 0001 did NOT create a unique constraint on (organization_id,
--    day_of_week) — only the id pkey (verified against the live DB). So the
--    idempotency anchor is the deterministic id pkey: one stable UUID per
--    weekday (20000000-0000-4000-8000-00000000000<day>).
-- ---------------------------------------------------------------------------
insert into public.business_hours (id, organization_id, day_of_week, open_time, close_time) values
  ('20000000-0000-4000-8000-000000000001', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 1, '09:00', '18:00'),
  ('20000000-0000-4000-8000-000000000002', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 2, '09:00', '18:00'),
  ('20000000-0000-4000-8000-000000000003', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 3, '09:00', '18:00'),
  ('20000000-0000-4000-8000-000000000004', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 4, '09:00', '18:00'),
  ('20000000-0000-4000-8000-000000000005', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 5, '09:00', '18:00'),
  ('20000000-0000-4000-8000-000000000006', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 6, '09:00', '18:00')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. global_settings — store payment settings (mirrors lib/mocks/settings.ts).
--    Unique (organization_id, setting_key) → conflict target is that pair.
--    Admin-side content (CMS-01), read by the payment step.
-- ---------------------------------------------------------------------------
insert into public.global_settings (organization_id, setting_key, value) values
  ('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'payment_alias', '"khal.estudio"'::jsonb),
  ('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'payment_cvu', '"0000003100000000000001"'::jsonb),
  ('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'payment_whatsapp_phone', '"5491100000000"'::jsonb)
on conflict (organization_id, setting_key)
do update set value = excluded.value, updated_at = now();

commit;
