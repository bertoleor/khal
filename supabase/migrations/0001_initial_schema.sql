-- Khal — Virtual Appointment Agenda
-- Initial schema. Greenfield migration; not yet linked to a live Supabase project.
-- Convention sources: docs/agent-constitution.md (DB-01..DB-07, MONEY-01, IDX-01,
-- SCH-01/02/03, ECOM-03, DB-04 soft deletes) and openspec/changes/virtual-agenda/design.md §1.
--
-- Applied via `supabase db push` when the project is provisioned. Do not run against
-- production without DB-DRIFT-01 pre-inspection.

begin;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums (strict lifecycle types — ECOM-03: no boolean flags for state)
-- ---------------------------------------------------------------------------
create type appointment_status as enum ('pendiente', 'confirmado', 'cancelado', 'no_asistio');
create type deposit_mode as enum ('full', 'fixed', 'percentage');
create type exception_type as enum ('holiday', 'vacation', 'event', 'block');

-- ---------------------------------------------------------------------------
-- updated_at trigger (DB-01 / shared convention)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. organizations — store tenant
-- ---------------------------------------------------------------------------
create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  timezone      text not null default 'America/Argentina/Buenos_Aires',
  currency_code char(3) not null default 'ARS',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- ---------------------------------------------------------------------------
-- 2. providers — first-class entity (multi-provider / multi-specialty ready)
-- ---------------------------------------------------------------------------
create table public.providers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name            text not null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ---------------------------------------------------------------------------
-- 3. services — catalog item (SCH-02 duration + buffer; MONEY-01 integer cents)
-- ---------------------------------------------------------------------------
create table public.services (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations (id),
  name                 text not null,
  description          text,
  price_cents          integer not null check (price_cents >= 0),
  currency_code        char(3) not null default 'ARS',
  duration_minutes     integer not null check (duration_minutes > 0),
  buffer_minutes       integer not null default 0 check (buffer_minutes >= 0),
  is_visible           boolean not null default true,
  sort_order           integer not null default 0,
  photo_path           text,
  deposit_mode         deposit_mode,
  deposit_fixed_cents  integer check (deposit_fixed_cents >= 0),
  deposit_percentage_bp integer check (deposit_percentage_bp >= 0 and deposit_percentage_bp <= 10000),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  check (
    (deposit_mode is distinct from 'fixed' or deposit_fixed_cents is not null) and
    (deposit_mode is distinct from 'percentage' or deposit_percentage_bp is not null)
  )
);

-- ---------------------------------------------------------------------------
-- 4. provider_schedules — weekly hours per provider (day_of_week 0=Sun..6=Sat)
-- ---------------------------------------------------------------------------
create table public.provider_schedules (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references public.providers (id),
  day_of_week   smallint not null check (day_of_week between 0 and 6),
  open_time     time not null,
  close_time    time not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  check (close_time > open_time)
);

-- ---------------------------------------------------------------------------
-- 5. business_hours — store-wide fallback when a provider has no schedule
-- ---------------------------------------------------------------------------
create table public.business_hours (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  day_of_week     smallint not null check (day_of_week between 0 and 6),
  open_time       time not null,
  close_time      time not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  check (close_time > open_time)
);

