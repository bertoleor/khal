export interface ClockTime {
  hours: number;
  minutes: number;
}

export interface TimeRange {
  start: ClockTime;
  end: ClockTime;
}

export function toMinutes(time: ClockTime): number {
  return time.hours * 60 + time.minutes;
}

export function fromMinutes(total: number): ClockTime {
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

export function formatClock(totalMinutes: number): string {
  const { hours, minutes } = fromMinutes(totalMinutes);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function parseClock(value: string): ClockTime {
  const [hours, minutes] = value.split(':').map(Number);
  return { hours, minutes };
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  const aStart = toMinutes(a.start);
  const aEnd = toMinutes(a.end);
  const bStart = toMinutes(b.start);
  const bEnd = toMinutes(b.end);
  return aStart < bEnd && bStart < aEnd;
}

// Cadence starts (SCH-01/SCH-02): every `stepMinutes` tick whose
// [start, start + durationMinutes + bufferMinutes) block fits inside the
// open window. Reeled once here and consumed by both computeAvailableSlots
// (conflict-filtered) and candidateSlots (full reel) so their loop bounds
// and step can never drift apart.
function cadenceStarts(open: TimeRange, block: number, stepMinutes: number): number[] {
  const openStart = toMinutes(open.start);
  const openEnd = toMinutes(open.end);
  const starts: number[] = [];

  for (let start = openStart; start + block <= openEnd; start += stepMinutes) {
    starts.push(start);
  }

  return starts;
}

// SCH-01/SCH-02 — availability is computed, never pre-generated.
// A slot at `start` is offered only when [start, start + duration + buffer)
// fits within the open window and does not overlap any blocked period.
export function computeAvailableSlots(
  open: TimeRange,
  blocked: TimeRange[],
  durationMinutes: number,
  bufferMinutes: number,
  stepMinutes = 15
): string[] {
  const block = durationMinutes + bufferMinutes;
  const result: string[] = [];

  for (const start of cadenceStarts(open, block, stepMinutes)) {
    const candidate: TimeRange = {
      start: fromMinutes(start),
      end: fromMinutes(start + block),
    };
    const conflicts = blocked.some((period) => rangesOverlap(candidate, period));
    if (!conflicts) {
      result.push(formatClock(start));
    }
  }

  return result;
}

// T-F2.3 (slots con tachados): the FULL slot reel for a window — every
// cadence start whose [start, start + duration + buffer) fits, with NO
// blocking logic. The picker renders taken slots as the complement:
// taken = candidateSlots(...) − computeAvailableSlots(...).
// MUST stay a superset of computeAvailableSlots (same loop bounds + step) —
// guaranteed here by construction: both reel from cadenceStarts. The
// contract is pinned by packages/db/test/candidate-slots.test.ts.
export function candidateSlots(
  open: TimeRange,
  durationMinutes: number,
  bufferMinutes: number,
  stepMinutes = 15
): string[] {
  const block = durationMinutes + bufferMinutes;
  return cadenceStarts(open, block, stepMinutes).map((start) => formatClock(start));
}
