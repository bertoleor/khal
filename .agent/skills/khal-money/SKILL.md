---
name: khal-money
description: >
  Use when any khal code reads, writes, computes, or displays money. Integer cents
  invariant (MONEY-01), CurrencyCode/Cents types, formatCents, computeAmountDueCents,
  and basis-point deposit math with ROUND_HALF_UP — no floats, never stored dollars.
metadata:
  author: khal
  version: "0.1.0"
---

# Khal money

Money is **integer cents** everywhere (MONEY-01/03), mirroring the Postgres
`price_cents INTEGER` + `currency_code CHAR(3)`. 🚫 never store or compute money
as float dollars; a single `Number` decimal field is a defect, not a style choice.

## Types (`packages/types`)

```ts
export type CurrencyCode = "ARS" | "USD";
export type Cents = number;   // integer cents — not a dollar amount
```
🚫 never invent new currency enum values not in `CurrencyCode`; `"ARS"` is the
default and primary store currency.

## Canonical helpers (`packages/utils/src/money.ts`) — prefer over ad-hoc

- `formatCents(cents, currency, locale="es-AR")` — real display
  (`Intl.NumberFormat` style currency), divides by 100 internally.
- `centsToDigits(cents)` — deterministic two-decimal string, no float drift
  (`centsToDigits(1) === "0.01"`); uses `(cents/100).toFixed(2)`.
- `computeAmountDueCents(priceCents, mode?, fixedCents?, percentageBp?)` —
  deposit amount in integer cents:
   - `"full"` / no mode → full price
   - `"fixed"` → `fixedCents`
   - `"percentage"` → `ROUND_HALF_UP(priceCents * bp / 10000)`
- `increaseCentsByBp(cents, bp)` — the same half-up math used by admin's
  `bulkIncrease` (10% inflation bump = `bp: 1000`).

Basis points: a percentage is stored as **bp where 50% = 5000**, never a 0–100
decimal. Sanitize at the boundary: `percentageBp <= 10000` (validations).

## Contract it documents

`ROUND_HALF_UP` and integer arithmetic are **explicit** on purpose: percentage
deposits/increases are single-step, so native integer math suffices (per CQ-05 —
no Decimal.js dependency; the fraction `+5000/10000` implements half-up).
Exact reference implementation:
```ts
// percentage deposit
const numerator = priceCents * percentageBp;
return Math.floor((numerator + 5000) / 10000);
// increase
return Math.floor((cents * bp + 5000) / 10000);
```
🚫 never `Math.round` plain float `cents*bp/100` — it reintroduces float drift and
breaks sub-cent half-up expectations (test: 100¢ at 0.5% → 1¢, 15¢ +1000bp → 2¢).

## Snapshot & precedence

- `amount_due_*` and `currency_code` are **snapshots taken at booking creation**,
  not recomputed later for a booking.
- Precedence for `deposit_*`: service-level value overrides the store default;
  `NULL` → inherit store default. `isDeposit = mode === "fixed" || mode === "percentage"`
  (see `apps/web/.../reservar/page.tsx`).

## Tests MUST stay current

`packages/utils/test/money.test.ts` locks: no-float-drift, exact half-up rounding,
`formatCents` locale behavior, and the `bulkIncrease` path. Any change to rounding
or precedence updates these tests in the same change.