-- ---------------------------------------------------------------------------
-- 6. calendar_exceptions — subtracted from availability (SCH-03)
-- ---------------------------------------------------------------------------
create table public.calendar_exceptions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  provider_id     uuid references public.providers (id),
  exception_type  exception_type not null,
  title           text not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  check (ends_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- 7. appointments — bookings (strict status enum + hold TTL; snapshots)
-- ---------------------------------------------------------------------------
create table public.appointments (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations (id),
  provider_id          uuid not null references public.providers (id),
  service_id           uuid not null references public.services (id),
  client_id            uuid not null,
  scheduled_at         timestamptz not null,
  ends_at              timestamptz not null,
  status               appointment_status not null default 'pendiente',
  hold_expires_at      timestamptz not null,
  hold_released_at     timestamptz,
  amount_due_cents     integer not null check (amount_due_cents >= 0),
  currency_code        char(3) not null default 'ARS',
  deposit_mode_applied deposit_mode,
  idempotency_key      uuid,
  phone_hash           text,
  ip_hash              text,
  confirmed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  check (ends_at > scheduled_at)
);

-- ---------------------------------------------------------------------------
-- 8. clients — CRM source of truth for admission (no-show, blacklist, LTV)
-- ---------------------------------------------------------------------------
create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name            text not null,
  phone           text not null,
  phone_hash      text not null,
  email           text,
  locale          text not null default 'es',
  timezone        text,
  no_show_count   integer not null default 0,
  is_blacklisted  boolean not null default false,
  last_activity_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ---------------------------------------------------------------------------
-- 9. tags — tag dictionary (visual CRM tags)
-- ---------------------------------------------------------------------------
create table public.tags (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  label           text not null,
  color           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ---------------------------------------------------------------------------
-- 10. client_tags — many-to-many client <-> tag
-- ---------------------------------------------------------------------------
create table public.client_tags (
  client_id  uuid not null references public.clients (id) on delete cascade,
  tag_id     uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- 11. notes — internal notes per client and/or appointment
-- ---------------------------------------------------------------------------
create table public.notes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  client_id       uuid references public.clients (id),
  appointment_id  uuid references public.appointments (id),
  author_id       uuid not null references auth.users (id),
  body            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ---------------------------------------------------------------------------
-- 12. audit_logs — append-only business audit (DB-05)
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  actor_id        uuid,
  action          text not null,
  entity          text not null,
  entity_id       uuid,
  before_snapshot jsonb,
  after_snapshot  jsonb,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 13. processed_events — webhook idempotency (WEBHOOKS-01 layer 1)
-- ---------------------------------------------------------------------------
create table public.processed_events (
  event_id     uuid primary key,
  provider     text not null,
  processed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 14. failed_webhooks_log — dead-letter queue (WEBHOOKS-01 layer 2)
-- ---------------------------------------------------------------------------
create table public.failed_webhooks_log (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,
  payload       jsonb,
  status        text,
  error_message text,
  retry_count   integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 15. global_settings — store defaults (deposit fallback, MP alias/cvu) CMS-01
-- ---------------------------------------------------------------------------
create table public.global_settings (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  setting_key     text not null,
  value           jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique (organization_id, setting_key)
);

-- ---------------------------------------------------------------------------
-- 16. security_logs — append-only security events (SLOG-01)
-- ---------------------------------------------------------------------------
create table public.security_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid,
  event      text not null,
  ip         text,
  user_agent text,
  meta       jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 17. provider_services — which provider offers which service
--     (multi-provider / multi-specialty support)
-- ---------------------------------------------------------------------------
create table public.provider_services (
  provider_id uuid not null references public.providers (id) on delete cascade,
  service_id  uuid not null references public.services (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (provider_id, service_id)
);

-- ---------------------------------------------------------------------------
-- Late FK: appointments.client_id -> clients (table created after appointments)
-- ---------------------------------------------------------------------------
alter table public.appointments
  add constraint appointments_client_id_fkey
  foreign key (client_id) references public.clients (id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger trg_organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger trg_providers_set_updated_at before update on public.providers for each row execute function public.set_updated_at();
create trigger trg_services_set_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger trg_provider_schedules_set_updated_at before update on public.provider_schedules for each row execute function public.set_updated_at();
create trigger trg_business_hours_set_updated_at before update on public.business_hours for each row execute function public.set_updated_at();
create trigger trg_calendar_exceptions_set_updated_at before update on public.calendar_exceptions for each row execute function public.set_updated_at();
create trigger trg_appointments_set_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger trg_clients_set_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger trg_tags_set_updated_at before update on public.tags for each row execute function public.set_updated_at();
create trigger trg_notes_set_updated_at before update on public.notes for each row execute function public.set_updated_at();
create trigger trg_global_settings_set_updated_at before update on public.global_settings for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes (IDX-01: every FK + frequent predicates)
-- ---------------------------------------------------------------------------
-- appointments
create index idx_appointments_provider_id on public.appointments (provider_id);
create index idx_appointments_service_id on public.appointments (service_id);
create index idx_appointments_client_id on public.appointments (client_id);
create index idx_appointments_org_scheduled on public.appointments (organization_id, scheduled_at);
create index idx_appointments_org_phone_hash on public.appointments (organization_id, phone_hash);
create index idx_appointments_provider_scheduled_confirmed
  on public.appointments (provider_id, scheduled_at)
  where status = 'confirmado' and deleted_at is null;

-- services
create index idx_services_org_visible on public.services (organization_id, is_visible);
create index idx_services_org_sort on public.services (organization_id, sort_order);

-- providers / schedules / exceptions / clients / notes / audit
create index idx_providers_org on public.providers (organization_id);
create index idx_provider_schedules_provider_dow on public.provider_schedules (provider_id, day_of_week);
create index idx_calendar_exceptions_range
  on public.calendar_exceptions (organization_id, provider_id, starts_at, ends_at);
create index idx_clients_org_phone_hash on public.clients (organization_id, phone_hash);
create index idx_notes_appointment_id on public.notes (appointment_id);
create index idx_notes_client_id on public.notes (client_id);
create index idx_audit_logs_entity on public.audit_logs (entity, entity_id);
create index idx_tags_org on public.tags (organization_id);
create index idx_business_hours_org on public.business_hours (organization_id);
create index idx_global_settings_org on public.global_settings (organization_id);
create index idx_security_logs_created on public.security_logs (created_at);
create index idx_failed_webhooks_created on public.failed_webhooks_log (created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security (DB-02 — enabled on every table)
-- ---------------------------------------------------------------------------
-- Org membership via custom claims in the JWT (org_id, role). Helpers are plain
-- claim readers; membership will be finalized when Supabase is provisioned.
-- Guest writes (appointments/clients) go through SECURITY DEFINER functions
-- (slice 3), so no direct anon INSERT policies are granted here.
-- ---------------------------------------------------------------------------
create or replace function public.org_id()
returns uuid
language sql stable
as $$
  select nullif(auth.jwt()->'app_metadata'->>'org_id', '')::uuid;
$$;

create or replace function public.org_role()
returns text
language sql stable
as $$
  select auth.jwt()->'app_metadata'->>'role';
$$;

alter table public.organizations       enable row level security;
alter table public.providers           enable row level security;
alter table public.services            enable row level security;
alter table public.provider_schedules  enable row level security;
alter table public.business_hours      enable row level security;
alter table public.calendar_exceptions enable row level security;
alter table public.appointments        enable row level security;
alter table public.clients             enable row level security;
alter table public.tags                enable row level security;
alter table public.client_tags         enable row level security;
alter table public.notes               enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.processed_events    enable row level security;
alter table public.failed_webhooks_log enable row level security;
alter table public.global_settings     enable row level security;
alter table public.security_logs       enable row level security;
alter table public.provider_services   enable row level security;

-- organizations: members read their own org
create policy organizations_select on public.organizations for select
  using (id = public.org_id() or public.org_role() = 'admin');

-- providers: anonymous reads active providers for availability
create policy providers_anon_select on public.providers for select
  using (is_active and deleted_at is null);
create policy providers_member_all on public.providers for all
  using (organization_id = public.org_id());

-- services: anon sees visible catalog; members see all
create policy services_anon_select on public.services for select
  using (is_visible and deleted_at is null);
create policy services_member_all on public.services for all
  using (organization_id = public.org_id());

-- provider_schedules: anon reads for availability
create policy provider_schedules_anon_select on public.provider_schedules for select
  using (is_active and deleted_at is null);
create policy provider_schedules_member_all on public.provider_schedules for all
  using (exists (
    select 1 from public.providers p
    where p.id = provider_schedules.provider_id and p.organization_id = public.org_id()
  ));

-- business_hours: anon reads for availability
create policy business_hours_anon_select on public.business_hours for select
  using (deleted_at is null);
create policy business_hours_member_all on public.business_hours for all
  using (organization_id = public.org_id());

-- calendar_exceptions: members only
create policy calendar_exceptions_member_all on public.calendar_exceptions for all
  using (organization_id = public.org_id());

-- appointments: no anon; members read org-scoped; writes via definer fn
create policy appointments_member_select on public.appointments for select
  using (organization_id = public.org_id());
create policy appointments_admin_all on public.appointments for all
  using (organization_id = public.org_id() and public.org_role() in ('admin', 'manager'));

-- clients: no anon; members read org-scoped; writes via definer fn
create policy clients_member_select on public.clients for select
  using (organization_id = public.org_id());
create policy clients_admin_all on public.clients for all
  using (organization_id = public.org_id() and public.org_role() in ('admin', 'manager'));

-- tags / client_tags / notes / global_settings: org-scoped
create policy tags_member_all on public.tags for all
  using (organization_id = public.org_id());
create policy client_tags_member_all on public.client_tags for all
  using (exists (
    select 1 from public.clients c
    where c.id = client_tags.client_id and c.organization_id = public.org_id()
  ));
create policy notes_member_all on public.notes for all
  using (organization_id = public.org_id());
create policy global_settings_member_all on public.global_settings for all
  using (organization_id = public.org_id());

-- append-only tables (DB-05 / SLOG-03): INSERT only, no UPDATE/DELETE policies.
-- audit_logs / processed_events / failed_webhooks_log / security_logs are written
-- by service-role and SECURITY DEFINER functions, so no direct user policies.
create policy audit_logs_insert on public.audit_logs for insert with check (true);
create policy security_logs_insert on public.security_logs for insert with check (true);
create policy processed_events_insert on public.processed_events for insert with check (true);
create policy failed_webhooks_insert on public.failed_webhooks_log for insert with check (true);
create policy failed_webhooks_admin_select on public.failed_webhooks_log for select
  using (public.org_role() in ('admin', 'manager'));

-- provider_services
create policy provider_services_member_all on public.provider_services for all
  using (exists (
    select 1 from public.providers p
    where p.id = provider_services.provider_id and p.organization_id = public.org_id()
  ));

commit;