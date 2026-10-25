-- Khal — 0014 DOWN: restores the 0011 create_booking (8-arg, 12h TTL) and
-- removes the external_work flag entirely. Full 0011 body below, verbatim.

begin;

create or replace function public.create_booking(
  p_service_id        uuid,
  p_name              text,
  p_phone             text,
  p_email             text,
  p_date              date,
  p_slot_start_minutes integer,
  p_idempotency_key   uuid default null,
  p_client_ip         text default null
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
  --     Resolution (D2): active provider_schedules rows for this provider and
  --     weekday override; if the provider has none that day, the organization's
  --     business_hours apply; if neither exists the day is closed -> reject.
  --     Weekday (D4): extract(dow from p_date), 0=Sun..6=Sat — the wall-clock
  --     date the client picked, same convention as day_of_week in 0001/seed.
  --     Comparison in minute-of-day (D4): extract(epoch from <time>) / 60.
  --     Fit (D3): open <= slot_start AND close >= slot_end, per row — the
  --     exact mirror of computeAvailableSlots (SCH-01/SCH-02).
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
    -- Provider override: only the provider's own windows count for this day
    -- (split shifts allowed: the block must fit within a SINGLE row).
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
    -- Fallback: organization windows for the day. No row for the weekday =>
    -- v_in_window stays false => closed => 'unavailable' (D1).
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
    ip_hash
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
    case when p_client_ip is null then null else encode(digest(p_client_ip, 'sha256'), 'hex') end
  )
  returning id into v_new_id;

  return jsonb_build_object('ok', true, 'code', 'ok', 'booking_id', v_new_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- ACL: same block as 0003, repeated for self-documentation. CREATE OR REPLACE
-- preserves grants (the function identity is stable), so this is a no-op on a
-- healthy DB — and a repair if the ACL ever drifted.
-- ---------------------------------------------------------------------------
revoke all on function public.create_booking(uuid, text, text, text, date, integer, uuid, text) from public;
grant execute on function public.create_booking(uuid, text, text, text, date, integer, uuid, text) to anon, authenticated, service_role;

-- -- Downs never rewrite the ledger (0006/0007/0011/0012 convention).
--
-- Overload safety: remove the 9-arg body so exactly one create_booking
-- remains (the restored 0011 8-arg body above).
drop function if exists public.create_booking(uuid, text, text, text, date, integer, uuid, text, boolean);

-- DATA POLICY: the external_work column is dropped. Only the flag data
-- collected AFTER 0014 is lost; every booking keeps all its other fields
-- (the down of a new feature cannot preserve data that predates it).
alter table public.appointments
  drop column if exists external_work;

commit;
