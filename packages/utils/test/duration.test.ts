import { describe, expect, it } from 'vitest';

import { formatClock24, formatCompactDay, formatDurationLabel } from '../src/dates';

describe('v7 date/duration labels (recibo + estado rows)', () => {
  const nov3 = new Date('2026-11-03T11:00:00');

  it('formatCompactDay reads weekday-first ("mar 3") in es-AR', () => {
    expect(formatCompactDay(nov3, 'es-AR')).toBe('mar 3');
  });

  it('formatCompactDay keeps the preview order even in day-first locales', () => {
    // en-US formats parts as "3 Tue" — the join must stay weekday-first.
    expect(formatCompactDay(nov3, 'en-US')).toBe('Tue 3');
  });

  it('formatClock24 renders the 24h slot time', () => {
    expect(formatClock24(nov3, 'es-AR')).toBe('11:00');
  });

  it('formatDurationLabel reads whole hours as "1 h" (S8) and the rest in minutes', () => {
    expect(formatDurationLabel(60)).toBe('1 h');
    expect(formatDurationLabel(90)).toBe('90 min');
  });
});
