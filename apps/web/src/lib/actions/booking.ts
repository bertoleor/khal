'use server';

import { createBookingSupabaseClient, readBookingSupabaseEnv } from '@/lib/supabase/booking-client';
import { bookingInputSchema, serializeBookingAddons, type BookingAddonId } from '@khal/validations';
import { z } from 'zod';

export interface BookingState {
  ok: boolean;
  code?: 'invalid' | 'duplicate' | 'blacklisted' | 'conflict' | 'unavailable';
  bookingId?: string;
}

// Contract returned by the SECURITY DEFINER create_booking RPC (0003). Narrowed
// with Zod (CQ-06 — no `any`, no `as unknown as`) since database.types.ts is
// generated only once Supabase is linked (DB-SYNC-01 / supabase-migration.md §8).
const createBookingResultSchema = z.object({
  ok: z.boolean(),
  code: z.string(),
  booking_id: z.uuid().nullable(),
});

type CreateBookingResult = z.infer<typeof createBookingResultSchema>;

const RPC_CODE_TO_STATE: Record<string, BookingState['code']> = {
  ok: 'invalid',
  invalid: 'invalid',
  blacklisted: 'blacklisted',
  duplicate: 'duplicate',
  conflict: 'conflict',
  unavailable: 'unavailable',
};

function slotStartToMinutes(slotStart: string): number | null {
  const parts = slotStart.split(':');
  if (parts.length !== 2) {
    return null;
  }
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

/**
 * S6 — the "¿Sumás algo más?" selection arrives as a JSON array of curated
 * addon IDs (["kit_higiene"] | []). Absent = none (pre-0016 callers and the
 * e2e happy path stay valid); anything malformed fails closed: the submit
 * is rejected as invalid rather than silently dropping a selection.
 */
function parseAddonIds(raw: FormDataEntryValue | null): BookingAddonId[] | null {
  if (raw === null) {
    return [];
  }
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) {
    return null;
  }
  return parsed as BookingAddonId[];
}

export async function createBooking(
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  const addons = parseAddonIds(formData.get('addons'));
  // Fail-close (S6): a malformed selection never falls back to "none" —
  // the submit is rejected instead of silently dropping what she picked.
  if (addons === null) {
    return { ok: false, code: 'invalid' };
  }
  const raw = {
    serviceId: formData.get('serviceId'),
    date: formData.get('date'),
    slotStart: formData.get('slotStart'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    // D3 — checkbox "¿venís con trabajo de otro lugar?": 'on' -> true.
    externalWork: formData.get('externalWork') === 'on',
    // S6 — curated add-on selection; prices are resolved server-side by
    // serializeBookingAddons (the form only ever posts IDs).
    addons,
    // D1 — terms checkbox: the submit is rejected server-side without it.
    termsAccepted: formData.get('termsAccepted') === 'on',
  };

  const parsed = bookingInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: 'invalid' };
  }

  const input = parsed.data;

  const env = readBookingSupabaseEnv();
  if (!env) {
    // No in-memory mock: without Supabase there is no booking backend, so the
    // slot is reported as unavailable (friendly i18n key error.unavailable).
    return { ok: false, code: 'unavailable' };
  }

  const slotMinutes = slotStartToMinutes(input.slotStart);
  if (slotMinutes === null) {
    return { ok: false, code: 'invalid' };
  }

  // Idempotency key is generated client-side per submission; a user retry after
  // a network error must resend the SAME key to replay, not a fresh one. The
  // current form submits once per render, so a fresh UUID per call keeps the
  // duplicate-pending guard (RPC step 7) as the multi-submit defence until the
  // form carries a stable key across renders.
  const idempotencyKey = crypto.randomUUID();

  const client = createBookingSupabaseClient(env);
  const { data, error } = await client.rpc('create_booking', {
    p_service_id: input.serviceId,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email,
    p_date: input.date,
    p_slot_start_minutes: slotMinutes,
    p_idempotency_key: idempotencyKey,
    p_client_ip: null,
    p_external_work: input.externalWork,
    p_addons: serializeBookingAddons(input.addons),
  });

  if (error) {
    // Transport / PostgREST failure (network, 5xx, timeout): the slot state is
    // unknown, so report unavailable — the friendly retry message — instead of
    // invalid. RPC admission codes (conflict/duplicate/unavailable/blacklisted)
    // arrive in `data`, not here.
    return { ok: false, code: 'unavailable' };
  }

  const result = createBookingResultSchema.safeParse(data);
  if (!result.success) {
    return { ok: false, code: 'invalid' };
  }

  const rpcResult: CreateBookingResult = result.data;
  if (rpcResult.ok && rpcResult.booking_id !== null) {
    return { ok: true, bookingId: rpcResult.booking_id };
  }

  return { ok: false, code: RPC_CODE_TO_STATE[rpcResult.code] ?? 'invalid' };
}
