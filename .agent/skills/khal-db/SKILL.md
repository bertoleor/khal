---
name: khal-db
description: >
  Use when working with khal's data plane: `@khal/db` availability engine and the
  Supabase/Postgres schema (RLS, soft-delete, enums, indexes IDX-01, append-only
  logs, UTC datetimes, America/Argentina/Buenos_Aires, SECURITY DEFINER RPCs).
metadata:
  author: khal
  version: "0.1.0"
---

# Khal db

Data plane = **`@khal/db`** (pure TS time math + slot computation) plus a Postgres
schema (`supabase/migrations/0001_initial_schema.sql`) + future `SECURITY
DEFINER` RPCs. All enforced conventions come from DB-01..DB-07, IDX-01/03, ECOM-03,
MONEY-01, SCH-01..03, SLOG-01..03, WEBHOOKS-01, CONCURRENCIA-01.

## `@khal/db` availability (SCH-01/02/03, pure — keep it pure)

Contract: you pass an **open** TimeRange, **blocked** ranges, **duration**,
**buffer**, optional **step** (default 15m); it returns offered `"HH:MM"` slots.

```ts
export interface ClockTime { hours: number; minutes: number }
export interface TimeRange { start: ClockTime; end: ClockTime }
computeAvailableSlots(open, blocked[], durationMinutes, bufferMinutes, stepMinutes = 15)
```
Core rule the caller must honor: a candidate slot is the block
`[start, start + duration + buffer)`; it must fit `<= open.end` and be
non-overlapping with every blocked range (`rangesOverlap` uses the strict
`aStart < bEnd && bStart < aEnd`).

Helpers: `parseClock("HH:MM")`, `formatClock(totalMinutes) → "HH:MM"`,
`toMinutes`, `fromMinutes`. 🚫 never invent a parallel time representation; add
to this file or don't.

Availability is *always computed* at request time — never pre-generate or cache
into a table.

## Supabase/Postgres schema — read the migration as normative

Naming sets the contract exactly. Key columns semantics mandated by conventions:

- `id UUID PK DEFAULT gen_random_uuid()`, `created_at/updated_at` (timestamptz,
  trigger `set_updated_at()`), `deleted_at TIMESTAMPTZ NULL` (**soft delete DB-04**)
  on all business tables.
- **Enums**: `appointment_status ('pendiente','confirmado','cancelado','no_asistio')`,
  `deposit_mode ('full','fixed','percentage')`, `exception_type
  ('holiday','vacation','event','block')` — enum-only lifecycle (**ECOM-03**);
  🚫 never a boolean "is_canceled"/"is_confirmed".
- Money: `price_cents`, `amount_due_cents` as `INTEGER` + `currency_code CHAR(3)`
  with checks `>= 0`; `deposit_percentage_bp INTEGER 0..10000` (**MONEY-01/03**).
  🚫 never a float money column.
- Timezone: organizations default `America/Argentina/Buenos_Aires`; all datetimes
  `timestamptz` = **UTC** (DB-01); availability in fixed business tz.

Inspection of key tables points:
- `providers` and `provider_services` are **multi-provider ready** — release
  ships with one provider but no single-provider hardcoding.
- `services.deposit_*` may be NULL → inherit store default, with CHECK that mode
  requires the matching value column to be non-null.
- `calendar_exceptions` subtracts from availability (SCH-03) and must include
  `organization_id`, `provider_id NULL`, `exception_type`, `starts_at`/`ends_at`
  with CHECK `ends_at > starts_at`.
- `appointments` stores (`hold_expires_at`, `hold_released_at`, `idempotency_key`,
  `phone_hash`, `ip_hash`, `confirmed_at`, `deposit_mode_applied`,
  `amount_due_cents`) — the snapshot and TTL are part of the domain contract.
- `clients` carry `no_show_count DEFAULT 0` (maintained atomically on
  `confirmado → no_asistio`), `is_blacklisted` (owner manual override), `phone_hash`.
- `notes`, `audit_logs` (**DB-05 append-only**), `processed_events` (WEBHOOKS-01
  L1 PK `event_id`), `failed_webhooks_log` (DLQ), `security_logs` (**SLOG-01**).

## Access control (DB-02)

- `enable row level security` on **every table** (migration does this).
- Org membership via JWT custom claims (`org_id`, `role`), `app_metadata` —
  read through `public.org_id()` / `public.org_role()`. 🚫 not raw subqueries in
  `using(...)`.
- Public/anon: read-through policies exist **only** for the catalog dependency
  surface (services visible, providers/schedules/business_hours, calendar exceptions
  is **members-only**, appointments/clients have **no anon policies**).
- Guest writes go through `SECURITY DEFINER` functions only; direct anon `INSERT`
  into `appointments`/`clients` is denied by RLS.
- Append-only tables (`audit_logs`, `processed_events`, `failed_webhooks_log`,
  `security_logs`) get `INSERT`-only policies (`audit_logs_insert`, etc.) and
  `failed_webhooks_admin_select` for admins.

## Indexes (IDX-01/03)

The migration creates the referenced indexes; in particular:
partial-confirmed index
`idx_appointments_provider_scheduled_confirmed (provider_id, scheduled_at)
  WHERE status='confirmado' AND deleted_at IS NULL` plus
`idx_appointments_org_phone_hash`, `idx_appointments_org_scheduled`,
`idx_provider_schedules_provider_dow`, `idx_calendar_exceptions_range`.
🚫 never drop or rename an index without migration review.

## Booking RPC (future; contract defined)

`create_booking` (SECURITY DEFINER) = idempotency + blacklist + `SELECT ... FOR
UPDATE` + overlap probe (CONCURRENCIA-01 L2). The app mocks render this contract
now; when implementing the RPC keep the same shape.

## Dates & times in code

For client/date code use `toIsoDate` (`@khal/utils`) — builds local `YYYY-MM-DD`
string (avoids the UTC-bucketing bug; mirrors how reservar pages assemble DaySlots).
🚫 never `toISOString().slice(0,10)` for a calendar day.