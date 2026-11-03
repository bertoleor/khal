-- 0017 — v7 catalog: the owner's real price list (sent 2026-10-25),
-- fixed $10.000 deposit on every service (S7), 1h durations until she
-- confirms real ones (S8). Data-only migration: no policy/grant changes.
--
-- Mapping: the 4 seeded mock services UPDATE in place (same UUIDs, so
-- every /servicios/<id> link keeps working); the other 19 rows INSERT
-- with deterministic 5555-UUIDs. One new provider ("Khal Estudio")
-- offers all the new rows so create_booking's exactly-one-active-provider
-- rule holds per service. Idempotent: updates re-apply, inserts conflict
-- to nothing. Reversible: _backup tables + 0017_v7_catalog.down.sql.
--
-- Money: ARS cents (MONEY-01). Timezone: America/Argentina/Buenos_Aires.

begin;

-- ---------------------------------------------------------------------------
-- 0. Backups (AUTO rule: existing data changes are reversible).
-- ---------------------------------------------------------------------------
create table if not exists public._backup_services_pre_v7_20261026 as
  select * from public.services;
create table if not exists public._backup_provider_services_pre_v7_20261026 as
  select * from public.provider_services;

-- ---------------------------------------------------------------------------
-- 1. The 4 seeded rows become the real catalog (UUIDs preserved).
--    deposit: fixed $10.000 everywhere; durations 60' until confirmed.
-- ---------------------------------------------------------------------------
update public.services set
  name = 'Lifting', price_cents = 2800000,
  description = 'Tus pestañas naturales levantadas y curvadas con el lifting del estudio. Vení sin rímel.',
  duration_minutes = 60, buffer_minutes = 15, is_visible = true, sort_order = 1,
  deposit_mode = 'fixed', deposit_fixed_cents = 1000000, deposit_percentage_bp = null
where id = '11111111-1111-4111-8111-111111111111';

update public.services set
  name = 'Clásicas', price_cents = 2600000,
  description = 'Una extensión por pestaña natural: el efecto rimel limpio y natural del estudio.',
  duration_minutes = 60, buffer_minutes = 15, is_visible = true, sort_order = 2,
  deposit_mode = 'fixed', deposit_fixed_cents = 1000000, deposit_percentage_bp = null
where id = '22222222-2222-4222-8222-222222222222';

update public.services set
  name = 'Efecto rímel', price_cents = 2700000,
  description = 'Clásicas con curvita extra para un efecto rímel abierto y despierto.',
  duration_minutes = 60, buffer_minutes = 15, is_visible = true, sort_order = 3,
  deposit_mode = 'fixed', deposit_fixed_cents = 1000000, deposit_percentage_bp = null
where id = '33333333-3333-4333-8333-333333333333';

update public.services set
  name = 'Vol. Tech 5D | U', price_cents = 3100000,
  description = 'Volumen 5D con técnica U, similar al volumen ruso: abanicos cerrados y máximo efecto.',
  duration_minutes = 60, buffer_minutes = 15, is_visible = true, sort_order = 8,
  deposit_mode = 'fixed', deposit_fixed_cents = 1000000, deposit_percentage_bp = null
where id = '44444444-4444-4444-8444-444444444444';

-- ---------------------------------------------------------------------------
-- 2. One provider for everything new (the studio itself).
-- ---------------------------------------------------------------------------
insert into public.providers (id, organization_id, name, is_active)
values ('10000000-0000-4000-8000-000000000005',
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Khal Estudio', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. The 19 new services — owner's list verbatim (names and prices).
-- ---------------------------------------------------------------------------
insert into public.services (
  id, organization_id, name, description, price_cents, currency_code,
  duration_minutes, buffer_minutes, is_visible, sort_order,
  deposit_mode, deposit_fixed_cents, deposit_percentage_bp
) values
  ('55555555-5555-4555-8555-000000000004', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Vol. Tech 3D', 'Abanicos 3D hechos a mano: volumen con efecto natural.', 2800000, 'ARS', 60, 15, true, 4, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000005', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Brasileras', 'Efecto brasileño: pestañas espesas y curvadas con onda.', 2900000, 'ARS', 60, 15, true, 5, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000006', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Vol. Tech 4D', 'Abanicos 4D: más volumen con terminación suave.', 3000000, 'ARS', 60, 15, true, 6, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000007', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Vol. Tech 5D', 'Volumen 5D: el máximo efecto del estudio.', 3100000, 'ARS', 60, 15, true, 7, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000009', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Perfilado de cejas', 'Perfilado con pinza, bandas de cera fría y técnica de visajismo.', 1800000, 'ARS', 60, 15, true, 9, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000010', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Henna', 'Henna con perfilado incluido: color y forma por semanas.', 2500000, 'ARS', 60, 15, true, 10, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000011', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Laminado', 'Laminado con perfilado incluido: cejas peinadas y fijadas.', 2500000, 'ARS', 60, 15, true, 11, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000012', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Clásicas + Perfilado', 'El combo de pestañas clásicas con perfilado de cejas.', 3900000, 'ARS', 60, 15, true, 12, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000013', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Lifting + Laminado / henna', 'Lifting de pestañas con laminado o henna de cejas.', 4600000, 'ARS', 60, 15, true, 13, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000014', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Brasileras + Perfilado', 'Brasileras con perfilado de cejas.', 3900000, 'ARS', 60, 15, true, 14, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000015', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Brasileras + Laminado / henna', 'Brasileras con laminado o henna de cejas.', 4900000, 'ARS', 60, 15, true, 15, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000016', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Vol 4D + Perfilado', 'Volumen 4D con perfilado de cejas.', 4300000, 'ARS', 60, 15, true, 16, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000017', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Vol 4D + Laminado / henna', 'Volumen 4D con laminado o henna de cejas.', 5100000, 'ARS', 60, 15, true, 17, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000018', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Remoción mía', 'Remoción de extensiones colocadas en el estudio.', 500000, 'ARS', 60, 15, true, 18, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000019', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Remoción de otra colega', 'Remoción de extensiones colocadas por otra profesional.', 1000000, 'ARS', 60, 15, true, 19, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000020', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Mala praxis leve', 'Corrección de aplicación irregular leve de otra profesional.', 1000000, 'ARS', 60, 15, true, 20, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000021', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Mala praxis media', 'Corrección de aplicación irregular media de otra profesional.', 1500000, 'ARS', 60, 15, true, 21, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000022', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Kit de higiene', 'Kit para comprar solo: lash shampoo, brocha y peine con tapa.', 800000, 'ARS', 60, 15, true, 22, 'fixed', 1000000, null),
  ('55555555-5555-4555-8555-000000000023', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Kit de higiene (con servicio)', 'El kit sumado a tu turno: shampoo, brocha y peine con tapa.', 500000, 'ARS', 60, 15, true, 23, 'fixed', 1000000, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Wire the new services to the new provider (constraint-free idempotency).
-- ---------------------------------------------------------------------------
insert into public.provider_services (provider_id, service_id)
select '10000000-0000-4000-8000-000000000005', s.id
from public.services s
where s.id::text like '55555555-%'
  and not exists (
    select 1 from public.provider_services ps
    where ps.provider_id = '10000000-0000-4000-8000-000000000005'
      and ps.service_id = s.id
  );

commit;
