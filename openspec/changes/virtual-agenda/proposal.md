# Proposal: Virtual Appointment Agenda

## Intent

Build a virtual booking agenda for a beauty/aesthetics studio (lashes, nails, brows, spa). Strict iOS design language: clean typography, subtle borders, zero heavy animation, 100% utility focus, mobile-first. Two surfaces: a public client-facing booking funnel (landing → catalog → service detail → slot engine → manual Mercado Pago payment → WhatsApp validation) and an admin backoffice (operations calendar, catalog management, CRM, async automations).

## Scope

### In Scope
- Public landing (link-in-bio: logo, hamburger, quick-link cards, primary CTA).
- Service catalog (grid, cards, detail with sticky price/CTA bar).
- Calendar/slot engine (horizontal day selector, hour-button grid, express form: name/phone/email, no password).
- Manual payment flow (Mercado Pago Alias/CVU display, copy-to-clipboard, wa.me pre-filled comprobante).
- Admin operations calendar (Day/Week, appointment cards, status dots, actions).
- Catalog management (edit price, toggle visibility, add service, bulk actions).
- Client CRM (visual tags, per-appointment notes, LTV history).
- Automations (async WhatsApp reminders 24h before + Telegram alerts).

### Out of Scope
- Online card processing / Mercado Pago Payment Links or Checkout API (manual transfer only, this phase).
- Staff/employee management, payroll, inventory.
- Native iOS/Android apps.
- AI-generated content (postponed; ADMIN-05 gated behind feature flag later).

## Capabilities

Research: `openspec/specs/` is empty (greenfield). All capabilities are new.

### New Capabilities
- `service-catalog`: landing page, catalog grid, service detail, CRM-driven pricing.
- `booking-engine`: dynamic availability, slot grid, ghost-turn TTL, double-booking protection.
- `bookings`: reservation entity, guest express form, status enum, idempotency.
- `payment-validation`: manual Mercado Pago transfer + WhatsApp comprobante flow.
- `admin-operations`: operations calendar, catalog/bulk management, RBAC.
- `client-crm`: visual tags, appointment notes, LTV aggregation.
- `calendar-exceptions`: holiday/vacation/event blocks subtracted from availability.
- `automations`: async reminder/alert dispatch (n8n/Upstash QStash).

### Modified Capabilities
None.

## Approach

Turborepo monorepo (ARCH-03): `apps/web` (public funnel), `apps/admin` (backoffice), `apps/api-workers` (async jobs), `packages/{ui,types,validations,utils}`. Supabase (Postgres + Auth + RLS + Storage) as single data plane; `database.types.ts` generated, Zod everywhere. Availability computed dynamically (SCH-01), never pre-generated slots. Manual-payment state is manual (no payment webhook this phase) — WhatsApp validation closes the loop.

## Constitution Mapping

