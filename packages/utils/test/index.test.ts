import { describe, expect, it } from "vitest";
import { cn } from "@khal/utils";

describe("cn", () => {
  it("joins truthy class names with a single space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy entries", () => {
    expect(cn("a", null, "b", undefined, false, "", "c")).toBe("a b c");
  });

  it("returns an empty string when nothing is provided", () => {
    expect(cn()).toBe("");
  });
});
