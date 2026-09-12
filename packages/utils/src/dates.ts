/**
 * Format a Date as a local YYYY-MM-DD string.
 * Uses local time (not UTC) so the result matches the user's calendar day.
 */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
