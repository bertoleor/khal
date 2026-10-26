-- 0017 down — restore the pre-v7 catalog state.
-- Deletes the 19 inserted services (FK-safe: no appointments can reference
-- them yet at rollback time), restores the 4 mapped rows from the backup
-- table, unwires and retires the "Khal Estudio" provider. Backup tables
-- stay as evidence (drop them by hand once the v7 catalog is confirmed).

begin;

delete from public.provider_services
where service_id::text like '55555555-%';

delete from public.services where id::text like '55555555-%';

update public.services s set
  name = b.name, description = b.description, price_cents = b.price_cents,
  currency_code = b.currency_code, duration_minutes = b.duration_minutes,
  buffer_minutes = b.buffer_minutes, is_visible = b.is_visible,
  sort_order = b.sort_order, deposit_mode = b.deposit_mode,
  deposit_fixed_cents = b.deposit_fixed_cents,
  deposit_percentage_bp = b.deposit_percentage_bp
from public._backup_services_pre_v7_20261026 b
where s.id = b.id
  and s.id in ('11111111-1111-4111-8111-111111111111',
               '22222222-2222-4222-8222-222222222222',
               '33333333-3333-4333-8333-333333333333',
               '44444444-4444-4444-8444-444444444444');

delete from public.providers
where id = '10000000-0000-4000-8000-000000000005';

commit;
