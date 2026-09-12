import { createClient } from '@supabase/supabase-js';

export type BookingSupabaseEnv = {
  url: string;
  anonKey: string;
};

/**
 * Server-side environment for the anonymous booking flow (G4 P0 — UNVERIFIED
 * until a Supabase project is linked).
 *
 * Guest booking does not carry a user session: the `create_booking` RPC is a
 * SECURITY DEFINER function granted to `anon`, so the classic anon client is the
 * correct one here — not the `@supabase/ssr` cookie-carrying client used for
 * authenticated admin work.
 *
 * Returns null (never throws) when Supabase is not configured so the booking
 * action can report the slot as unavailable without breaking local dev.
 */
export function readBookingSupabaseEnv(): BookingSupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

export function createBookingSupabaseClient(env: BookingSupabaseEnv) {
  return createClient(env.url, env.anonKey);
}