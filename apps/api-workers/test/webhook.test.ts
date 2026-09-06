import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { EventDeduplicator, isValidSignature } from "@khal/api-workers";

describe("isValidSignature", () => {
  const secret = "test-secret";
  const payload = JSON.stringify({ event_id: "abc" });
  const signature = createHmac("sha256", secret).update(payload).digest("hex");

  it("accepts a valid HMAC signature", () => {
    expect(isValidSignature(payload, signature, secret)).toBe(true);
  });

  it("rejects a signature from the wrong secret", () => {
    expect(isValidSignature(payload, signature, "wrong-secret")).toBe(false);
  });

  it("rejects a malformed signature", () => {
    expect(isValidSignature(payload, "not-hex!", secret)).toBe(false);
  });
});

describe("EventDeduplicator", () => {
  it("deduplicates repeated event ids", () => {
    const deduplicator = new EventDeduplicator();
    expect(deduplicator.isDuplicate("evt-1")).toBe(false);
    expect(deduplicator.isDuplicate("evt-1")).toBe(true);
    expect(deduplicator.isDuplicate("evt-2")).toBe(false);
  });
});
