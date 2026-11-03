-- Khal — 0016: booking add-ons (S6 — "¿Sumás algo más?", preview v7 §4).
--
-- Owner rule S6 (2026-10-26, odd/tasks/v7-clienta-bw-glass.md): the reservar
-- flow gains a curated, cart-free add-on module — Perfilado de cejas
-- (+$18.000) and Kit de higiene (+$5.000, con servicio). The selection is
-- additive on the service total; the seña is NOT recalculated (S7: fixed
-- $10.000). A selection the clienta cannot revisit on her estado link would
-- be dishonest UI, so the data path lands FIRST (same doctrine as 0014):
--
--   * appointments.addons jsonb NULL (additive, idempotent) — array of
--     {"id": <addon id>, "price_cents": <int>} objects. The price is frozen
--     at booking time by the server action from the shared curated catalog
--     (packages/validations BOOKING_ADDON_CATALOG) — the client only ever
--     posts addon IDs, never prices.
--   * create_booking gains p_addons jsonb DEFAULT NULL — the default keeps
--     every existing caller (action, e2e stubs, probes) valid unchanged.
--   * POSTGRES OVERLOAD SAFETY (0014 lesson): a new parameter list makes
--     CREATE OR REPLACE a CREATE (overload). The old 9-arg body is dropped so
--     exactly one create_booking exists; ACL re-issued on the new signature.
--   * get_booking_status v2 (S10 — the 4-state estado): the estado screen
--     needs to (a) tell an auto-released hold (0012: status='cancelado' +
--     hold_released_at) apart from a real cancellation and (b) render the
--     service WITH its add-ons ("Lifting + perfilado"). The RPC therefore
--     also returns hold_released_at, duration_minutes and addons. Still ZERO
--     PII: a timestamp, an integer and the add-on jsonb array — nothing from
--     the 0003 P0 family crosses the door.
--
-- Down: 0016_booking_addons.down.sql — restores the 0014 9-arg body and the
-- 0015 status RPC verbatim, drops the 10-arg overload and the addons column
-- (only the add-on data collected after 0016 is lost).

begin;

-- S6 data path: the curated add-on selection persists on the booking row.
alter table public.appointments
  add column if not exists addons jsonb;

