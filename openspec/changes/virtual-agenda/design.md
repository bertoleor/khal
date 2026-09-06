# Design: Virtual Appointment Agenda

## Technical Approach

Turborepo monorepo (ARCH-03): `apps/web` (public funnel), `apps/admin` (backoffice), `apps/api-workers` (async dispatch), `packages/{ui,types,validations,utils,db}`. Supabase (Postgres + Auth + RLS + Storage + pg_cron) is the single data plane. Availability is **computed** (SCH-01), never pre-generated. Two orthogonal axes drive the booking lifecycle: a strict **status enum** (business state) and a **hold TTL** (ghost-lock lifetime) — see Risk A resolution. Money is integer cents (MONEY-01); all datetimes UTC (DB-01) with availability in the fixed business tz `America/Argentina/Buenos_Aires`.

---

## 1. Data Model

All tables carry `id UUID PK DEFAULT gen_random_uuid()`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, and `deleted_at TIMESTAMPTZ NULL` (soft-delete per DB-04). Money = `INTEGER` cents + `currency_code CHAR(3)` (MONEY-01/03).

### Enums (Postgres types; no boolean lifecycle flags — ECOM-03)

```sql
CREATE TYPE appointment_status AS ENUM ('pendiente','confirmado','cancelado','no_asistio');
CREATE TYPE deposit_mode      AS ENUM ('full','fixed','percentage');
CREATE TYPE exception_type    AS ENUM ('holiday','vacation','event','block');
```

### Core tables

| Table | Columns (beyond shared) | Notes |
|-------|------------------------|-------|
| `organizations` | `name`, `timezone` (default `America/Argentina/Buenos_Aires`), `currency_code` (default `ARS`) | store tenant |
| `providers` | `organization_id FK`, `name`, `is_active BOOL` | first-class (binding 3); release ships 1, no single-provider hardcoding |
| `services` | `organization_id FK`, `name`, `description`, `price_cents INT`, `currency_code`, `duration_minutes INT`, `buffer_minutes INT`, `is_visible BOOL`, `sort_order INT`, `photo_path TEXT`, `deposit_mode deposit_mode NULL`, `deposit_fixed_cents INT NULL`, `deposit_percentage_bp INT NULL` | `deposit_* NULL` → inherit store default (Risk B) |
| `provider_schedules` | `provider_id FK`, `day_of_week SMALLINT` (0-6), `open_time TIME`, `close_time TIME`, `is_active BOOL` | provider weekly hours |
| `business_hours` | `organization_id FK`, `day_of_week`, `open_time TIME`, `close_time TIME` | store-wide fallback hours |
| `calendar_exceptions` | `organization_id FK`, `provider_id FK NULL`, `exception_type`, `title`, `starts_at`, `ends_at` | subtracted from availability (SCH-03) |
| `appointments` | `organization_id FK`, `provider_id FK`, `service_id FK`, `client_id FK`, `scheduled_at TIMESTAMPTZ`, `ends_at TIMESTAMPTZ`, `status appointment_status DEFAULT 'pendiente'`, `hold_expires_at TIMESTAMPTZ`, `hold_released_at TIMESTAMPTZ NULL`, `amount_due_cents INT`, `currency_code`, `deposit_mode_applied deposit_mode`, `idempotency_key UUID NULL`, `phone_hash TEXT`, `ip_hash TEXT`, `confirmed_at TIMESTAMPTZ NULL` | `ends_at`/`amount_due_cents`/`deposit_mode_applied` are **snapshots** at creation |
| `clients` | `organization_id FK`, `name`, `phone TEXT`, `phone_hash TEXT`, `email`, `locale`, `timezone`, `no_show_count INT DEFAULT 0`, `is_blacklisted BOOL DEFAULT false`, `last_activity_at` | CRM source of truth (Risk C) |
| `client_tags` | `client_id FK`, `tag_id FK` | visual tags |
| `tags` | `organization_id FK`, `label`, `color` | tag dictionary |
| `notes` | `organization_id FK`, `client_id FK NULL`, `appointment_id FK NULL`, `author_id UUID`, `body TEXT` | per-client + per-appointment |
| `audit_logs` | `actor_id UUID`, `action`, `entity`, `entity_id`, `before_snapshot JSONB`, `after_snapshot JSONB` | append-only (DB-05) |
| `processed_events` | `event_id UUID PK`, `provider`, `processed_at` | idempotency (WEBHOOKS-01 L1) |
| `failed_webhooks_log` | `provider`, `payload JSONB`, `status`, `error_message`, `retry_count INT` | DLQ (L2) |
| `global_settings` | `organization_id FK`, `setting_key TEXT`, `value JSONB` | store defaults: deposit fallback, MP Alias/CVU |
| `security_logs` | `actor_id`, `event`, `ip`, `user_agent`, `meta JSONB` | append-only (SLOG-01) |

