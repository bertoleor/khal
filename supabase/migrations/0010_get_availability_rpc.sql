-- Khal — 0010: SECURITY DEFINER `get_availability` RPC (KHAL-A2 / t_715635aa).
--
-- Replaces the reservar page's mocks/schedule fixtures: the UI offered slots
-- the real create_booking RPC (0003) rejects and ignored calendar_exceptions
-- and business_hours. This returns the fully computed offerable 'HH:MM'
-- starts for (service, date), mirroring 0003 admission so the UI can never
-- offer a slot the booking RPC rejects.
--
-- jsonb { date, closed, slots }: candidates step by the service duration
-- while duration + buffer fits the business_hours window (0003 ends_at
-- semantics); closed = no window for the weekday, a full-day
-- calendar_exception, or no surviving slot. Weekday bridge (0007 lesson):
-- extract(isodow) 1..7 Mon..Sun % 7 onto day_of_week 0..6 Sun..Sat.
--
-- ACL: anon-only storefront read (NOT the 0003 role trio). UNVERIFIED against
-- a live DB; applying is the owner's manual `supabase db push` step, never
-- automation. Down: 0010_get_availability_rpc.down.sql.

begin;

create or replace function public.get_availability(
  p_service_id uuid,
  p_date      date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_service_row    record;
  v_org_id         uuid;
  v_org_timezone   text;
  v_provider_id    uuid;
  v_offering_count integer;
  v_dow            smallint;
  v_window         record;
  v_window_count   integer;
  v_full_day_block boolean := false;
  v_occupied       boolean := false;
  v_blocked        boolean := false;
  v_occupy         interval;
  v_duration       integer;
  v_open_minutes   integer;
  v_close_minutes  integer;
  v_minutes        integer;
  v_cand_start     timestamptz;
  v_cand_end       timestamptz;
  v_day_start      timestamptz;
  v_day_end        timestamptz;
  v_slot_texts     text[] := '{}';
begin
  -- 1. Service admission (0003 step 1): visible + not soft-deleted.
  select
    s.id, s.organization_id, s.duration_minutes, s.buffer_minutes
  into v_service_row
  from public.services s
  where s.id = p_service_id
    and s.is_visible
    and s.deleted_at is null;

  if v_service_row.id is null then
    return jsonb_build_object('date', p_date::text, 'closed', true, 'slots', '[]'::jsonb);
  end if;

  v_org_id := v_service_row.organization_id;

  select o.timezone into v_org_timezone
  from public.organizations o
  where o.id = v_org_id and o.deleted_at is null;

  if v_org_timezone is null then
    return jsonb_build_object('date', p_date::text, 'closed', true, 'slots', '[]'::jsonb);
  end if;

  -- 2. Single active provider via provider_services (0003 step 2).
  select count(*) into v_offering_count
  from public.provider_services ps
  join public.providers p on p.id = ps.provider_id
  where ps.service_id = p_service_id
    and p.organization_id = v_org_id
    and p.is_active
    and p.deleted_at is null;

  if v_offering_count <> 1 then
    return jsonb_build_object('date', p_date::text, 'closed', true, 'slots', '[]'::jsonb);
  end if;

  select p.id into v_provider_id
  from public.provider_services ps
  join public.providers p on p.id = ps.provider_id
  where ps.service_id = p_service_id
    and p.organization_id = v_org_id
    and p.is_active
    and p.deleted_at is null
  limit 1;

  -- 3. Local day window (org timezone, DB-01 / TZ-02) + weekday bridge.
  v_day_start := p_date::timestamp at time zone v_org_timezone;
  v_day_end   := (p_date + 1)::timestamp at time zone v_org_timezone;
  v_dow       := (extract(isodow from p_date::timestamp)::smallint) % 7;

  select count(*) into v_window_count
  from public.business_hours bh
  where bh.organization_id = v_org_id
    and bh.deleted_at is null
    and bh.day_of_week = v_dow;

  if v_window_count = 0 then
    return jsonb_build_object('date', p_date::text, 'closed', true, 'slots', '[]'::jsonb);
  end if;

  -- 4. Full-day calendar_exception (org- or provider-scoped, SCH-03).
  select exists (
    select 1
    from public.calendar_exceptions ce
    where ce.organization_id = v_org_id
      and ce.deleted_at is null
      and (ce.provider_id is null or ce.provider_id = v_provider_id)
      and ce.starts_at <= v_day_start
      and ce.ends_at >= v_day_end
  ) into v_full_day_block;

  if v_full_day_block then
    return jsonb_build_object('date', p_date::text, 'closed', true, 'slots', '[]'::jsonb);
  end if;

  -- 5. Offerable starts: integer-minute loop (time+interval would wrap past
  --    midnight and never terminate); skip past, booked and blocked slots.
  --    A non-positive duration would never advance the cursor -> closed.
  v_duration := v_service_row.duration_minutes;
  if v_duration is null or v_duration <= 0 then
    return jsonb_build_object('date', p_date::text, 'closed', true, 'slots', '[]'::jsonb);
  end if;

  v_occupy := interval '1 minute' * (v_service_row.duration_minutes + v_service_row.buffer_minutes);

  for v_window in
    select bh.open_time, bh.close_time
    from public.business_hours bh
    where bh.organization_id = v_org_id
      and bh.deleted_at is null
      and bh.day_of_week = v_dow
    order by bh.open_time
  loop
    v_open_minutes  := extract(epoch from v_window.open_time)::integer / 60;
    v_close_minutes := extract(epoch from v_window.close_time)::integer / 60;
    v_minutes       := v_open_minutes;
    while v_minutes + v_service_row.duration_minutes + v_service_row.buffer_minutes <= v_close_minutes loop
      v_cand_start := (p_date::timestamp + (v_minutes * interval '1 minute')) at time zone v_org_timezone;
      v_cand_end   := v_cand_start + v_occupy;

      if v_cand_start > now() then
        select exists (
          select 1
          from public.appointments a
          where a.provider_id = v_provider_id
            and a.deleted_at is null
            and a.status not in ('cancelado', 'no_asistio')
            and not (a.status = 'pendiente' and a.hold_expires_at <= now())
            and a.scheduled_at < v_cand_end
            and a.ends_at > v_cand_start
        ) into v_occupied;

        select exists (
          select 1
          from public.calendar_exceptions ce
          where ce.organization_id = v_org_id
            and ce.deleted_at is null
            and (ce.provider_id is null or ce.provider_id = v_provider_id)
            and ce.starts_at < v_cand_end
            and ce.ends_at > v_cand_start
        ) into v_blocked;

        if not v_occupied and not v_blocked then
          v_slot_texts := array_append(
            v_slot_texts,
            to_char(p_date::timestamp + (v_minutes * interval '1 minute'), 'HH24:MI')
          );
        end if;
      end if;

      v_minutes := v_minutes + v_duration;
    end loop;
  end loop;

  -- 6. Zero surviving slots -> closed: never offer a day the RPC rejects.
  if coalesce(array_length(v_slot_texts, 1), 0) = 0 then
    return jsonb_build_object('date', p_date::text, 'closed', true, 'slots', '[]'::jsonb);
  end if;

  return jsonb_build_object('date', p_date::text, 'closed', false, 'slots', to_jsonb(v_slot_texts));
end;
$$;

-- ACL: anon-only storefront read (deliberately NOT the 0003 role trio).
revoke all on function public.get_availability(uuid, date) from public;
grant execute on function public.get_availability(uuid, date) to anon;

insert into supabase_migrations.schema_migrations (version)
values ('0010')
on conflict (version) do nothing;

commit;
