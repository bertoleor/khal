export function formatCents(
  cents: number,
  currency: string,
  locale = "es-AR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function centsToDigits(cents: number): string {
  return (cents / 100).toFixed(2);
}

export type DepositMode = "full" | "fixed" | "percentage";

// MONEY-01/02 — computes the amount due in integer cents with explicit
// ROUND_HALF_UP, using pure integer arithmetic (no floats, no Decimal.js:
// this is a single-step percentage, so native integer math suffices per CQ-05).
export function computeAmountDueCents(
  priceCents: number,
  mode?: DepositMode,
  fixedCents?: number,
  percentageBp?: number,
): number {
  if (mode === "fixed" && fixedCents != null) {
    return fixedCents;
  }
  if (mode === "percentage" && percentageBp != null) {
    const numerator = priceCents * percentageBp;
    return Math.floor((numerator + 5000) / 10000);
  }
  return priceCents;
}