### LTV / no-show derivation

`no_show_count` is a **maintained integer column** atomically incremented when a booking transitions `confirmado → no_asistio`, so the admission predicate `no_show_count > 2` is O(1). `is_blacklisted` is an owner **manual override flag** (not a lifecycle state). LTV is **computed**: single SQL join `SUM(amount_due_cents) WHERE status='confirmado'` over appointments (DB-06, ADMIN-06).

### RLS strategy (DB-02)

| Table | Anon | Authenticated (org member) | Admin (org owner/mgr role) |
|-------|------|-----------------------------|-----------------------------|
| `services` | SELECT `is_visible=true AND deleted_at IS NULL` | SELECT | ALL |
| `business_hours`/`providers`/`provider_schedules` | SELECT (availability needs) | SELECT | ALL |
| `appointments` | **none** (write via `SECURITY DEFINER` fn only) | SELECT org-scoped | ALL |
| `clients` | **none** (write via definer fn) | SELECT org-scoped | ALL |
| `calendar_exceptions` | none | SELECT | ALL |
| `notes`/`tags`/`client_tags`/`global_settings` | none | read where org | ALL |
| `audit_logs`/`processed_events`/`failed_webhooks_log`/`security_logs` | none | none | INSERT-only (immutable) |

Org membership via **Custom Claims in Supabase JWT** (`org_id`, `role`) — not raw subqueries inside `USING` (DB-02). Guest writes go through **`SECURITY DEFINER` functions** (`create_booking`, `upsert_client`) enforcing idempotency + blacklist + `FOR UPDATE` internally; direct anon `INSERT` denied by RLS.

### Indexes (IDX-01)

```sql
CREATE INDEX ON appointments(provider_id);
CREATE INDEX ON appointments(service_id);
CREATE INDEX ON appointments(client_id);
CREATE INDEX ON appointments(organization_id, scheduled_at);
CREATE INDEX ON appointments(organization_id, phone_hash);
CREATE INDEX ON appointments(provider_id, scheduled_at) WHERE status='confirmado' AND deleted_at IS NULL;
CREATE INDEX ON services(organization_id, is_visible);
CREATE INDEX ON services(organization_id, sort_order);
CREATE INDEX ON provider_schedules(provider_id, day_of_week);
CREATE INDEX ON calendar_exceptions(organization_id, provider_id, starts_at, ends_at);
CREATE INDEX ON clients(organization_id, phone_hash);
CREATE INDEX ON notes(appointment_id);
CREATE INDEX ON audit_logs(entity, entity_id);
```

Overlap blocking uses `scheduled_at < :end AND ends_at > :start` on the partial confirmed index; the transaction lock (L2) is the primary correctness guarantee.

---

## 2. Availability Engine

Computed in the **fixed business tz** (`America/Argentina/Buenos_Aires`) regardless of client device tz. All stored datetimes UTC (DB-01); conversion at both edges.

```
available_slots(provider, day) =
    open_hours(provider, day)                       -- provider_schedules else business_hours
  − confirmed_appointments(provider, day)           -- status='confirmado' AND NOT deleted
  − held_pending(provider, day)                     -- status='pendiente' AND hold_expires_at > now()
  − calendar_exceptions(provider|store, day)
```

