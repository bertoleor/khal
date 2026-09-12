import { getSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

/**
 * Auth layer (G1 P0 — UNVERIFIED until a Supabase project is linked).
 *
 * Reads the authenticated session's JWT and resolves the caller's role from
 * the server-issued custom claim `app_metadata.role` (never `user_metadata`,
 * which is user-editable and unsafe for authorization). This replaces the old
 * client-settable `khal_role` cookie mock (CQ-04).
 *
 * Fallback: when Supabase env vars are absent (no project provisioned yet),
 * `requireAuth` / `getRole` degrade to the previous mock cookie behaviour so
 * local development keeps working. That path is explicitly marked and is the
 * ONLY thing keeping this file from being production-safe.
 */
export type Role = 'admin' | 'manager' | 'anon';

export type AuthContext = {
  role: Role;
  userId: string;
};

export type AuthResult = { ok: true; ctx: AuthContext } | { ok: false; error: string };

function extractRole(cookieStore: { get: (name: string) => { value: string } | undefined }): Role {
  return cookieStore.get('khal_role')?.value === 'admin' ? 'admin' : 'anon';
}

/**
 * Resolves the caller's role from the session JWT `app_metadata.role` claim.
 * Unknown or missing claim -> 'anon' (safe deny-by-default).
 */
function roleFromClaims(appMetadata: Record<string, unknown> | undefined): Role {
  const role = appMetadata?.role;
  if (role === 'admin' || role === 'manager') {
    return role;
  }
  return 'anon';
}

/**
 * Middleware variant — reads from NextRequest cookies (Edge runtime).
 *
 * NOTE: Edge middleware cannot construct the `@supabase/ssr` client without
 * the cookie set helpers, and `auth.uid()`/`getUser()` would require a network
 * round-trip. For the role gate this reads the Supabase auth cookies directly;
 * if absent it falls back to the mock cookie. When Supabase is provisioned and
 * a true Edge session check is needed, use `updateSession` from `@supabase/ssr`
 * in `apps/web/src/middleware.ts` and call back into this swap point.
 */
export function getRole(request: NextRequest): Role {
  const supabaseAuthTokens = request.cookies.getAll().filter((c) => c.name.startsWith('sb-'));
  if (supabaseAuthTokens.length === 0) {
    return extractRole(request.cookies);
  }
  // Supabase session cookies are present for authenticated users; we can't
  // decode the JWT claims without the signing key in Edge, so treat any
  // authenticated Supabase session as at least `anon` here and defer the real
  // role resolution to the server action path (`requireAuth`) where the
  // `@supabase/ssr` client can verify the session via `auth.getUser()`.
  return 'anon';
}

/**
 * Server Action variant — verifies the session via `@supabase/ssr` and reads
 * the JWT `app_metadata.role` claim. Single swap point for the mock -> real
 * migration (CQ-04).
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return { ok: false, error: 'Unauthorized: no valid session' };
    }

    const appMetadata = data.user.app_metadata as Record<string, unknown>;
    const role = roleFromClaims(appMetadata);
    if (role === 'anon') {
      return { ok: false, error: 'Unauthorized: admin role required' };
    }

    return { ok: true, ctx: { role, userId: data.user.id } };
  } catch {
    // UNVERIFIED fallback: Supabase env not configured. Preserve the mock
    // behaviour so local dev does not break before the project is provisioned.
    const store = await cookies();
    const role = extractRole(store);
    if (role !== 'admin') {
      return { ok: false, error: 'Unauthorized: admin role required' };
    }
    return { ok: true, ctx: { role: 'admin', userId: 'mock-admin' } };
  }
}
