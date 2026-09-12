---
name: khal-validations
description: >
  Use when reading, editing, or trusting validation in khal. The `@khal/validations`
  package — zod schemas, the appointment status state machine, money/date/regex
  invariants, and the safeParse-at-the-boundary rule to always apply at input edges.
metadata:
  author: khal
  version: "0.1.0"
---

# Khal validations

Single source of truth for all input/dto validation and domain invariants, in
`packages/validations/src/index.ts` (re-exported as `@khal/validations`). Futures:
a schema must not be re-declared in apps — import it.

## Non-negotiable boundaries (MUST)

- Validate **at the edge** with `schema.safeParse(...)`. 🚫 never `parse` (throws)
  in Server Actions; 🚫 never trust a raw `FormData` value without parsing.
- Coerce through schemas — do not hand-roll checks. Server actions pass `FormData`
  values straight into a schema (`bookingInputSchema.safeParse(raw)`).
- Delegate _display_ (formatting) to `@khal/utils`, keep `@khal/validations` pure
  validation + invariants only.

## Canonical shape rules

- `id` is always `z.string().uuid()`.
- Dates: `YYYY-MM-DD` → `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`.
- Times: 24h `HH:MM` → `z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)` (validates
  both hours 00–23 and minutes 00–59).
- Money: `z.number().int().nonnegative()` for cents — integer discipline MONEY-01.
  Deposit percent field `deposit_percentage_bp`: `z.number().int().min(0).max(10000)`.
- Phone: `z.string().trim().min(6).max(24).regex(/^\+?[0-9\s-]+$/)`.
- Email: `z.string().trim().email().max(320)`.

## Lifecycle = enum state machine (ECOM-03)

Status is a zod enum, **not** a boolean:
`appointmentStatusSchema = z.enum(["pendiente","confirmado","cancelado","no_asistio"])`.

Transition rule: **only the explicit map, never ad-hoc**.
```ts
export const VALID_APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pendiente:   ["confirmado", "cancelado", "no_asistio"],
  confirmado:  ["cancelado", "no_asistio"],
  cancelado:   [],
  no_asistio:  [],
};
export function canTransitionAppointment(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return VALID_APPOINTMENT_TRANSITIONS[from].includes(to);
}
```
🚫 never permit arbitrary jumps (e.g. `cancelado → confirmado`, reversing a
terminal state); the transition must go through `canTransitionAppointment`.

## Models shift on serialize vs input

- Serde boundary: e.g. `apt`/`booking` use **snake_case** fields
  (`price_cents`, `deposit_percentage_bp`, `duration_minutes`, `sort_order`,
  `is_visible`, `currency_code`, `buffer_minutes`); the public booking **input**
  DTO uses camelCase (`serviceId`, `slotStart`, `depositMode`).
- Payload enums mirror the Postgres enums exactly: `appointment_status`,
  `deposit_mode` (`full|fixed|percentage`), `exception_type`
  (`holiday|vacation|event|block`). Keep the TS enum string values equal to the
  SQL enum labels.

## Derived input schemas

`calendarExceptionInputSchema = calendarExceptionSchema.omit({ id: true })` — build
input shapes from the stored shape via `.omit`, never re-type from scratch. (The
Admin `addException` passes optional `startTime`/`endTime` as `undefined` for
full-day — the parser splits that locally.)

## Test gate

The invariant map and a representative positive + negative case per schema MUST
stay green in `packages/validations/test/validations.test.ts`. Change a transition
or a regex → update the test in the same change.