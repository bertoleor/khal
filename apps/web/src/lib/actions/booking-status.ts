'use server';

import { createBookingSupabaseClient, readBookingSupabaseEnv } from '@/lib/supabase/booking-client';
import { z } from 'zod';

/**
 * T-F2.5 — the estado door (migration 0015): reads the public-safe status of
 * a booking by UUID (the capability token the clienta holds from confirm
 * time). Zero PII crosses this door by contract — the RPC returns status,
 * service name and the two timestamps only, and the result is narrowed with
 * Zod (CQ-06) before it reaches the page.
 */
const bookingStatusResultSchema = z.object({
  ok: z.boolean(),
  code: z.string(),
  status: z.enum(['pendiente', 'confirmado', 'cancelado', 'no_asistio']).nullable(),
  service_name: z.string().nullable(),
  scheduled_at: z.string().nullable(),
  hold_expires_at: z.string().nullable(),
});

export type BookingStatusValue = 'pendiente' | 'confirmado' | 'cancelado' | 'no_asistio';

export interface BookingStatus {
  ok: boolean;
  status?: BookingStatusValue;
  serviceName?: string;
  scheduledAt?: string;
  holdExpiresAt?: string;
}

export async function getBookingStatus(bookingId: string): Promise<BookingStatus> {
  // The capability IS the UUID — a malformed id never reaches the DB.
  const isUuid = z.string().uuid().safeParse(bookingId);
  if (!isUuid.success) {
    return { ok: false };
  }

  const env = readBookingSupabaseEnv();
  if (!env) {
    return { ok: false };
  }

  const client = createBookingSupabaseClient(env);
  const { data, error } = await client.rpc('get_booking_status', {
    p_booking_id: bookingId,
  });

  if (error || !data) {
    return { ok: false };
  }

  const parsed = bookingStatusResultSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false };
  }

  const result = parsed.data;
  if (!result.ok || result.status === null) {
    return { ok: false };
  }

  return {
    ok: true,
    status: result.status,
    serviceName: result.service_name ?? undefined,
    scheduledAt: result.scheduled_at ?? undefined,
    holdExpiresAt: result.hold_expires_at ?? undefined,
  };
}