| Product requirement | Constitution section |
|---|---|
| duration_minutes + buffer_minutes block grid | SCH-01, SCH-02 |
| Holiday/vacation drift subtracted | SCH-03, calendar_exceptions |
| Ghost-turn TTL (Bloqueado_Temporalmente, 5min cron, 15min release) | JOBS-01, SCH-01, CONCURRENCIA-01 L2 |
| Double-booking prevention (SELECT FOR UPDATE) | CONCURRENCIA-01 Level 2 |
| UTC storage; business-timezone availability | DB-01, TZ-01, TZ-02 (America/Argentina/Buenos_Aires) |
| Anxious-client spam (disable isPending, 1 pending/phone/IP, idempotency) | UX-04, RLIM-01, WEBHOOKS-01 L1 |
| No-show blacklist (>2 "No Asistió" / is_blacklisted → reject) | client-crm business rule, SEC-03 |
| Prices (integer cents, currency code) | MONEY-01, MONEY-03 |
| Bot protection (public form) | SEC-03 (Turnstile/reCAPTCHA/honeypot + Upstash) |
| Input sanitization, parameterized SQL | SEC-04 |
| Photos upload (presigned URLs, WebP/AVIF) | PERF-06, PERF-07, STOR-01 |
| No-password client (guest first) | AUTH-02 |
| RLS every table, soft deletes, audit logs (price changes) | DB-02, DB-04, DB-05 |
| Admin RBAC | ADMIN-04, ARCH-05 |
| Async WhatsApp/Telegram dispatch | RES-03, NOTIF-01, JOBS-01 |
| Server Actions as public endpoints | ARCH-05 |
| Spanish i18n, no raw keys | I18N-01, I18N-02 |
| Error boundaries, structured logging | ERR-01, OBS-01 |
| Secrets | SEC-01, SEC-02, ENV-01/02 |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `openspec/specs/*` | New | 8 new spec domains |
| `apps/web/`, `apps/admin/`, `apps/api-workers/` | New | Monorepo apps |
| `packages/{ui,types,validations,utils}` | New | Shared packages |
| Supabase (tables, RLS, migrations) | New | services, bookings, clients, calendar_exceptions, audit_logs |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large scope → review overload | High | Force-chained slices; 400-line PR budget (force-chained preflight) |
| Double-booking race not proven | Med | Serializable txn + SELECT FOR UPDATE; integration tests (sad paths) |
| Timezone bugs (availability vs UTC) | Med | TZ-01/02 discipline; test DST/non-DST boundaries |
| Manual payment missed reconciliations | High | Human WhatsApp review + status dots (yellow/green) |
| Test runner not yet scaffolded (tdd: false) | Med | Scaffold Vitest/Playwright in foundation slice first |
| n8n/Upstash cost + latency | Low | QStash/pg_cron only; no sync external calls in request path |

## Rollback Plan

Feature-flagged deployment (DEV-01): new code ships inactive behind flags (booking-engine, bulk-catalog). Kill switch (admin toggle) reverts in <1s. Schema changes follow Expand/Contract (DB-03) — app rollback never requires DB rollback (ROLL-03). Rollback runbook triggers per ROLL-01/02.

## Dependencies

- Supabase project (Postgres + Auth + Storage + pg_cron).
- Upstash (Redis + QStash), n8n instance (automations slice).
- Mercado Pago account (Alias/CVU) for display only.

## Success Criteria

- [ ] Client can view services, select a slot, submit express form without account.
- [ ] Slot locks prevent double-booking under concurrent load (tested).
- [ ] Ghost-turn TTL releases stuck slots within 15 min.
- [ ] Admin confirms payment (green) and reschedules/cancels with audit trail.
- [ ] 80% coverage on booking + payment + availability paths.

## Delivery Slices (feeds chained-PR task planning)

1. **Foundation** — monorepo scaffold, tokens, Supabase schema+RLS+types, env validation, i18n, test runner.
2. **Catalog** — landing + catalog + service detail (public read-only).
3. **Booking engine** — calendar/slot engine, availability, express form, TTL, concurrency.
4. **Payment validation** — manual MP + WhatsApp flow.
5. **Admin backoffice** — operations calendar, catalog/bulk, CRM.
6. **Automations** — async reminders + alerts.

## Open Product Questions (proposal-question round)

1. Buffer default per service vs per-studio global? Slot granularity (15/30 min)?
2. Business hours/days and working-capacity definition (single provider or multiple)?
3. Payment confirmation: admin manual approval only, or must comprobante auto-parse?
4. "No Asistió" tag: who applies it, and what resets a blacklisted client?
5. WhatsApp: wa.me deep-links only, or WhatsApp Business API budget for automation slice?
6. Service photos: single hero vs gallery; who uploads (admin presigned)?
7. LTV definition window and currency single (ARS) assumption.

## Size Budget

450-word artifact budget exceeded intentionally per orchestrator authority (constitution-mapping contract + slices + questions mandated). Tables over prose per CQ/CQ-02 zero-filler standard.