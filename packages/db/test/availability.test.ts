import { describe, expect, it } from "vitest";
import {
  computeAvailableSlots,
  parseClock,
  rangesOverlap,
  type TimeRange,
} from "@khal/db";

const range = (start: string, end: string): TimeRange => ({
  start: parseClock(start),
  end: parseClock(end),
});

describe("computeAvailableSlots", () => {
  it("fits slots within the open window including duration + buffer", () => {
    // 09:00-10:00, 30min service + 15min buffer = 45min block → only 09:00, 09:15
    const slots = computeAvailableSlots(range("09:00", "10:00"), [], 30, 15);
    expect(slots).toEqual(["09:00", "09:15"]);
  });

  it("excludes the extra slot when buffer is added", () => {
    const noBuffer = computeAvailableSlots(range("09:00", "10:00"), [], 30, 0);
    const withBuffer = computeAvailableSlots(
      range("09:00", "10:00"),
      [],
      30,
      15,
    );
    // 30min + 0 buffer fits 09:00, 09:15, 09:30; buffer blocks the last one
    expect(noBuffer).toEqual(["09:00", "09:15", "09:30"]);
    expect(withBuffer).toEqual(["09:00", "09:15"]);
  });

  it("excludes slots overlapping a blocked period", () => {
    // 15min service, no buffer; blocked 09:15-09:20 knocks out 09:15 only
    const slots = computeAvailableSlots(
      range("09:00", "10:00"),
      [range("09:15", "09:20")],
      15,
      0,
    );
    expect(slots).toEqual(["09:00", "09:30", "09:45"]);
  });
});

describe("rangesOverlap", () => {
  it("detects half-open overlap", () => {
    expect(
      rangesOverlap(range("09:00", "10:00"), range("09:30", "11:00")),
    ).toBe(true);
    expect(
      rangesOverlap(range("09:00", "09:30"), range("09:30", "10:00")),
    ).toBe(false);
  });
});
