import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * [KHAL-A4 / t_28b371ff] Anti-bot layered defence for the public createBooking
 * server action — brute-force of slots + phone enumeration (P2).
 *
 * TDD target (RED first): createBooking must NOT reach the create_booking RPC
 * unless BOTH layers pass, in order:
 *
 *   1. Rate limit (Upstash REST fixed window, fail-OPEN — a Redis outage must
 *      not stop the business) — rejects floods before spending Turnstile quota.
 *   2. Turnstile server-side verification (fail-CLOSED — no secret, no token,
 *      rejected token, network failure: NO booking, ever).
 *
 * Plus the auxiliary fixes from the finding:
 *   - p_client_ip is finally populated (the RPC already hashes it into ip_hash;
 *     it was always null).
 *   - idempotency key is stable per form lifetime (client-generated), so a
 *     network-error retry replays instead of creating a second booking.
 *
 * The static-contract section (same pattern as a11y-p3-contract.test.ts) pins
 * the form wiring: Turnstile widget inside the form, stable idempotencyKey
 * hidden input, i18n keys for the two new codes in BOTH locales, and the env
 * consumption contract.
 */

const REAL_FETCH = globalThis.fetch;

/** fetch calls seen by the current mock — (url, init) tuples. */
const fetchCalls = vi.hoisted(() => [] as Array<[string, RequestInit]>);

const mockRpc = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/booking-client', () => ({
  readBookingSupabaseEnv: vi.fn(() => ({ url: 'https://khal.supabase.co', anonKey: 'anon-key' })),
  createBookingSupabaseClient: vi.fn(() => ({ rpc: mockRpc })),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get(name: string) {
      return name === 'x-forwarded-for' ? '203.0.113.7' : null;
    },
  })),
}));

import { createBooking } from '@/lib/actions/booking';
import { bookingRateLimitIdentifier, checkBookingRateLimit } from '@/lib/security/rate-limit';
import { verifyTurnstileToken } from '@/lib/security/turnstile';

const ENV_KEYS = [
  'TURNSTILE_SECRET_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

function setServerEnv(kv: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  for (const key of ENV_KEYS) {
    if (kv[key] === undefined) delete process.env[key];
    else process.env[key] = kv[key];
  }
}

function bookingFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set('serviceId', '11111111-1111-4111-8111-111111111111');
  fd.set('date', '2099-01-05');
  fd.set('slotStart', '10:00');
  fd.set('name', 'Ada Lovelace');
  fd.set('phone', '+5491122334455');
  fd.set('email', 'ada@example.com');
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

/**
 * Routes fetch to the right mock by URL:
 *   - siteverify  -> turnstile answer
 *   - /pipeline   -> upstash answer with `count`
 * Records every call into fetchCalls.
 */
function mockFetch(routes: {
  turnstile?: { success: boolean } | { status: number } | { throw: true };
  upstashCount?: number;
  upstashError?: { status: number } | { throw: true };
}) {
  fetchCalls.length = 0;
  globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
    const target = String(url);
    fetchCalls.push([target, init ?? ({} as RequestInit)]);
    if (target.includes('siteverify')) {
      if (routes.turnstile && 'throw' in routes.turnstile) {
        throw new Error('network down');
      }
      if (routes.turnstile && 'status' in routes.turnstile) {
        return new Response(JSON.stringify({}), { status: routes.turnstile.status });
      }
      return new Response(JSON.stringify(routes.turnstile ?? { success: false }), {
        status: 200,
      });
    }
    if (target.includes('/pipeline')) {
      if (routes.upstashError && 'throw' in routes.upstashError) {
        throw new Error('redis down');
      }
      if (routes.upstashError && 'status' in routes.upstashError) {
        return new Response(JSON.stringify({}), { status: routes.upstashError.status });
      }
      return new Response(JSON.stringify([[String(routes.upstashCount ?? 1)], ['OK']]), {
        status: 200,
      });
    }
    throw new Error(`unexpected fetch: ${target}`);
  }) as unknown as typeof fetch;
}

const sitesVerifyCalls = () => fetchCalls.filter(([u]) => u.includes('siteverify')).length;

beforeEach(() => {
  setServerEnv({}); // clean slate: no turnstile secret, no upstash
  fetchCalls.length = 0; // survives across tests unless mockFetch resets it
  mockRpc.mockReset();
  mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
});

