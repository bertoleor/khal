-- Khal — 0007 DOWN: rollback business_hours guard (restores the 0006 body).
--
-- This restores create_booking to the exact definition it had after 0006
-- (search_path = public, extensions) WITHOUT the step-9 business_hours
-- probe. The 0003 step-9 calendar_exceptions exclusion is preserved.
--
-- After rollback, out-of-hours slots are again accepted by the RPC; the UI
-- availability path (A2) must absorb that responsibility, which is what
-- motivated 0007 in the first place. Rollback is intended for emergency
-- revert only.
--
-- Idempotent: create or replace + on conflict.

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
  v_new_id         uuid;
begin
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

  v_phone_hash := encode(digest(btrim(p_phone), 'sha256'), 'hex');

  v_scheduled_at := (p_date::timestamp + (p_slot_start_minutes * interval '1 minute')) at time zone v_org_timezone;
  v_ends_at := v_scheduled_at + interval '1 minute' * (v_service_row.duration_minutes + v_service_row.buffer_minutes);

  if v_scheduled_at <= now() then
    return jsonb_build_object('ok', false, 'code', 'invalid', 'booking_id', null);
  end if;

  perform 1 from public.providers p where p.id = v_provider_id for update;

  if p_idempotency_key is not null then
    select a.id into v_existing_id
    from public.appointments a
    where a.idempotency_key = p_idempotency_key
    limit 1;

    if v_existing_id is not null then
      return jsonb_build_object('ok', true, 'code', 'ok', 'booking_id', v_existing_id);
    end if;
  end if;

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

  -- (0007 step-9 business_hours guard INTENTIONALLY absent — this is the
  -- pre-0007 body kept verbatim as the rollback target.)

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
    now() + interval '15 minutes',
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

insert into supabase_migrations.schema_migrations (version)
values ('0007-down')
on conflict (version) do nothing;

commit;
