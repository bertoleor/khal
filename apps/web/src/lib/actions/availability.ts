import { createBookingSupabaseClient, readBookingSupabaseEnv } from '@/lib/supabase/booking-client';
import { z } from 'zod';

// Server-side availability reads via the `get_availability` SECURITY DEFINER
// RPC (migration 0010) — the fully computed offerable slots, mirroring the
// create_booking (0003) admission logic so the reservar page can never offer
// a slot the booking RPC rejects (KHAL A2 / t_715635aa).
//
// NOT a 'use server' file: availabilitySchema is a value export and Next only
// allows async functions in 'use server' modules; callers are server
// components, which import plain server modules directly.
//
// Fail-soft mirrors catalog.ts/booking.ts: missing env -> closed day without
// building a client; RPC error, null data or schema-invalid payload -> closed
// day, never throws (local dev must render), no sensitive logging.

export const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  closed: z.boolean(),
  // HH:MM local start times — create_booking parses them into minutes.
  slots: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)),
});

export type AvailabilityDay = z.infer<typeof availabilitySchema>;

function closedDay(date: string): AvailabilityDay {
  return { date, closed: true, slots: [] };
}

export async function getAvailability(serviceId: string, date: string): Promise<AvailabilityDay> {
  const env = readBookingSupabaseEnv();
  if (!env) {
    return closedDay(date);
  }

  const client = createBookingSupabaseClient(env);
  const { data, error } = await client.rpc('get_availability', {
    p_service_id: serviceId,
    p_date: date,
  });

  if (error || !data) {
    return closedDay(date);
  }

  const parsed = availabilitySchema.safeParse(data);
  return parsed.success ? parsed.data : closedDay(date);
}
