import { describe, expect, it } from "vitest";
import { centsToDigits, formatCents } from "@khal/utils";

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