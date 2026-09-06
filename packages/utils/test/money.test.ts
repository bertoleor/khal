import { describe, expect, it } from "vitest";
import { centsToDigits, computeAmountDueCents, formatCents } from "@khal/utils";

describe("money", () => {
  it("formats integer cents as currency via Intl.NumberFormat", () => {
    const result = formatCents(4500000, "ARS");
    expect(result).toContain("45");
  });

  it("converts cents to two-decimal digits deterministically", () => {
    expect(centsToDigits(1234)).toBe("12.34");
  });

  it("keeps cent precision for sub-1 amounts without float drift", () => {
    expect(centsToDigits(1)).toBe("0.01");
  });
});

describe("computeAmountDueCents", () => {
  it("returns full price when no deposit is set", () => {
    expect(computeAmountDueCents(4500000)).toBe(4500000);
    expect(computeAmountDueCents(4500000, "full")).toBe(4500000);
  });

  it("returns the fixed deposit amount", () => {
    expect(computeAmountDueCents(3800000, "fixed", 1500000)).toBe(1500000);
  });

  it("computes a percentage deposit with integer HALF_UP rounding", () => {
    expect(computeAmountDueCents(4500000, "percentage", undefined, 3000)).toBe(
      1350000,
    );
  });

  it("rounds half-up without float drift on sub-cent fractions", () => {
    // 0.5% of 100 cents = 0.5 -> HALF_UP rounds to 1
    expect(computeAmountDueCents(100, "percentage", undefined, 50)).toBe(1);
  });
});
