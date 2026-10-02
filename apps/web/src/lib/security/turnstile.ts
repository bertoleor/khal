/**
 * [KHAL-A4 / t_28b371ff] Server-side Turnstile (CAPTCHA) verification.
 *
 * Fail-closed by contract: a missing secret, a missing token, a rejected
 * token, a transport failure or a malformed response all DENY. There is no
 * code path that admits a booking without a positive Cloudflare answer.
 *
 * Env contract (config/env.ts): TURNSTILE_SECRET_KEY is optional in the
 * schema on purpose — dev environments without it must not crash at import
 * time (the whole env schema parse would throw). The runtime cost of
 * optionality is paid HERE, as a denial: without a secret the public
 * createBooking action rejects every attempt with `captcha_failed`.
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY stays required (widget), closing KHAL-A8.
 */

export type TurnstileVerdict =
  { ok: true } | { ok: false; reason: 'not_configured' | 'missing_token' | 'rejected' | 'network' };

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Turnstile token against Cloudflare's siteverify endpoint.
 * `remoteip` is optional for Cloudflare but forwarded when known so
 * token-reuse from a different network is detectable server-side.
 */
export async function verifyTurnstileToken(
  secret: string | undefined,
  token: string | null | undefined,
  remoteIp?: string
): Promise<TurnstileVerdict> {
  if (!secret) {
    return { ok: false, reason: 'not_configured' };
  }
  if (!token) {
    return { ok: false, reason: 'missing_token' };
  }

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });

    if (!response.ok) {
      return { ok: false, reason: 'rejected' };
    }

    const data: unknown = await response.json().catch(() => null);
    if (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      (data as { success: unknown }).success === true
    ) {
      return { ok: true };
    }
    return { ok: false, reason: 'rejected' };
  } catch {
    // Fail-closed: transport failure denies. A booking is never admitted on a
    // "probably fine" answer.
    return { ok: false, reason: 'network' };
  }
}
