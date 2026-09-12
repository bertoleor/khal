---
name: khal-staff-booking
description: >
  Use when touching the public booking funnel (apps/web). Computed availability
  via `@khal/db` (SCH-01/02), business-hours/blocked consensus with mocks,
  booking Server Action (create_booking RPC contract), and 1-pending-per-phone +
  blacklist admission rules.
metadata:
  author: khal
  version: "0.1.0"
---

# Khal staff booking (public funnel, apps/web)

The public funnel runs on Server Components calling computed availability
(SCH-01: **computed, never pre-generated**) plus a single Server Action,
`createBooking`, for the `reservar` step. Slot display is a small grid: day pill
row + HH:MM slot grid.

## Availability engine — MUST use `@khal/db`, never re-implement

```ts
import { computeAvailableSlots, parseClock, toIsoDate } from "@khal/db"; // toIsoDate via @khal/utils
```
Engine: given an `open` TimeRange, `blocked[]`, `durationMinutes`, `bufferMinutes`
(= SCH-02) it walks `start += stepMinutes (15)` from `open.start` to
`open.end − (duration + buffer)`, skipping any candidate that
`rangesOverlap(candidate, blocked[i])`. Slots are returned as `"HH:MM"` strings.
🚫 never pre-generate/store slots; 🚫 never skip the `duration + buffer` block in
selection (end overlap matters).

Availability inputs come from the same service:
- `businessHoursFor(weekday)` → `{open, close}` or `null` (closed).
- `blockedPeriodsFor(date, weekday)` → `TimeRange[]` (mock "today" shows 2 periods).
Mocks (`apps/web/src/lib/mocks/schedule.ts`, `settings.ts`, `services.ts`) are
explicitly **CQ-04 provisional**; they are replaced by
`provider_schedules`/`business_hours` from Supabase but keep the exact same
function boundaries, so dependents don't change. Timezone default: business tz.

## Booking Server Action (`apps/web/src/lib/actions/booking.ts`)

`"use server"` + the standard form pattern:

```ts
const parsed = bookingInputSchema.safeParse({ serviceId: formData.get("serviceId"), ... });
if (!parsed.success) return { ok: false, code: "invalid" };
```
Normalize/unify the response contract (`BookingState { ok, code?, bookingId? }`).
🚫 never throw on validation; return a state with `code`.

Current admission rules implemented at the app layer (mock store, in-memory);
the **final contract** is the `SECURITY DEFINER` Postgres RPC `create_booking`
(CONCURRENCIA-01 L2), which enforces the same rules with `FOR UPDATE` + overlap
probe + idempotency + blacklist. Keep your app-layer read of rules _aligned_ with
that contract; do not introduce conflicting policy inside the web action.

- Blacklist → `{ ok: false, code: "blacklisted" }`.
- 1 pending per phone → `heldBookings` (map) → `{ ok: false, code: "duplicate" }`.
- Success returns `{ ok: true, bookingId }`.

`bookingId` is `crypto.randomUUID()`. The UI maps `code` →
`booking.error.invalid/duplicate/blacklisted` (i18n, `t(errorKeyFor(...))`).

## UI coupling

- `apps/web/src/components/booking/booking-form.tsx` uses `useActionState(createBooking,
  initialBookingState)`; on `ok` + `bookingId` renders `<PaymentStep/>`.
- Errors render via messages in `apps/web/messages/*.json` under `booking.error.*`.
- `SlotPicker` is a pure component expecting `DaySlot { date, label, closed, slots }`;
  a closed day renders as disabled buttons (`/booking/messages: "closed": "Cerrado."`).
- In `reservar/page.tsx`, generate the next 7 `DaySlot`s, label them via
  `Intl.DateTimeFormat(locale, {weekday, day, month})`. Payment info is built
  once there with `computeAmountDueCents` + `formatCents` and passes down.