afterEach(() => {
  setServerEnv({});
  globalThis.fetch = REAL_FETCH;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Layer 1 — Turnstile verification module (fail-closed)
// ---------------------------------------------------------------------------
describe('verifyTurnstileToken — fail-closed server-side verification', () => {
  it('denies without ever calling Cloudflare when the secret is missing', async () => {
    mockFetch({ turnstile: { success: true } });

    const result = await verifyTurnstileToken(undefined, 'tok');

    expect(result).toEqual({ ok: false, reason: 'not_configured' });
    expect(sitesVerifyCalls()).toBe(0);
  });

  it('denies an empty or missing token before any network call', async () => {
    mockFetch({ turnstile: { success: true } });

    expect(await verifyTurnstileToken('secret', '')).toEqual({
      ok: false,
      reason: 'missing_token',
    });
    expect(await verifyTurnstileToken('secret', null)).toEqual({
      ok: false,
      reason: 'missing_token',
    });
    expect(await verifyTurnstileToken('secret', undefined)).toEqual({
      ok: false,
      reason: 'missing_token',
    });
    expect(sitesVerifyCalls()).toBe(0);
  });

  it('accepts a token Cloudflare validates, forwarding secret/token/remoteip', async () => {
    mockFetch({ turnstile: { success: true } });

    const result = await verifyTurnstileToken('sec', 'tok', '203.0.113.7');

    expect(result).toEqual({ ok: true });
    expect(sitesVerifyCalls()).toBe(1);
    const [url, init] = fetchCalls[0];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const body = new URLSearchParams(String(init.body));
    expect(body.get('secret')).toBe('sec');
    expect(body.get('response')).toBe('tok');
    expect(body.get('remoteip')).toBe('203.0.113.7');
  });

  it('omits remoteip when the caller IP is unknown', async () => {
    mockFetch({ turnstile: { success: true } });

    await verifyTurnstileToken('sec', 'tok');

    const [, init] = fetchCalls[0];
    expect(new URLSearchParams(String(init.body)).get('remoteip')).toBeNull();
  });

  it('denies when Cloudflare rejects the token', async () => {
    mockFetch({ turnstile: { success: false } });

    expect(await verifyTurnstileToken('secret', 'tok')).toEqual({
      ok: false,
      reason: 'rejected',
    });
  });

  it('denies (never allows) on transport failure — fail-closed', async () => {
    mockFetch({ turnstile: { throw: true } });

    expect(await verifyTurnstileToken('secret', 'tok')).toEqual({
      ok: false,
      reason: 'network',
    });
  });

  it('denies a non-2xx siteverify response', async () => {
    mockFetch({ turnstile: { status: 503 } });

    expect(await verifyTurnstileToken('secret', 'tok')).toEqual({
      ok: false,
      reason: 'rejected',
    });
  });

  it('denies when the response JSON has no success:true (shape drift)', async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ oops: true }), { status: 200 })) as unknown as typeof fetch;

    expect(await verifyTurnstileToken('secret', 'tok')).toEqual({
      ok: false,
      reason: 'rejected',
    });
  });

  it('sends exactly one request — no retry loops', async () => {
    mockFetch({ turnstile: { success: true } });

    await verifyTurnstileToken('secret', 'tok');

    expect(sitesVerifyCalls()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Layer 2 — Upstash REST fixed-window rate limit (fail-open)
// ---------------------------------------------------------------------------
describe('checkBookingRateLimit — Upstash fixed window, fail-open', () => {
  it('allows without any network call when Upstash env is not configured', async () => {
    mockFetch({ upstashCount: 99 });

    const result = await checkBookingRateLimit('ip:1.2.3.4');

    expect(result).toEqual({ allowed: true });
    expect(fetchCalls).toHaveLength(0);
  });

  it('allows the first 4 attempts and blocks the 5th in the window', async () => {
    setServerEnv({
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    });

    for (const count of [1, 2, 3, 4]) {
      mockFetch({ upstashCount: count });
      expect(await checkBookingRateLimit('ip:1.2.3.4')).toEqual({ allowed: true });
    }

    mockFetch({ upstashCount: 5 });
    expect(await checkBookingRateLimit('ip:1.2.3.4')).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
  });

  it('runs INCR + EXPIRE NX in one pipeline call (fixed window)', async () => {
    setServerEnv({
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    });
    mockFetch({ upstashCount: 1 });

    await checkBookingRateLimit('ip:1.2.3.4');

    expect(fetchCalls).toHaveLength(1);
    const [url, init] = fetchCalls[0];
    expect(url).toBe('https://example.upstash.io/pipeline');
    const body = JSON.parse(String(init.body)) as unknown[];
    expect(body[0]).toEqual(['INCR', expect.stringContaining('khal:booking:rl:ip:1.2.3.4')]);
    expect(body[1]).toEqual(['EXPIRE', expect.stringContaining('khal:booking:rl:'), 60, 'NX']);
    expect(init.headers).toMatchObject({ authorization: 'Bearer token' });
  });

  it('fails OPEN on Redis transport failure — the booking flow survives', async () => {
    setServerEnv({
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    });
    mockFetch({ upstashError: { throw: true } });

    expect(await checkBookingRateLimit('ip:1.2.3.4')).toEqual({ allowed: true });
  });

  it('fails OPEN on a non-2xx Redis response', async () => {
    setServerEnv({
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    });
    mockFetch({ upstashError: { status: 500 } });

    expect(await checkBookingRateLimit('ip:1.2.3.4')).toEqual({ allowed: true });
  });

  it('fails OPEN when the pipeline payload shape is not understood', async () => {
    setServerEnv({
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    });
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ weird: true }), { status: 200 })) as unknown as typeof fetch;

    expect(await checkBookingRateLimit('ip:1.2.3.4')).toEqual({ allowed: true });
  });
});

