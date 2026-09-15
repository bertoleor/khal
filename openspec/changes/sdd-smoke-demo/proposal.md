# Proposal: sdd-smoke-demo — Reservation Reminder Copy (docs-only)

Status: draft (docs-only, no prod code)
Change dir: `openspec/changes/sdd-smoke-demo/`
Date: 2026-09-15

## Why
Smoke-test the SDD chain (`openspec.config.yaml` → proposal → spec → tasks → `DOCS/01-07`)
with one minimal example feature. Proves the chain is traversable end to end.

## What (micro-feature)
Add a reservation-reminder message definition: when a booking is confirmed,
the system defines the reminder copy (es-AR) and its accessible announcement
role. Docs only — no implementation in this change.

## Scope
- IN: reminder copy (es-AR), announcement semantics, acceptance scenarios.
- OUT: scheduling, sending, any prod code, migrations, UI changes.

## Rollback
Delete this change dir. No prod surface affected.

## Gates
- docs-only: `pnpm lint` / `typecheck` unaffected (no code touched).
- Verifies against `openspec/config.yaml` rules (Given/When/Then, RFC 2119).
