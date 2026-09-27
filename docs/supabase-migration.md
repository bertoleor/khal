# Supabase Migration & Connection Guide
> Parte de: [[projects/khal/README|README]] · Relacionados: [[02-arquitectura-stack]] · [[03-funciones]]

This document provides everything needed to connect the Khal application to a live Supabase project. It references the initial schema at `supabase/migrations/0001_initial_schema.sql` and the AGENT CONSTITUTION rules (DB-01 through DB-07, MONEY-01, IDX-01, etc.).

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Connection Setup](#connection-setup)
3. [Schema Reference](#schema-reference)
4. [RLS Policies](#rls-policies)
5. [Auth JWT Claims Structure](#auth-jwt-claims-structure)
6. [Required Indexes](#required-indexes)
7. [Migrations Workflow](#migrations-workflow)
8. [Type Generation](#type-generation)

---

## 1. Environment Variables

All required variables are defined in `.env.example`. Copy to `.env.local`:

```bash
cp .env.example .env.local
```

### PUBLIC (NEXT_PUBLIC_ — safe in browser bundle)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (for form protection) |

### SERVER (no prefix — server-only)

| Variable | Description |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (rate limiting, caching) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `UPSTASH_QSTASH_TOKEN` | Upstash QStash token (async job queue) |
| `N8N_WEBHOOK_URL` | n8n webhook URL (notification dispatch) |
| `N8N_WEBHOOK_SECRET` | n8n webhook HMAC secret |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (alerts) |
| `TELEGRAM_CHAT_ID` | Telegram chat ID (alerts) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |
| `SENTRY_DSN` | Sentry DSN for error monitoring |

### CRITICAL (rotated every 90 days — SEC-02)

| Variable | Description |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, bypasses RLS) |
| `QSTASH_CURRENT_SIGNING_KEY` | Upstash QStash signing key |

---

## 2. Connection Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users (South America recommended for ARS currency)
3. Note the project URL and keys from Settings → API

### Step 2: Run Initial Migration

The schema is in `supabase/migrations/0001_initial_schema.sql`. Apply it:

```bash
# Option A: Supabase CLI (recommended)
supabase db push

# Option B: Manual via Supabase Dashboard SQL Editor
# Copy the contents of 0001_initial_schema.sql and run it
```

**Important**: Before applying to production, follow DB-DRIFT-01 — inspect current schema first.

### Step 3: Enable Required Extensions

The migration enables `pgcrypto`. Verify it's active:

```sql
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
```

### Step 4: Configure Auth

1. Enable Email/Password auth in Authentication → Providers
2. Enable Google OAuth in Authentication → Providers → Google
3. Set redirect URLs for your domain
4. Configure JWT template to include custom claims (see [Auth JWT Claims](#auth-jwt-claims-structure))

---

## 3. Schema Reference

### Enums

| Enum | Values | Purpose |
|---|---|---|
| `appointment_status` | `pendiente`, `confirmado`, `cancelado`, `no_asistio` | Appointment lifecycle (ECOM-03) |
| `deposit_mode` | `full`, `fixed`, `percentage` | Deposit types |
| `exception_type` | `holiday`, `vacation`, `event`, `block` | Calendar exceptions (SCH-03) |

### Tables (17 total)

#### Core Business

| Table | Purpose | Key Columns |
|---|---|---|
| `organizations` | Multi-tenant root | `id`, `name`, `timezone`, `currency_code`, `deleted_at` |
| `providers` | Service providers | `id`, `organization_id`, `name`, `is_active`, `deleted_at` |
| `services` | Service catalog | `id`, `organization_id`, `name`, `price_cents` (MONEY-01), `duration_minutes`, `buffer_minutes`, `deleted_at` |
| `provider_services` | Many-to-many provider ↔ service | `provider_id`, `service_id` |

#### Scheduling

| Table | Purpose | Key Columns |
|---|---|---|
| `provider_schedules` | Weekly hours per provider | `provider_id`, `day_of_week` (0=Sun..6=Sat), `open_time`, `close_time` |
| `business_hours` | Store-wide fallback hours | `organization_id`, `day_of_week`, `open_time`, `close_time` |
| `calendar_exceptions` | Blocked periods (SCH-03) | `organization_id`, `provider_id`, `exception_type`, `starts_at`, `ends_at` |

#### Appointments & CRM

| Table | Purpose | Key Columns |
|---|---|---|
| `appointments` | Bookings | `organization_id`, `provider_id`, `service_id`, `client_id`, `scheduled_at`, `status`, `hold_expires_at`, `amount_due_cents`, `deleted_at` |
| `clients` | CRM source of truth | `organization_id`, `name`, `phone`, `phone_hash`, `email`, `no_show_count`, `is_blacklisted`, `deleted_at` |
| `tags` | Visual CRM tags | `organization_id`, `label`, `color`, `deleted_at` |
| `client_tags` | Many-to-many client ↔ tag | `client_id`, `tag_id` |
| `notes` | Internal notes | `organization_id`, `client_id`, `appointment_id`, `author_id`, `body`, `deleted_at` |

#### System & Audit

| Table | Purpose | Key Columns |
|---|---|---|
| `audit_logs` | Business audit trail (DB-05) | `actor_id`, `action`, `entity`, `entity_id`, `before_snapshot`, `after_snapshot` |
| `security_logs` | Security events (SLOG-01) | `actor_id`, `event`, `ip`, `user_agent`, `meta` |
| `processed_events` | Webhook idempotency (WEBHOOKS-01) | `event_id` (PK), `provider`, `processed_at` |
| `failed_webhooks_log` | Dead letter queue (WEBHOOKS-01) | `provider`, `payload`, `status`, `error_message`, `retry_count` |
| `global_settings` | Store defaults (CMS-01) | `organization_id`, `setting_key`, `value` (JSONB) |

### Soft Deletes (DB-04)

All user-facing tables include `deleted_at timestamptz`. Records are never physically deleted — `deleted_at` is set to the current UTC timestamp. Queries exclude soft-deleted records via RLS or filters.

### Monetary Values (MONEY-01)

All monetary columns use `integer` (centavos for ARS, cents for USD). Display conversion: `(amountInCents / 100).toFixed(2)` at the render layer only.

---

## 4. RLS Policies

RLS is enabled on every table (DB-02). Policies use helper functions that read JWT custom claims:

### Helper Functions

```sql
-- Reads org_id from JWT app_metadata
create or replace function public.org_id()
returns uuid language sql stable as $$
  select nullif(auth.jwt()->'app_metadata'->>'org_id', '')::uuid;
$$;

-- Reads role from JWT app_metadata
create or replace function public.org_role()
returns text language sql stable as $$
  select auth.jwt()->'app_metadata'->>'role';
$$;
```

### Policy Summary

| Table | Anonymous | Authenticated Member | Admin/Manager |
|---|---|---|---|
| `organizations` | — | Read (own org) | Full access |
| `providers` | Read (active, non-deleted) | Full (own org) | Full |
| `services` | Read (visible, non-deleted) | Full (own org) | Full |
| `provider_schedules` | Read (active, non-deleted) | Full (own org) | Full |
| `business_hours` | Read (non-deleted) | Full (own org) | Full |
| `calendar_exceptions` | — | Full (own org) | Full |
| `appointments` | — | Read (own org) | Full (admin/manager) |
| `clients` | — | Read (own org) | Full (admin/manager) |
| `tags` | — | Full (own org) | Full |
| `client_tags` | — | Full (own org) | Full |
| `notes` | — | Full (own org) | Full |
| `global_settings` | — | Full (own org) | Full |
| `audit_logs` | — | Insert only | Insert only |
| `security_logs` | — | Insert only | Insert only |
| `processed_events` | — | Insert only | Insert only |
| `failed_webhooks_log` | — | Insert only | Select (admin/manager) |
| `provider_services` | — | Full (own org) | Full |

### Guest Booking Flow

Anonymous users book appointments through SECURITY DEFINER functions (not direct table inserts). This ensures:
1. Input validation via Zod before DB write
2. Idempotency check (duplicate pending booking)
3. Blacklist check
4. Proper organization scoping

---

## 5. Auth JWT Claims Structure

Custom claims are stored in `app_metadata` within the Supabase JWT:

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "uuid-of-user",
  "email": "user@example.com",
  "app_metadata": {
    "org_id": "uuid-of-organization",
    "role": "admin | manager | editor | viewer"
  },
  "user_metadata": {
    "full_name": "User Name"
  }
}
```

### Role Hierarchy

| Role | Permissions |
|---|---|
| `super_admin` | Full access across all organizations |
| `admin` | Full access within own organization |
| `manager` | Read/write appointments, clients; read settings |
| `editor` | Read/write services, schedule blocks |
| `viewer` | Read-only within organization |

### Setting Claims in Supabase

Use a database trigger or Supabase Auth hook to populate `app_metadata.org_id` and `app_metadata.role` on user creation/update:

```sql
-- Example: set org_id on user signup via admin invite
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
    'org_id', new.org_id,
    'role', new.role
  )
  where id = new.user_id;
  return new;
end;
$$;
```

---

## 6. Required Indexes

All indexes from `0001_initial_schema.sql` (IDX-01: every FK + frequent predicates):

### Appointments

```sql
create index idx_appointments_provider_id on public.appointments (provider_id);
create index idx_appointments_service_id on public.appointments (service_id);
create index idx_appointments_client_id on public.appointments (client_id);
create index idx_appointments_org_scheduled on public.appointments (organization_id, scheduled_at);
create index idx_appointments_org_phone_hash on public.appointments (organization_id, phone_hash);
create index idx_appointments_provider_scheduled_confirmed
  on public.appointments (provider_id, scheduled_at)
  where status = 'confirmado' and deleted_at is null;
```

### Services

```sql
create index idx_services_org_visible on public.services (organization_id, is_visible);
create index idx_services_org_sort on public.services (organization_id, sort_order);
```

### Other Tables

```sql
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
```

### Future Indexes to Add

When queries are identified (IDX-02: EXPLAIN ANALYZE required):

- `appointments`: composite index on `(organization_id, provider_id, scheduled_at)` for admin agenda view
- `clients`: index on `(organization_id, created_at)` for client list ordering
- `audit_logs`: index on `(created_at)` for audit log pagination
- Full-text search indexes (DB-07) when search features are implemented:
  ```sql
  create index idx_services_name_fts on public.services using gin (to_tsvector('spanish', name));
  create index idx_clients_name_fts on public.clients using gin (to_tsvector('spanish', name));
  ```

---

## 7. Migrations Workflow

Follow DB-DRIFT-01 and DB-03 (Expand and Contract):

### Pre-Mutation Checklist

1. **Inspect current schema**: `supabase db diff` or query `information_schema`
2. **Identify collisions**: check for existing tables/columns with similar purpose
3. **Generate migration**: `supabase migration new [description]`
4. **Write SQL**: follow expand/migrate/contract pattern for destructive changes

### Migration Script Template

```sql
-- Migration: [description]
-- Follows: DB-DRIFT-01 (pre-inspection), DB-03 (expand and contract)

begin;

-- Expand: add new column/table
-- alter table ...

-- Migrate: backfill data (if changing existing columns)
-- update ...

-- Contract: remove old column/table (SEPARATE migration after verification)
-- alter table ...

commit;
```

### Post-Migration Checklist (DB-SYNC-01)

1. ✅ SQL migration applied
2. ✅ RLS policies written and activated
3. ✅ `database.types.ts` regenerated: `supabase gen types typescript --local > packages/db/database.types.ts`
4. ✅ Zod schemas updated in `packages/validations/`
5. ✅ UI components updated for new/changed fields

---

## 8. Type Generation

After any schema change, regenerate TypeScript types:

```bash
# From project root
supabase gen types typescript --local > packages/db/database.types.ts
```

**Never manually edit `database.types.ts`** (CQ-06, ARCH-01).

### Usage in Code

```typescript
import type { Database } from "@khal/db/database.types";
import { createClient } from "@supabase/supabase-js";

type Tables = Database["public"]["Tables"];
type Appointment = Tables["appointments"]["Row"];
```

---

## Troubleshooting

### RLS Policy Not Working

1. Verify RLS is enabled: `select relrowsecurity from pg_class where relname = 'table_name';`
2. Check JWT claims: `select auth.jwt();`
3. Test with service role key (bypasses RLS) to isolate the issue

### Migration Fails

1. Check for existing objects: `select * from information_schema.tables where table_name = 'your_table';`
2. Verify enum types don't already exist: `select * from pg_type where typname = 'your_enum';`
3. Run in a transaction to test: wrap in `begin; ... rollback;` first

### Types Out of Sync

1. Regenerate: `supabase gen types typescript --local > packages/db/database.types.ts`
2. Verify import path matches: `@khal/db/database.types`
3. Check tsconfig paths in `packages/db/`
