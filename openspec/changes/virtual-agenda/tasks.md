# Tasks: Virtual Appointment Agenda

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,000–2,600 (greenfield: scaffold + schema + 8 specs + tests) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Delivery strategy | force-chained (C3) |
| Chain strategy | pending — orchestrator MUST ask user (stacked-to-main vs feature-branch-chain) before apply |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6 (six slices) + PR 1a/1b split |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

## Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1a | Monorepo scaffold + tokens + env + i18n + test runner | PR 1 | Foundation part A; own tests/docs |
| 1b | Supabase migration + RLS + `database.types.ts` + Zod schemas | PR 2 | Foundation part B; generated diff → size:exception candidate |
| 2 | Catalog (landing, grid, detail) | PR 3 | read-only; depends PR 2 |
| 3 | Booking engine (availability, create_booking, TTL cron) | PR 4 | depends PR 2, PR 3 (reuses catalog types) |
| 4 | Payment validation (MP + wa.me + comprobante) | PR 5 | depends PR 4 |
| 5 | Admin backoffice (calendar, bulk, CRM) | PR 6 | depends PR 4 |
| 6 | Automations (QStash/n8n worker) | PR 7 | depends PR 4 |

## Phase 1: Foundation (slice 1)

- [ ] 1.1 Turborepo scaffold: `apps/{web,admin,api-workers}`, `packages/{ui,types,validations,utils,db}`, tsconfig path aliases (ARCH-03)
- [ ] 1.2 Design tokens (Tailwind v4) + shadcn atoms in `packages/ui` (UX-01/02)
- [ ] 1.3 `config/env.ts` Zod boot validation tables (ENV-01/02)
- [ ] 1.4 i18n setup: `next-intl` `[locale]` + namespaces common/checkout/admin/errors (I18N-01)
- [ ] 1.5 Test scaffolding: Vitest + Testing Library + Playwright config (TEST-01)

### Phase 2: Data Layer & Schema (slice 1b — HIGH risk, must split)

- [ ] 2.1 Migration: 17 tables + 3 enums + indexes per design §1, DB-01/IDX-01
- [ ] 2.2 RLS policies every table + `SECURITY DEFINER` fn stubs (DB-02)
- [ ] 2.3 Generate `database.types.ts` (never hand-written, CQ-06)
- [ ] 2.4 Zod schemas in `packages/validations` mirroring DB types
- [ ] 2.5 `packages/db`: money/timezone/utils + seed + factories (SEED-01/02, MONEY-01/03)

## Phase 3: Catalog (slice 2, `service-catalog`)

- [ ] 3.1 `getCatalog`/`getService` Server Actions (anon read) — SC-1, SC-2
- [ ] 3.2 Landing + catalog grid + card (mobile-first, empty state) — SC-1 "Empty catalog"
- [ ] 3.3 Service detail + sticky price/CTA bar — SC-2
- [ ] 3.4 Integer price `(cents/100)` render via `Intl.NumberFormat` — SC-3
- [ ] 3.5 Deposit model inheritance UI hint (read-only) — SC-4
- [ ] 3.6 Presigned photo upload (admin) + WebP/AVIF storage — SC-5, PERF-06/07

## Phase 4: Booking Engine (slice 3, `booking-engine` + `bookings`)

- [ ] 4.1 `packages/db` availability query (SCH-01 single SQL, tz-fixed) — BE-1
- [ ] 4.2 Duration + buffer blocking calc — BE-2
- [ ] 4.3 Provider as first-class (no single-provider hardcode) — BE-3
- [ ] 4.4 UTC↔business-tz conversion at both edges — BE-4
- [ ] 4.5 `create_booking` definer fn: FOR UPDATE + overlap probe + idempotency + blacklist — BE-5, BK-3, PV-5
- [ ] 4.6 `pg_cron` 5-min TTL release (hold_released_at) — BE-6
- [ ] 4.7 Calendar exception subtraction in availability — BE-7, CE-2
- [ ] 4.8 Guest express form (name/phone/email, no password) + Turnstile — BK-1
- [ ] 4.9 Strict status enum `pendiente→confirmado|cancelado|no_asistio` — BK-2
- [ ] 4.10 Soft delete + `audit_logs` on reschedule/cancel — BK-4

## Phase 5: Payment Validation (slice 4, `payment-validation`)

- [ ] 5.1 MP Alias/CVU display + copy-to-clipboard — PV-1
- [ ] 5.2 Deposit/full amount via Decimal.js (HALF_UP) + currency code — PV-2
- [ ] 5.3 `wa.me` pre-filled comprobante deep link — PV-3
- [ ] 5.4 `sendComprobante` action (booking+phone match Zod) — PV-3
- [ ] 5.5 Manual confirm pending→confirmado (no auto webhook) — PV-4

## Phase 6: Admin Backoffice (slice 5, `admin-operations` + `client-crm` + `calendar-exceptions`)

- [ ] 6.1 `/admin/*` server middleware RBAC + JWT custom claims (ADMIN-04, ARCH-05)
- [ ] 6.2 Operations calendar Day/Week + status dots + mobile cards — AO-1
- [ ] 6.3 Catalog edit price/toggle/add + bulk actions + audit — AO-2
- [ ] 6.4 `confirmBooking`/`rescheduleBooking`/`cancelBooking`/`markNoShow` (OCC/L2 + audit) — AO-4
- [ ] 6.5 `createException` manager (holiday/vacation, provider-scoped) — CE-1, CE-3
- [ ] 6.6 CRM: client entity, tags, notes, LTV single-query (ADMIN-06) — CRM-1/2/3
- [ ] 6.7 Blacklist + no-show source of truth (`no_show_count` O(1)) — CRM-4

## Phase 7: Automations (slice 6, `automations`)

- [ ] 7.1 Database Webhook → n8n/QStash dispatch (no sync calls) — AU-1, AU-3
- [ ] 7.2 WhatsApp 24h reminder (locale/tz at send) — AU-1
- [ ] 7.3 Telegram alert on new-booking/confirm — AU-2
- [ ] 7.4 Circuit breaker + DLQ `failed_webhooks_log` + `processed_events` idempotency + HMAC — AU-3, WEBHOOKS-01

## Testing (per slice, work-unit-commits: tests ship with code)

- [ ] T-1 Vitest unit: money (Decimal HALF_UP/DOWN), tz, availability calc, blacklist predicate — TEST-01
- [ ] T-2 Testing Library integration: booking form (submit→success+error), catalog empty state — TEST-01
- [ ] T-3 Sad paths: network failure, 8s timeout, 500, expired hold release, conflicting booking (409), blacklist rejection, dup pending (409), empty catalog — TEST-02
- [ ] T-4 Concurrency test: parallel `create_booking` same slot → exactly one wins — BE-5
- [ ] T-5 Playwright E2E: guest checkout + admin confirm/reschedule — TEST-01

## Ordering Constraints

- PR 3 (catalog) requires PR 2 (schema/types).
- PR 4 (booking) requires PR 2 (definer fn) and reuses PR 3 catalog types.
- PR 5–7 require PR 4 (booking entity + status).
- Automations (PR 7) requires confirmed-insert hook from PR 4; can parallelize with PR 5/6.
- Foundation slice (1a+1b) is the chokepoint; 1b (migration+types) is a generated diff → likely `size:exception`.