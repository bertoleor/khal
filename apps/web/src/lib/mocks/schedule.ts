import type { TimeRange } from '@khal/db';

export interface DayHours {
  open: string;
  close: string;
}

// Provisional fixtures (CQ-04). Replaced by provider_schedules/business_hours
// and confirmed appointments from Supabase once linked.
export function businessHoursFor(weekday: number): DayHours | null {
  return weekday === 0 ? null : { open: '09:00', close: '18:00' };
}

export function blockedPeriodsFor(date: string, weekday: number): TimeRange[] {
  if (weekday === 0) {
    return [];
  }
  const [y, m, d] = date.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const isToday =
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate();
  if (!isToday) {
    return [];
  }
  return [
    { start: { hours: 10, minutes: 0 }, end: { hours: 11, minutes: 15 } },
    { start: { hours: 14, minutes: 30 }, end: { hours: 15, minutes: 45 } },
  ];
}
