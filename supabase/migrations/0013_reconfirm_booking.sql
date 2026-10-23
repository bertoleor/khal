-- Khal — 0013: manual re-confirm of a late comprobante (D2, third piece).
--
-- Owner rule D2 (2026-10-20, odd/tasks/khal-ux-skeletons-v2.md): after the
-- 12h hold auto-releases (0011 TTL + 0012 sweeper), the dueña can re-confirm
-- the booking manually if the comprobante arrived late AND the slot is still
-- free. This is the backend; the admin panel button lands with F3 and calls
-- this RPC with the dueña's panel session (app_metadata role 'admin' — the
-- same marker the 0001 RLS policies and 0002 current_role() use).
--
-- Contract:
--   * Authorization gate first: org admin only; an unauthorized caller
--     learns nothing, not even whether an id exists.
--   * Only rows the 0012 sweeper auto-released come back through this door:
--     cancelado WITH a release mark. Dueña- or clienta-cancelled rows never
--     do (the release mark is the discriminator).
--   * Future slots only.
--   * Slot freedom is re-checked at call time with the EXACT overlap
--     predicate of 0007 step 8 (active = non-cancelled, non-no-show, minus
--     expired pendiente holds), excluding the row itself.
--   * Effect: status confirmado + confirmed_at=now(). The release mark stays
--     untouched as the D2 audit trail. The guarded final UPDATE is the
--     atomic race-safety against double-taps and concurrent re-confirms; the
--     probe window against brand-new create_booking inserts is the same
--     class of race create_booking itself accepts (no serializable
--     isolation).
--
-- ACL: authenticated only, gated in-function on org role admin; anon
-- revoked explicitly (Supabase ALTER DEFAULT PRIVILEGES grants execute on
-- new public-schema functions to the API roles — the 0012 lesson).
--
-- Ledger: registers as '0013' (0006 convention, idempotent).
-- Down: drops the RPC; rows the dueña already re-confirmed keep their state.

begin;

create or replace function public.reconfirm_booking(p_appointment_id uuid)
returns jsonb
language plpgsql
set search_path = public, extensions
as $$
declare
  v_app      record;
  v_blocking boolean;
begin
  -- 1. Authorization FIRST (0001 org_role() admin marker + 0002 pattern).
  --    Runs before the appointment load so an unauthorized caller learns
  --    nothing about ids.
  if coalesce(public.org_role(), '') <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  -- 2. Load the appointment (soft-deleted rows are invisible).
  select a.* into v_app
    from public.appointments a
   where a.id = p_appointment_id
     and a.deleted_at is null;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  -- 3. Only AUTO-RELEASED holds are re-confirmable: a dueña-cancelled or
  --    clienta-cancelled row must never come back through this door.
  if v_app.status <> 'cancelado' or v_app.hold_released_at is null then
    return jsonb_build_object('ok', false, 'code', 'not_releasable');
  end if;

  -- 4. The past cannot be re-booked.
  if v_app.scheduled_at <= now() then
    return jsonb_build_object('ok', false, 'code', 'past');
  end if;

  -- 5. Slot still free? Exact mirror of the 0007 step-8 overlap predicate,
  --    excluding this very row (it is cancelado, but be explicit).
  select exists (
    select 1
      from public.appointments a
     where a.provider_id = v_app.provider_id
       and a.id <> v_app.id
       and a.deleted_at is null
       and a.status not in ('cancelado', 'no_asistio')
       and not (a.status = 'pendiente' and a.hold_expires_at <= now())
       and a.scheduled_at < v_app.ends_at
       and a.ends_at > v_app.scheduled_at
  ) into v_blocking;

  if v_blocking then
    return jsonb_build_object('ok', false, 'code', 'slot_taken');
  end if;

  -- 6. Re-confirm. The guarded UPDATE is the atomic race-safety: a
  --    concurrent call that slipped past the checks matches 0 rows here.
  --    The release mark is NOT erased — it is the D2 audit trail.
  update public.appointments
     set status = 'confirmado',
         confirmed_at = now()
   where id = p_appointment_id
     and status = 'cancelado'
     and hold_released_at is not null
     and deleted_at is null;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_releasable');
  end if;

  return jsonb_build_object('ok', true, 'code', 'ok', 'appointment_id', p_appointment_id);
end;
$$;

-- ACL (0002 pattern + 0012 lesson): the dueña's panel session only —
-- authenticated with the in-function admin gate; anon has no business here.
revoke all on function public.reconfirm_booking(uuid) from public, anon;
grant execute on function public.reconfirm_booking(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Ledger (0006 convention): supabase_migrations.schema_migrations is the
-- applied-migrations registry. Idempotent insert.
-- ---------------------------------------------------------------------------
insert into supabase_migrations.schema_migrations (version)
values ('0013')
on conflict (version) do nothing;

commit;