create or replace function public.create_booking(
  p_service_id        uuid,
  p_name              text,
  p_phone             text,
  p_email             text,
  p_date              date,
  p_slot_start_minutes integer,
  p_idempotency_key   uuid default null,
  p_client_ip         text default null,
  p_external_work     boolean default false,
  p_addons            jsonb default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_service_row    record;
  v_org_id         uuid;
  v_org_timezone   text;
  v_provider_id    uuid;
  v_offering_count integer;
  v_phone_hash     text;
  v_scheduled_at   timestamptz;
  v_ends_at        timestamptz;
  v_existing_id    uuid;
  v_client_id      uuid;
  v_conflict       boolean := false;
  v_blocked        boolean := false;
  v_slot_dow       smallint;
  v_block_end      integer;
  v_in_window      boolean := false;
  v_addons         jsonb;
  v_new_id         uuid;
begin
  -- 1. Resolve service + organization (single source of truth for tenant scope).
  select
    s.id,
    s.organization_id,
    s.duration_minutes,
    s.buffer_minutes,
    s.price_cents,
    s.currency_code,
    s.deposit_mode,
    s.is_visible,
    s.deleted_at
  into v_service_row
  from public.services s
  where s.id = p_service_id;

  if v_service_row.id is null or v_service_row.deleted_at is not null or not v_service_row.is_visible then
    return jsonb_build_object('ok', false, 'code', 'invalid', 'booking_id', null);
  end if;

  v_org_id := v_service_row.organization_id;

  select o.timezone into v_org_timezone
  from public.organizations o
  where o.id = v_org_id and o.deleted_at is null;

  if v_org_timezone is null then
    return jsonb_build_object('ok', false, 'code', 'invalid', 'booking_id', null);
  end if;

  -- 2. Resolve the provider offering this service within the org. Deterministic:
  --    require exactly one active offering provider (single-provider agenda).
  select count(*)
    into v_offering_count
  from public.provider_services ps
  join public.providers p on p.id = ps.provider_id
  where ps.service_id = p_service_id
    and p.organization_id = v_org_id
    and p.is_active
    and p.deleted_at is null;

  if v_offering_count <> 1 then
    return jsonb_build_object('ok', false, 'code', 'invalid', 'booking_id', null);
  end if;

  select p.id
    into v_provider_id
  from public.provider_services ps
  join public.providers p on p.id = ps.provider_id
  where ps.service_id = p_service_id
    and p.organization_id = v_org_id
    and p.is_active
    and p.deleted_at is null
  limit 1;

  -- 3. Compute the UTC window from the caller's wall-clock slot (DB-01 / TZ-02:
  --    timezone conversion happens once, using the organization's timezone).
  v_phone_hash := encode(digest(btrim(p_phone), 'sha256'), 'hex');

  v_scheduled_at := (p_date::timestamp + (p_slot_start_minutes * interval '1 minute')) at time zone v_org_timezone;
  v_ends_at := v_scheduled_at + interval '1 minute' * (v_service_row.duration_minutes + v_service_row.buffer_minutes);

  if v_scheduled_at <= now() then
    return jsonb_build_object('ok', false, 'code', 'invalid', 'booking_id', null);
  end if;

  -- 4. Lock the "slot": serialize every booking attempt for this provider.
  --    CONCURRENCIA-01 Level 2 — the provider row is the scheduling invariant.
  perform 1 from public.providers p where p.id = v_provider_id for update;

  -- 5. Idempotent replay: a prior request with the same key already succeeded.
  if p_idempotency_key is not null then
    select a.id into v_existing_id
    from public.appointments a
    where a.idempotency_key = p_idempotency_key
    limit 1;

    if v_existing_id is not null then
      return jsonb_build_object('ok', true, 'code', 'ok', 'booking_id', v_existing_id);
    end if;
  end if;

  -- 6. Blacklist admission: existing client flagged is_blacklisted is rejected.
  select c.id into v_client_id
  from public.clients c
  where c.organization_id = v_org_id
    and c.phone_hash = v_phone_hash
    and c.deleted_at is null
  limit 1;

  if v_client_id is not null then
    if exists (
      select 1 from public.clients c
      where c.id = v_client_id and c.is_blacklisted
    ) then
      return jsonb_build_object('ok', false, 'code', 'blacklisted', 'booking_id', null);
    end if;
  end if;

  -- 7. One pending appointment per phone (duplicate guard).
  select a.id into v_existing_id
  from public.appointments a
  where a.organization_id = v_org_id
    and a.phone_hash = v_phone_hash
    and a.deleted_at is null
    and a.status = 'pendiente'
    and a.hold_expires_at > now()
  limit 1;

  if v_existing_id is not null then
    return jsonb_build_object('ok', false, 'code', 'duplicate', 'booking_id', null);
  end if;

  -- 8. Overlap probe: reject if an active (non-cancelled, non-expired-hold)
  --    appointment already occupies [scheduled_at, ends_at).
  select exists (
    select 1
    from public.appointments a
    where a.provider_id = v_provider_id
      and a.deleted_at is null
      and a.status not in ('cancelado', 'no_asistio')
      and not (a.status = 'pendiente' and a.hold_expires_at <= now())
      and a.scheduled_at < v_ends_at
      and a.ends_at > v_scheduled_at
  ) into v_conflict;

  if v_conflict then
    return jsonb_build_object('ok', false, 'code', 'conflict', 'booking_id', null);
  end if;

  -- 9. Calendar-exception exclusion (SCH-03): org-wide or provider-scoped blocks.
  select exists (
    select 1
    from public.calendar_exceptions ce
    where ce.organization_id = v_org_id
      and ce.deleted_at is null
      and (ce.provider_id is null or ce.provider_id = v_provider_id)
      and ce.starts_at < v_ends_at
      and ce.ends_at > v_scheduled_at
  ) into v_blocked;

  if v_blocked then
    return jsonb_build_object('ok', false, 'code', 'unavailable', 'booking_id', null);
  end if;

  -- 9b. Schedule-window gate (ORN-170 / audit H1): the WHOLE block
  --     [slot_start, slot_start + duration + buffer) must fit inside ONE window
  --     row of the effective schedule for the weekday of p_date.
  v_slot_dow  := extract(dow from p_date)::smallint;
  v_block_end := p_slot_start_minutes + (v_service_row.duration_minutes + v_service_row.buffer_minutes);

  if exists (
    select 1
    from public.provider_schedules ps
    where ps.provider_id = v_provider_id
      and ps.day_of_week = v_slot_dow
      and ps.is_active
      and ps.deleted_at is null
  ) then
    select exists (
      select 1
      from public.provider_schedules ps
      where ps.provider_id = v_provider_id
        and ps.day_of_week = v_slot_dow
        and ps.is_active
        and ps.deleted_at is null
        and extract(epoch from ps.open_time) / 60 <= p_slot_start_minutes
        and extract(epoch from ps.close_time) / 60 >= v_block_end
    ) into v_in_window;
  else
    select exists (
      select 1
      from public.business_hours bh
      where bh.organization_id = v_org_id
        and bh.day_of_week = v_slot_dow
        and bh.deleted_at is null
        and extract(epoch from bh.open_time) / 60 <= p_slot_start_minutes
        and extract(epoch from bh.close_time) / 60 >= v_block_end
    ) into v_in_window;
  end if;

  if not v_in_window then
    return jsonb_build_object('ok', false, 'code', 'unavailable', 'booking_id', null);
  end if;

  -- 10. Upsert the client (CRM source of truth — DB-04 soft delete respected).
  if v_client_id is null then
    insert into public.clients (organization_id, name, phone, phone_hash, email, last_activity_at)
    values (
      v_org_id,
      btrim(p_name),
      btrim(p_phone),
      v_phone_hash,
      nullif(btrim(p_email), ''),
      now()
    )
    returning id into v_client_id;
  else
    update public.clients
    set name = btrim(p_name),
        email = nullif(btrim(p_email), ''),
        last_activity_at = now()
    where id = v_client_id;
  end if;

  -- S6: only a well-formed jsonb array is stored — anything else (scalar,
  --     object, malformed JSON never reaches here: PostgREST rejects it
  --     before the call) collapses to NULL so the row stays honest.
  v_addons := case
    when p_addons is not null and jsonb_typeof(p_addons) = 'array' then p_addons
    else null
  end;

  -- 11. Insert the appointment (MONEY-01 cents; deposit applied at payment step).
  insert into public.appointments (
    organization_id,
    provider_id,
    service_id,
    client_id,
    scheduled_at,
    ends_at,
    status,
    hold_expires_at,
    amount_due_cents,
    currency_code,
    deposit_mode_applied,
    idempotency_key,
    phone_hash,
    ip_hash,
    external_work,
    addons
  )
  values (
    v_org_id,
    v_provider_id,
    p_service_id,
    v_client_id,
    v_scheduled_at,
    v_ends_at,
    'pendiente',
    now() + interval '12 hours',
    v_service_row.price_cents,
    v_service_row.currency_code,
    v_service_row.deposit_mode,
    p_idempotency_key,
    v_phone_hash,
    case when p_client_ip is null then null else encode(digest(p_client_ip, 'sha256'), 'hex') end,
    p_external_work,
    v_addons
  )
  returning id into v_new_id;

  return jsonb_build_object('ok', true, 'code', 'ok', 'booking_id', v_new_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- ACL: the function identity CHANGED (10th param) — grants do not carry over
-- from the 9-arg overload, so they are re-issued on the new signature and
-- the old body is DROPPED (overload safety: exactly one create_booking).
-- ---------------------------------------------------------------------------
revoke all on function public.create_booking(uuid, text, text, text, date, integer, uuid, text, boolean, jsonb) from public;
grant execute on function public.create_booking(uuid, text, text, text, date, integer, uuid, text, boolean, jsonb) to anon, authenticated, service_role;

-- Overload safety: CREATE OR REPLACE with a new parameter list creates a
-- SECOND function, it does not replace the old one — without this drop,
-- PostgREST could still route to the pre-0016 body.
drop function if exists public.create_booking(uuid, text, text, text, date, integer, uuid, text, boolean);

-- ---------------------------------------------------------------------------
-- get_booking_status v2 (S10 — the 4-state estado screen). Same capability
-- door as 0015 (anon + booking UUID), same zero-PII contract; the v2 return
-- adds the three fields the 4-state UI needs to tell the states apart:
--   * hold_released_at — set by the 0012 sweeper: status='cancelado' WITH
--     hold_released_at IS the "reserva no confirmada" (vencida) state; a
--     cancelado WITHOUT it is a real cancellation.
--   * duration_minutes — the pendiente/confirmado rows render "… · 1 h".
--   * addons — the jsonb add-on array, so the service row can read
--     "Lifting + perfilado" exactly like the recibo does.
-- SECURITY DEFINER + search_path discipline unchanged (0006).
-- ---------------------------------------------------------------------------
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
  v_hold_released  timestamptz;
  v_duration_min   integer;
  v_addons         jsonb;
begin
  select a.status::text,
         s.name,
         a.scheduled_at,
         a.hold_expires_at,
         a.hold_released_at,
         s.duration_minutes,
         a.addons
    into v_status, v_service_name, v_scheduled_at, v_hold_expires, v_hold_released, v_duration_min, v_addons
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
    'hold_expires_at', v_hold_expires,
    'hold_released_at', v_hold_released,
    'duration_minutes', v_duration_min,
    'addons', v_addons
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
values ('0016')
on conflict (version) do nothing;

commit;
