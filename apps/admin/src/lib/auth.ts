import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

// Provisional auth (CQ-04). Swapped for Supabase JWT custom claims
// (auth.jwt() -> app_metadata.role, ADMIN-04/ARCH-05) once auth is provisioned.
export type Role = 'admin' | 'anon';

export type AuthContext = {
  role: Role;
  userId: string;
};

export type AuthResult = { ok: true; ctx: AuthContext } | { ok: false; error: string };

function extractRole(cookieStore: { get: (name: string) => { value: string } | undefined }): Role {
  return cookieStore.get('khal_role')?.value === 'admin' ? 'admin' : 'anon';
}

/**
 * Middleware variant — reads from NextRequest cookies (Edge runtime).
 */
export function getRole(request: NextRequest): Role {
  return extractRole(request.cookies);
}

/**
 * Server Action variant — reads via next/headers cookies().
 * Single swap point for future Supabase JWT.
 */
export async function requireAuth(): Promise<AuthResult> {
  const store = await cookies();
  const role = extractRole(store);

  if (role !== 'admin') {
    return { ok: false, error: 'Unauthorized: admin role required' };
  }

  return { ok: true, ctx: { role: 'admin', userId: 'mock-admin' } };
}
