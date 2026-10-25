import { describe, expect, it } from 'vitest';

import { candidateSlots, computeAvailableSlots, parseClock } from '../src/availability';

/**
 * [T-F2.3 — slots con tachados visibles] candidateSlots returns the FULL slot
 * reel for a window (every cadence start whose block fits), so the picker can
 * render taken slots crossed out: taken = candidates − available.
 *
 * It MUST stay a superset of computeAvailableSlots over the same inputs — the
 * tachado UI derives taken by complement, so any drift between the two loops
 * would either hide a bookable slot or cross out a bookable one.
 */
describe('candidateSlots — the full slot reel (T-F2.3 tachados)', () => {
  const open = { start: parseClock('09:00'), end: parseClock('13:00') };

  it('lists every cadence start whose block fits (no blocking logic)', () => {
    // duration 60 + buffer 0 = block 60 min, step 15:
    // starts 09:00 … 12:00 (12:00 + 60 = 13:00 fits) → 13 candidates.
    expect(candidateSlots(open, 60, 0)).toEqual([
      '09:00',
      '09:15',
      '09:30',
      '09:45',
      '10:00',
      '10:15',
      '10:30',
      '10:45',
      '11:00',
      '11:15',
      '11:30',
      '11:45',
      '12:00',
    ]);
  });

  it('honours the buffer in the fit check', () => {
    // duration 60 + buffer 15 = block 75: last fitting start is 11:45.
    const slots = candidateSlots(open, 60, 15);
    expect(slots[0]).toBe('09:00');
    expect(slots[slots.length - 1]).toBe('11:45');
  });

  it('is always a superset of computeAvailableSlots (tachados never hide a bookable slot)', () => {
    const blocked = [
      { start: parseClock('10:00'), end: parseClock('10:30') },
      { start: parseClock('11:00'), end: parseClock('12:00') },
    ];
    const available = computeAvailableSlots(open, blocked, 60, 0);
    const candidates = candidateSlots(open, 60, 0);
    expect(available.length).toBeGreaterThan(0);
    expect(candidates.length).toBeGreaterThan(available.length);
    for (const slot of available) {
      expect(candidates).toContain(slot);
    }
  });

  it('empty window yields no candidates', () => {
    const tinyWindow = { start: parseClock('09:00'), end: parseClock('09:30') };
    expect(candidateSlots(tinyWindow, 60, 0)).toEqual([]);
  });
});
