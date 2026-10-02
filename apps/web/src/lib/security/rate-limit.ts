/**
 * [KHAL-A4 / t_28b371ff] Fixed-window rate limiter for the public booking
 * flow, backed by Upstash Redis REST (env already declared in config/env.ts,
 * previously a promise with zero consumers).
 *
 * Design — layered with Turnstile (turnstile.ts):
 *   * Fail-OPEN by contract: a Redis outage must never take the booking
 *     business down; Turnstile is the hard anti-bot control, this is
 *     defence-in-depth against floods. Every error path (missing env,
 *     transport failure, non-2xx, malformed payload) allows the request and
 *     lets the next layer decide.
 *   * Fixed window via a single /pipeline call: INCR + EXPIRE NX together —
 *     atomic enough for a booking form, one RTT, no client library, just
 *     fetch (the @upstash/redis package would add a dependency for nothing).
 *   * Identifier: client IP first (header-derived by the action); fallback
 *     hash of the submitted phone — hashed with sha256 so raw PII never
 *     lands in Redis keys.
 */

import { createHash } from 'node:crypto';

export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/** Booking attempts per identifier per fixed window. */
const BOOKING_RATE_LIMIT_MAX = 4;

/** Fixed window length in seconds (also the retry hint). */
export const BOOKING_RATE_LIMIT_WINDOW_SECONDS = 60;

/** Key prefix — one bucket per action, so future admin-side limits don't collide. */
const KEY_PREFIX = 'khal:booking:rl:';

export function bookingRateLimitIdentifier(ip: string, phone: string): string {
  if (ip && ip !== 'unknown') {
    return `ip:${ip}`;
  }
  return `phone:${hashIdentifier(phone)}`;
}

function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Consume one attempt for `identifier`. Allowed unless the Upstash counter
 * says the window is exhausted. Errors fail open (allowed).
 */
export async function checkBookingRateLimit(identifier: string): Promise<RateLimitDecision> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return { allowed: true };
  }

  const key = `${KEY_PREFIX}${identifier}`;
  const window = BOOKING_RATE_LIMIT_WINDOW_SECONDS;

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, window, 'NX'],
      ]),
    });

    if (!response.ok) {
      return { allowed: true };
    }

    const payload: unknown = await response.json().catch(() => null);
    // Upstash pipeline answer shape: [ [ "count" ], [ "OK" ] ]
    const first = Array.isArray(payload) ? (payload[0] as unknown[]) : null;
    const count = Array.isArray(first) && first.length > 0 ? Number(first[0]) : NaN;

    if (!Number.isFinite(count)) {
      return { allowed: true };
    }

    if (count > BOOKING_RATE_LIMIT_MAX) {
      return { allowed: false, retryAfterSeconds: window };
    }
    return { allowed: true };
  } catch {
    // Fail-open: Redis down never blocks a booking (Turnstile still guards).
    return { allowed: true };
  }
}