Algorithm (single SQL, no client-side slot generation):
1. Resolve `open/close` for the day; if closed, no slots.
2. Slot grid granularity = 15 min (configurable constant in `global_settings`).
3. For a requested `(service, provider, start)`: `end = start + duration_minutes + buffer_minutes`. Blocked if any confirmed/pending-held appointment or exception overlaps `[start, end)`. Offered otherwise (SCH-02).
4. Convert selected local slot → UTC before persist; back at render (frontend `Intl`).

`ends_at` includes buffer: a 60-min + 15-min buffer booked at 10:00 blocks `10:00–11:15`.

---

## 3. Booking Transaction (`create_booking`, L2)

`SELECT ... FOR UPDATE`, serializable txn (CONCURRENCIA-01 L2):

```
Client → Server Action → SECURITY DEFINER create_booking()
  1. Zod validate + Turnstile/honeypot + Upstash rate limit (SEC-03)
  2. admission: is_client_blacklisted(phone)  ← packages/db (Risk C)
  3. BEGIN; SELECT provider/service FOR UPDATE  → serializes slot writes
  4. idempotency: existing pendiente(phone) with hold_expires_at > now()? → 409
  5. overlap probe on [start,end)? → 409 CONFLICT
  6. INSERT appointment (status='pendiente', hold_expires_at=now()+15min,
        amount snapshot, deposit_mode_applied, phone_hash)
  7. upsert_client(phone)
  8. COMMIT
```

- **Idempotency**: `idempotency_key` (client UUID) primary dedupe; `(org, phone_hash)` pending-overlap enforces "1 pending per phone". IP rate limit via Upstash (RLIM-01).
- **TTL cron** (`pg_cron`, 5 min — JOBS-01): `UPDATE ... SET hold_released_at = now() WHERE status='pendiente' AND hold_expires_at < now() AND hold_released_at IS NULL`. This powers alerts/observability but does NOT gate slot release — availability already excludes expired holds, so a freed slot never waits on cron lag.

---

## 4. Concurrency Boundary

| Operation | Mechanism |
|-----------|-----------|
| Catalog edit, price, deposit config | OCC L1 (client submits `updated_at`; 409 if stale) |
| Slot acquisition / booking insert | L2 `FOR UPDATE` + overlap probe |
| Confirm / reschedule / cancel | L2 `FOR UPDATE` + re-probe on reschedule |
| `no_show_count` increment | L2 atomic `UPDATE ... SET no_show_count = no_show_count + 1` |
| Read availability | lock-free computed query |

---

## 5. Server Actions — Security Baseline (ARCH-05)

Every action = public endpoint: auth + org ownership + Zod before logic. Public guest actions enforce Zod + Turnstile + rate limit + blacklist.

| Action | App | Guards |
|--------|-----|--------|
| `getCatalog`, `getService`, `getAvailability` | web | anon read (RLS filters) |
| `createBooking` | web | Zod + Turnstile + Upstash + blacklist + FOR UPDATE |
| `sendComprobante` | web | Zod (booking id + phone match) |
| `saveService`, `bulkToggleVisibility`, `editPrice` | admin | auth + role + org + Zod + OCC + audit |
| `confirmBooking`, `rescheduleBooking`, `cancelBooking`, `markNoShow` | admin | auth + role + Zod + L2 + audit |
| `createException`, `tagClient`, `addNote`, `blacklistClient` | admin | auth + role + Zod + org |

---

## 6. Async Integrations (RES-03)

No synchronous third-party call in the request path. Dispatch via **Database Webhooks → n8n / Upstash QStash**.

- **WhatsApp reminders (24h) / Telegram alerts**: confirmed-insert + `pg_cron`/QStash → QStash/n8n → provider.
- **Webhook integrity (WEBHOOKS-01)**: `processed_events` idempotency + `failed_webhooks_log` DLQ + HMAC (`QSTASH_CURRENT_SIGNING_KEY`).
- **Circuit breaker (RESILIENCIA-01)**: in `apps/api-workers` — AbortController 8s, 3-fail/60s open, 30s half-open, persist intent `status='pending_retry'`.

