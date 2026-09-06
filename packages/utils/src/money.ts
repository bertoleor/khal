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