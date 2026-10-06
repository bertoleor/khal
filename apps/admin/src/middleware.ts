import type { NextRequest } from 'next/server';

/**
 * [ORN-79] Edge auth gate.
 *
 * Edge middleware cannot verify the Supabase JWT or resolve roles (no signing
 * key, no network verify path), so it can no longer grant access based on a
 * client-settable cookie. The previous `getRole === 'admin'` check trusted a
 * request cookie the client controlled, which is exactly what ORN-79 closes.
 *
 * What remains at the edge is a light shell check: requests without any
 * Supabase auth cookies are redirected to /login before hitting the server
 * components. The real authorization happens server-side in every admin
 * server action via `requireAuth()` (verified JWT `app_metadata.role`).
 *
 * NOTE: a client can still present cookie names without valid tokens; those
 * requests pass the edge but fail closed in `requireAuth()`.
 */

const SB_COOKIE_PREFIXES = ['sb-', 'supabase-auth'];

function hasSupabaseSessionCookies(request: NextRequest): boolean {
  const names = request.cookies.getAll().map((c) => c.name);
  return names.some((name) => SB_COOKIE_PREFIXES.some((p) => name.startsWith(p)));
}

export function middleware(request: NextRequest) {
  if (!hasSupabaseSessionCookies(request)) {
    const url = new URL('/login', request.url);
    return Response.redirect(url, 302);
  }
  return new Response(null, { status: 200, headers: { 'x-middleware-next': '1' } });
}

export const config = {
  matcher: ['/admin/:path*'],
};
