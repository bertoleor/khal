"use server";

import { bookingInputSchema } from "@khal/validations";

export interface BookingState {
  ok: boolean;
  code?: "invalid" | "duplicate" | "blacklisted";
  bookingId?: string;
}

// In-memory mock pending store (CQ-04). Replaced by the SECURITY DEFINER
// `create_booking` RPC — FOR UPDATE + overlap probe + idempotency + blacklist
// (CONCURRENCIA-01 L2) — once Supabase is linked. Demonstrates the 1-pending-
// per-phone and blacklist admission rules at the app layer.
const heldBookings = new Map<string, { phone: string }>();
const blacklistedPhones = new Set<string>(["+5491100000000"]);

export async function createBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const raw = {
    serviceId: formData.get("serviceId"),
    date: formData.get("date"),
    slotStart: formData.get("slotStart"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  };

  const parsed = bookingInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "invalid" };
  }

  const { phone } = parsed.data;

  if (blacklistedPhones.has(phone)) {
    return { ok: false, code: "blacklisted" };
  }
  if (heldBookings.has(phone)) {
    return { ok: false, code: "duplicate" };
  }

  const bookingId = crypto.randomUUID();
  heldBookings.set(phone, { phone });
  return { ok: true, bookingId };
}