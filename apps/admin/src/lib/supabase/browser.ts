import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client (khal-admin-100-operable T3).
 *
 * Used only by the login form (OTP/password sign-in). `createBrowserClient`
 * from @supabase/ssr is the canonical App Router pattern: it stores the
 * session in cookies the middleware and server actions can read, so a
 * successful sign-in makes `/admin/*` pass the edge shell check AND gives
 * server actions the RLS-scoped session context.
 *
 * createBrowserClient is a singleton per (url, key) pair — safe to call in
 * event handlers.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase env not configured (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)');
  }
  return createBrowserClient(url, anonKey);
}
