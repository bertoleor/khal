import { createHmac, timingSafeEqual } from 'node:crypto';

// WEBHOOKS-01 layer 3 — HMAC-SHA256 signature validation with constant-time
// comparison. This is the only case where a non-200 response is returned.
export function isValidSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest();
  const provided = Buffer.from(signature, 'hex');
  if (expected.length !== provided.length) {
    return false;
  }
  return timingSafeEqual(expected, provided);
}

// WEBHOOKS-01 layer 1 — idempotency on inbound event ids. In production this is
// backed by the `processed_events` table (persisted); this in-memory version
// documents the contract and is testable without a database.
export class EventDeduplicator {
  private readonly seen = new Set<string>();

  isDuplicate(eventId: string): boolean {
    if (this.seen.has(eventId)) {
      return true;
    }
    this.seen.add(eventId);
    return false;
  }
}
