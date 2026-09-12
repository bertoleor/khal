import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server-only Supabase client (G1 P0 — UNVERIFIED until a project is linked).
 *
 * `@supabase/ssr` + `createServerClient` + the Next.js cookie store is the
 * canonical App Router pattern: it reads/writes the auth cookies per request so
 * the client carries the user's RLS context server-side. Never use the classic
 * `createClient` here — it drops the user context and returns an anon client.
 *
 * When env vars are missing (no project provisioned yet) this throws a typed
 * error that `auth.ts` catches and maps to the safe anon fallback, so the mock
 * path keeps working with zero config.
 */
type SupabaseEnv = {
  url: string;
  anonKey: string;
};

function readSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

/**
 * Builds a per-request server client. Throws if Supabase is not configured so
 * callers can fall back to the mock auth path explicitly.
 */
export async function getSupabaseServerClient() {
  const env = readSupabaseEnv();
  if (!env) {
    throw new Error('Supabase env not configured (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)');
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies from within certain lifetimes.
          // Ignoring is safe: the session will be re-fetched on the next request.
        }
      },
    },
  });
}