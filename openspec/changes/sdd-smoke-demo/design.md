# Design: sdd-smoke-demo — Reservation Reminder Copy

## Context
Docs-only example. No architecture impact. References `DOCS/05-marketing-tono.md`
(es-AR tone) and `DOCS/03-funciones.md` (booking domain).

## Decision
Define the reminder as pure content + semantics:
- Copy string (es-AR, voseo): fixed text with `{nombre}` and `{hora}` slots.
- Announcement: `role="status"` polite live region (mirrors existing
  copy-announce pattern in apps/web, no new component).

## Alternatives considered
- New reminder component → rejected (out of scope, prod code).
- Email/push scheduling → rejected (out of scope).

## Sequence
1. Booking confirmed → 2. Reminder content resolved (future) → 3. Announced
   via `role="status"` (future). This change documents steps 2–3 only.
