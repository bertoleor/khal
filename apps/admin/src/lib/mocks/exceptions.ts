import type { CalendarException } from '@khal/validations';

const seed: CalendarException[] = [
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    title: 'Feriado nacional',
    type: 'holiday',
    date: '2026-12-25',
  },
];

// In-memory mock store (CQ-04). Replaced by the typed Supabase
// `calendar_exceptions` table once linked (SCH-03).
class ExceptionStore {
  constructor(private items: CalendarException[] = seed) {}

  list(): CalendarException[] {
    return [...this.items];
  }

  add(input: Omit<CalendarException, 'id'>): CalendarException {
    const item: CalendarException = { id: crypto.randomUUID(), ...input };
    this.items.push(item);
    return item;
  }
}

export const exceptionsStore = new ExceptionStore();