describe('bookingRateLimitIdentifier — ip first, hashed phone fallback', () => {
  it('scopes the bucket to the client IP when known', () => {
    expect(bookingRateLimitIdentifier('203.0.113.7', '+5491122334455')).toBe('ip:203.0.113.7');
  });

  it('falls back to a hashed phone when no IP is available', () => {
    const id = bookingRateLimitIdentifier('unknown', '+5491122334455');
    expect(id).toMatch(/^phone:[0-9a-f]{64}$/);
    expect(id).not.toContain('5491122334455'); // raw PII never lands in Redis
  });
});

// ---------------------------------------------------------------------------
// createBooking — the action never reaches the RPC without both layers
// ---------------------------------------------------------------------------
describe('createBooking — layered admission before the RPC', () => {
  it('rejects with captcha_failed when the token is missing — RPC untouched', async () => {
    setServerEnv({ TURNSTILE_SECRET_KEY: 'secret' });
    mockFetch({ turnstile: { success: true } });
    mockRpc.mockResolvedValue({
      data: { ok: true, code: 'ok', booking_id: '22222222-2222-4222-8222-222222222222' },
      error: null,
    });

    const state = await createBooking({ ok: false }, bookingFormData());

    expect(state).toEqual({ ok: false, code: 'captcha_failed' });
    expect(mockRpc).not.toHaveBeenCalled();
    // The missing token is detected before Cloudflare is consulted.
    expect(sitesVerifyCalls()).toBe(0);
  });

  it('rejects with captcha_failed when TURNSTILE_SECRET_KEY is not configured — fail-closed, no silent downgrade', async () => {
    mockFetch({ turnstile: { success: true } });
    mockRpc.mockResolvedValue({
      data: { ok: true, code: 'ok', booking_id: '22222222-2222-4222-8222-222222222222' },
      error: null,
    });

    const state = await createBooking(
      { ok: false },
      bookingFormData({ 'cf-turnstile-response': 'tok' })
    );

    expect(state).toEqual({ ok: false, code: 'captcha_failed' });
    expect(mockRpc).not.toHaveBeenCalled();
    expect(sitesVerifyCalls()).toBe(0);
  });

  it('rejects with captcha_failed when Cloudflare rejects the token', async () => {
    setServerEnv({ TURNSTILE_SECRET_KEY: 'secret' });
    mockFetch({ turnstile: { success: false } });
    mockRpc.mockResolvedValue({
      data: { ok: true, code: 'ok', booking_id: '22222222-2222-4222-8222-222222222222' },
      error: null,
    });

    const state = await createBooking(
      { ok: false },
      bookingFormData({ 'cf-turnstile-response': 'forged' })
    );

    expect(state).toEqual({ ok: false, code: 'captcha_failed' });
    expect(mockRpc).not.toHaveBeenCalled();
    expect(sitesVerifyCalls()).toBe(1);
  });

  it('rejects with captcha_failed when siteverify is unreachable (fail-closed transport)', async () => {
    setServerEnv({ TURNSTILE_SECRET_KEY: 'secret' });
    mockFetch({ turnstile: { throw: true } });

    const state = await createBooking(
      { ok: false },
      bookingFormData({ 'cf-turnstile-response': 'tok' })
    );

    expect(state).toEqual({ ok: false, code: 'captcha_failed' });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('rejects with rate_limited BEFORE the siteverify spend when the window is exhausted', async () => {
    setServerEnv({
      TURNSTILE_SECRET_KEY: 'secret',
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    });
    mockFetch({ upstashCount: 5, turnstile: { success: true } });

    const state = await createBooking(
      { ok: false },
      bookingFormData({ 'cf-turnstile-response': 'tok' })
    );

    expect(state).toEqual({ ok: false, code: 'rate_limited', retryAfterSeconds: 60 });
    expect(mockRpc).not.toHaveBeenCalled();
    // The cheap layer short-circuits the expensive one.
    expect(sitesVerifyCalls()).toBe(0);
  });

  it('passes all layers and forwards the client IP to the RPC (p_client_ip no longer null)', async () => {
    setServerEnv({
      TURNSTILE_SECRET_KEY: 'secret',
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    });
    mockFetch({ upstashCount: 1, turnstile: { success: true } });
    mockRpc.mockResolvedValue({
      data: { ok: true, code: 'ok', booking_id: '22222222-2222-4222-8222-222222222222' },
      error: null,
    });

    const state = await createBooking(
      { ok: false },
      bookingFormData({ 'cf-turnstile-response': 'tok' })
    );

    expect(state).toEqual({ ok: true, bookingId: '22222222-2222-4222-8222-222222222222' });
    expect(mockRpc).toHaveBeenCalledTimes(1);
    const [name, args] = mockRpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(name).toBe('create_booking');
    expect(args.p_client_ip).toBe('203.0.113.7');
    expect(args.p_slot_start_minutes).toBe(600);
  });

  it('reuses the idempotency key submitted by the form instead of minting a fresh one', async () => {
    setServerEnv({ TURNSTILE_SECRET_KEY: 'secret' });
    mockFetch({ turnstile: { success: true } });
    mockRpc.mockResolvedValue({
      data: { ok: true, code: 'ok', booking_id: '22222222-2222-4222-8222-222222222222' },
      error: null,
    });

    await createBooking(
      { ok: false },
      bookingFormData({
        'cf-turnstile-response': 'tok',
        idempotencyKey: '33333333-3333-4333-8333-333333333333',
      })
    );

    const [, args] = mockRpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(args.p_idempotency_key).toBe('33333333-3333-4333-8333-333333333333');
  });

  it('still mints a UUID when the form does not send one (backwards compatible)', async () => {
    setServerEnv({ TURNSTILE_SECRET_KEY: 'secret' });
    mockFetch({ turnstile: { success: true } });
    mockRpc.mockResolvedValue({
      data: { ok: true, code: 'ok', booking_id: '22222222-2222-4222-8222-222222222222' },
      error: null,
    });

    await createBooking({ ok: false }, bookingFormData({ 'cf-turnstile-response': 'tok' }));

    const [, args] = mockRpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(args.p_idempotency_key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('rejects invalid input BEFORE any anti-bot or RPC spend', async () => {
    const state = await createBooking(
      { ok: false },
      bookingFormData({ slotStart: '99:99', 'cf-turnstile-response': 'tok' })
    );

    expect(state).toEqual({ ok: false, code: 'invalid' });
    expect(mockRpc).not.toHaveBeenCalled();
    expect(fetchCalls).toHaveLength(0);
  });

  it('maps RPC admission codes unchanged (duplicate regression)', async () => {
    setServerEnv({ TURNSTILE_SECRET_KEY: 'secret' });
    mockFetch({ turnstile: { success: true } });
    mockRpc.mockResolvedValue({
      data: { ok: false, code: 'duplicate', booking_id: null },
      error: null,
    });

    const state = await createBooking(
      { ok: false },
      bookingFormData({ 'cf-turnstile-response': 'tok' })
    );

    expect(state).toEqual({ ok: false, code: 'duplicate' });
  });

  it('reports unavailable when Supabase env is missing — after the anti-bot layers', async () => {
    // Even with a valid captcha, no backend means no booking: fail-soft with
    // the friendly message, never a crash.
    setServerEnv({ TURNSTILE_SECRET_KEY: 'secret' });
    mockFetch({ turnstile: { success: true } });
    const bookingClient = await import('@/lib/supabase/booking-client');
    vi.mocked(bookingClient.readBookingSupabaseEnv).mockReturnValue(null);

    const state = await createBooking(
      { ok: false },
      bookingFormData({ 'cf-turnstile-response': 'tok' })
    );

    expect(state).toEqual({ ok: false, code: 'unavailable' });
    expect(mockRpc).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Static contracts — form wiring + i18n + env consumption (a11y-p3 pattern)
// ---------------------------------------------------------------------------
const repoRoot = resolve(__dirname, '../../..');

function read(appPath: string): string {
  return readFileSync(resolve(repoRoot, appPath), 'utf8');
}

describe('booking-form wiring — Turnstile widget + stable idempotency key', () => {
  const src = () => read('apps/web/src/components/booking/booking-form.tsx');

  it('renders the Turnstile script + widget INSIDE the form element', () => {
    const s = src();
    expect(s).toMatch(/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/);
    expect(s).toMatch(/className="cf-turnstile"/);
    expect(s).toMatch(/data-sitekey/);
    // The widget is nested after the form opens, before the submit button.
    const formStart = s.indexOf('<form');
    const widgetAt = s.indexOf('cf-turnstile');
    const submitAt = s.indexOf('type="submit"');
    expect(formStart).toBeGreaterThan(-1);
    expect(widgetAt).toBeGreaterThan(formStart);
    expect(submitAt).toBeGreaterThan(widgetAt);
  });

  it('binds the site key from NEXT_PUBLIC_TURNSTILE_SITE_KEY', () => {
    expect(src()).toMatch(/data-sitekey=\{process\.env\.NEXT_PUBLIC_TURNSTILE_SITE_KEY\}/);
  });

  it('keeps a stable idempotency key for the form lifetime (useState + randomUUID)', () => {
    const s = src();
    expect(s).toMatch(/useState\(\(\) => crypto\.randomUUID\(\)\)/);
    expect(s).toMatch(/name="idempotencyKey"/);
  });

  it('maps the new error codes to i18n keys', () => {
    const s = src();
    expect(s).toMatch(/captcha_failed/);
    expect(s).toMatch(/rate_limited/);
  });
});

describe('i18n — both locales carry the new booking error keys', () => {
  it.each(['es', 'en'])('%s.json has captcha_failed + rate_limited', (locale) => {
    const messages = JSON.parse(read(`apps/web/messages/${locale}.json`)) as {
      booking?: { error?: Record<string, string> };
    };
    const errors = messages.booking?.error;
    expect(errors?.captcha_failed, `${locale} missing booking.error.captcha_failed`).toBeTruthy();
    expect(errors?.rate_limited, `${locale} missing booking.error.rate_limited`).toBeTruthy();
  });
});

describe('env consumption contract (KHAL-A8 cross-ref)', () => {
  it('TURNSTILE_SECRET_KEY stays optional in the env schema — optionality is paid at runtime, fail-closed', () => {
    const s = read('apps/web/src/config/env.ts');
    expect(s).toMatch(/TURNSTILE_SECRET_KEY: z\.string\(\)\.optional\(\)/);
  });

  it('the booking action consumes BOTH security modules before the RPC', () => {
    const s = read('apps/web/src/lib/actions/booking.ts');
    expect(s).toMatch(/verifyTurnstileToken/);
    expect(s).toMatch(/checkBookingRateLimit/);
    // The RPC call must come after the anti-bot layers — cheap grep ordering.
    const turnstileAt = s.indexOf('verifyTurnstileToken(');
    const rpcAt = s.indexOf("client.rpc('create_booking'");
    expect(turnstileAt).toBeGreaterThan(-1);
    expect(rpcAt).toBeGreaterThan(turnstileAt);
  });
});
