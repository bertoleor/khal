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

/**
 * v7 (S6/S10 — approved preview): the compact day the clienta reads on the
 * recibo and estado rows — "mar 3" — always weekday-first regardless of how
 * the locale orders parts (en-US formats "3 Tue", the preview order wins).
 */
export function formatCompactDay(date: Date, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return `${weekday} ${day}`.trim();
}

/** v7: the 24h clock label — 11:00 for the recibo/estado rows. */
export function formatClock24(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * v7 (S8): durations read as hours — 60 -> "1 h" until the dueña confirms
 * real durations. Same semantics as the servicio detail screen, shared so
 * the recibo and the estado never disagree with it.
 */
export function formatDurationLabel(minutes: number): string {
  return minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`;
}
