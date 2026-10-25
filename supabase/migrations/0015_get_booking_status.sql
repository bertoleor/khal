-- Khal — 0015: get_booking_status RPC (T-F2.5 — the estado door).
--
-- Owner-approved screen s05 (confirmación/estado): the clienta can revisit
-- the live state of her booking (badge PENDIENTE/CONFIRMADA, the 12h hold
-- countdown, what happens next). appointments has NO anon select policy
-- (0001: bookings are private), so the screen needs a capability-token
-- door: the clienta holds the booking UUID (handed to her by create_booking
-- at confirm time) and this RPC returns ONLY public-safe fields for it.
--
-- Security shape:
--   * SECURITY DEFINER + search_path public, extensions (0006 discipline).
--   * ZERO PII: no personal field of the 0003 P0 family ever crosses this
--     door — only the status enum, the service display name, and the two
--     timestamps the screen renders. The sealed family stays sealed.
--   * Unknown or soft-deleted bookings answer not_found — the door never
--     leaks existence of anything the caller cannot already name.
--   * anon-only grant (revoke public+authenticated, the 0012 lesson):
--     the dueña reads the agenda as herself; the clienta reads this door as
--     anon with her UUID.
--
-- Ledger: registers as '0015' (0006 convention, idempotent insert).
-- Down: 0015_get_booking_status.down.sql — drops the RPC, nothing else.

begin;

create or replace function public.get_booking_status(p_booking_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_status         text;
  v_service_name   text;
  v_scheduled_at   timestamptz;
  v_hold_expires   timestamptz;
begin
  select a.status::text,
         s.name,
         a.scheduled_at,
         a.hold_expires_at
    into v_status, v_service_name, v_scheduled_at, v_hold_expires
    from public.appointments a
    join public.services s on s.id = a.service_id
   where a.id = p_booking_id
     and a.deleted_at is null;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'ok',
    'status', v_status,
    'service_name', v_service_name,
    'scheduled_at', v_scheduled_at,
    'hold_expires_at', v_hold_expires
  );
end;
$$;

-- Capability door: anon only. The booking UUID IS the capability.
revoke all on function public.get_booking_status(uuid) from public, authenticated;
grant execute on function public.get_booking_status(uuid) to anon;

-- ---------------------------------------------------------------------------
-- Ledger (0006 convention): supabase_migrations.schema_migrations is the
-- applied-migrations registry. Idempotent insert.
-- ---------------------------------------------------------------------------
insert into supabase_migrations.schema_migrations (version)
values ('0015')
on conflict (version) do nothing;

commit;
