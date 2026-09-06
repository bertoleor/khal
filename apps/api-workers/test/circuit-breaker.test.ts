import { describe, expect, it } from "vitest";
import { CircuitBreaker } from "@khal/api-workers";

describe("CircuitBreaker", () => {
  it("opens after the failure threshold is reached", () => {
    const time = 0;
    const breaker = new CircuitBreaker(
      { failureThreshold: 3, openMs: 30000 },
      () => time,
    );
    expect(breaker.getState()).toBe("closed");
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState()).toBe("closed");
    breaker.recordFailure();
    expect(breaker.getState()).toBe("open");
  });

  it("blocks attempts while open and probes half-open after cooldown", () => {
    let time = 0;
    const breaker = new CircuitBreaker(
      { failureThreshold: 3, openMs: 30000 },
      () => time,
    );
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.canAttempt()).toBe(false);
    time = 30000;
    expect(breaker.canAttempt()).toBe(true);
    expect(breaker.getState()).toBe("half_open");
  });

  it("closes again on success during half-open", () => {
    let time = 0;
    const breaker = new CircuitBreaker(
      { failureThreshold: 3, openMs: 30000 },
      () => time,
    );
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    time = 30000;
    expect(breaker.canAttempt()).toBe(true);
    breaker.recordSuccess();
    expect(breaker.getState()).toBe("closed");
  });

  it("re-opens immediately on failure during half-open", () => {
    let time = 0;
    const breaker = new CircuitBreaker(
      { failureThreshold: 3, openMs: 30000 },
      () => time,
    );
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    time = 30000;
    expect(breaker.canAttempt()).toBe(true);
    breaker.recordFailure();
    expect(breaker.getState()).toBe("open");
  });
});
