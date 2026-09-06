export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  openMs: number;
}

// RESILIENCIA-01 — fail-fast circuit breaker. Opens after `failureThreshold`
// consecutive failures, blocks calls while open, then probes in half-open after
// `openMs`. Time is injectable to stay deterministic under test.
export class CircuitBreaker {
  private current: CircuitState = "closed";
  private failures = 0;
  private openedAt = 0;

  constructor(
    private readonly options: CircuitBreakerOptions,
    private readonly now: () => number = Date.now,
  ) {}

  getState(): CircuitState {
    return this.current;
  }

  canAttempt(): boolean {
    if (this.current === "open") {
      if (this.now() - this.openedAt >= this.options.openMs) {
        this.current = "half_open";
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.current = "closed";
  }

  recordFailure(): void {
    this.failures += 1;
    if (
      this.current === "half_open" ||
      this.failures >= this.options.failureThreshold
    ) {
      this.open();
    }
  }

  private open(): void {
    this.current = "open";
    this.openedAt = this.now();
  }
}
