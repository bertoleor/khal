import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';

/**
 * Auth layer (G1 P0 — ORN-79: mock removed, Supabase JWT is the only path).
 *
 * Reads the authenticated session's JWT and resolves the caller's role from
 * the server-issued custom claim `app_metadata.role` (never `user_metadata`,
 * which is user-editable and unsafe for authorization). The old client-
 * settable `khal_role` cookie mock (CQ-04) is gone: no cookie grants any
 * role, anywhere.
 *
 * Fail-closed: any error (env misconfig, network, invalid session) denies.
 * A previous version degraded to the mock cookie on error — that turned an
 * infra outage into an open admin door, and is exactly what ORN-144 closed.
 */
export type Role = 'admin' | 'manager' | 'anon';

type AuthContext = {
  role: Role;
  userId: string;
  /** Org from the JWT `app_metadata.org_id` claim — undefined when absent. */
  orgId?: string;
};

export type AuthResult = { ok: true; ctx: AuthContext } | { ok: false; error: string };

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
 * Edge middleware cannot verify the JWT without the signing key, so it never
 * grants a role here: any request is 'anon' at the edge and the real role
 * resolution happens in the server action path (`requireAuth`) where the
 * `@supabase/ssr` client verifies the session via `auth.getUser()`.
 * A bare `khal_role` cookie is inert — it is no longer read at all.
 */
export function getRole(_request: NextRequest): Role {
  return 'anon';
}

/**
 * Server Action variant — verifies the session via `@supabase/ssr` and reads
 * the JWT `app_metadata.role` claim. Fail-closed on any error.
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

    const orgClaim = appMetadata?.org_id;
    const orgId = typeof orgClaim === 'string' && orgClaim.length > 0 ? orgClaim : undefined;

    return { ok: true, ctx: { role, userId: data.user.id, orgId } };
  } catch {
    // Fail-closed: env misconfig or network error never authenticates.
    return { ok: false, error: 'Unauthorized: auth backend unavailable' };
  }
}