---

## 7. Module / Feature Breakdown + Slice Map

**Shared data layer (`packages/db`)** resolves Risk C: availability engine, `is_client_blacklisted`, idempotency probe, money/timezone utils — consumed by both apps (no cross-app imports, ARCH-02).

`packages/utils`: `money.ts` (Decimal, HALF_UP / DOWN), `tz.ts`, `format.ts`. `packages/validations`: Zod schemas. `packages/types`: `database.types.ts` + domain types. `packages/ui`: shadcn atoms + shared molecules.

| Slice (chained-PR, ≤400 lines) | Modules |
|--------------------------------|---------|
| 1 Foundation | monorepo scaffold, tokens, `database.types.ts`, migration+RLS, `env.ts`, i18n, Vitest/Playwright |
| 2 Catalog | `getCatalog`/`getService`, service detail, catalog grid (web) |
| 3 Booking engine | `packages/db` availability + `create_booking` definer fn, TTL cron, slot grid |
| 4 Payment validation | MP Alias/CVU display, wa.me comprobante, `sendComprobante` |
| 5 Admin backoffice | ops calendar, catalog/bulk, CRM, confirm/reschedule/cancel |
| 6 Automations | QStash/n8n dispatch, circuit breaker, worker |

---

## 8. Money, i18n, Env

- **Money (MONEY-01/02/03)**: `price_cents`/`amount_due_cents` INTEGER; `deposit_percentage_bp` in **basis points** (50% = 5000). Precedence: service `deposit_*` overrides store default; `NULL` → inherit. `amount_due` = `ROUND_HALF_UP(price_cents · bp / 10000)` via Decimal.js; currency code carried; snapshot at creation.
- **i18n (I18N-01/02/03)**: `next-intl` `[locale]` groups; namespaces `common, checkout, admin, errors, emails`; `Intl` at render; fallback `es`.
- **Env (ENV-01, Zod boot validation)**:

| Var | Class |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | PUBLIC |
| `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `UPSTASH_QSTASH_TOKEN`, `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TURNSTILE_SECRET_KEY`, `SENTRY_DSN` | SERVER |
| `QSTASH_CURRENT_SIGNING_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | CRITICAL (90d rotation) |

MP Alias/CVU are **content** in `global_settings` (CMS-01), editable in admin.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Risk A — slot hold vs status** | Orthogonal axes: `status` enum (business) + `hold_expires_at`/`hold_released_at` (TTL). Expired `pendiente` never physically deleted (DB-04), not a new enum state — "hold vencido" derived from timestamps. | Deleting loses owner-review; new enum conflates lifecycle with hold-lifetime. Timestamp pair keeps ECOM-03 clean. |
| **Risk B — deposit arithmetic** | `deposit_percentage_bp` (bp) + `deposit_fixed_cents`; store fallback in `global_settings`; HALF_UP via Decimal.js; snapshot. | bp avoids float; snapshot preserves price integrity. |
| **Risk C — blacklist ownership** | `is_client_blacklisted(phone)` in `packages/db`; `clients` is source of truth. | ARCH-02 forbids cross-feature imports; data layer is the channel. |
| **Slot granularity** | 15 min constant in `global_settings`. | mutable per-store. |
| **L2 lock target** | Lock the `provider` row (not slot). | serializes provider's writes, prevents double-booking without slot table (SCH-01). |
| **TTL correctness without cron** | availability excludes expired holds; cron only mutates + alerts. | no wait window for freed slots. |

## Data Flow (booking confirm)

```
Client → createBooking → SECURITY DEFINER fn → FOR UPDATE provider → overlap → INSERT pendiente
       → DB webhook → n8n/QStash → Telegram alert (async)
Owner confirms → confirmBooking → status=confirmado → QStash 24h reminder
```

## Open Questions

- [ ] Slot granularity 15 vs 30 min — constant confirmed, default not ratified.
- [ ] `is_blacklisted` boolean vs derived-only — kept as manual-override flag; confirm owner preference.