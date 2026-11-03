import { z } from 'zod';

export const phoneSchema = z
  .string()
  .trim()
  .min(6, 'Invalid phone')
  .max(24, 'Invalid phone')
  .regex(/^\+?[0-9\s-]+$/, 'Invalid phone format');

// zod 4: z.email() runs the format check BEFORE chained transforms, so the
// trim-first zod 3 order (.trim().email()) is preserved with a pipe — a
// pasted " maria@example.com " still trims before validating.
export const emailSchema = z.string().trim().max(320).pipe(z.email());

export const depositModeSchema = z.enum(['full', 'fixed', 'percentage']);

// S6 — curated booking add-ons (odd/tasks/v7-clienta-bw-glass.md): the
// reservar flow's "¿Sumás algo más?" module is a FIXED curated list, not a
// cart — Perfilado de cejas (+$18.000) and Kit de higiene (+$5.000, precio
// con servicio). Prices live HERE, server-side: the clienta only ever posts
// IDs, so a tampered form can never invent a price (MONEY-01 cents).
export const bookingAddonIdSchema = z.enum(['perfilado_cejas', 'kit_higiene']);

export type BookingAddonId = z.infer<typeof bookingAddonIdSchema>;

export interface BookingAddon {
  id: BookingAddonId;
  priceCents: number;
}

export const BOOKING_ADDON_CATALOG: readonly BookingAddon[] = [
  { id: 'perfilado_cejas', priceCents: 1_800_000 },
  { id: 'kit_higiene', priceCents: 500_000 },
];

export function bookingAddonPriceCents(id: BookingAddonId): number {
  const addon = BOOKING_ADDON_CATALOG.find((entry) => entry.id === id);
  if (!addon) {
    throw new Error(`Unknown booking add-on: ${id}`);
  }
  return addon.priceCents;
}

export const serviceSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price_cents: z.number().int().nonnegative(),
  currency_code: z.string().length(3),
  duration_minutes: z.number().int().positive(),
  buffer_minutes: z.number().int().nonnegative(),
  is_visible: z.boolean(),
  sort_order: z.number().int(),
  photo_path: z.string().optional(),
  deposit_mode: depositModeSchema.optional(),
  deposit_fixed_cents: z.number().int().nonnegative().optional(),
  deposit_percentage_bp: z.number().int().min(0).max(10000).optional(),
});

export type Service = z.infer<typeof serviceSchema>;

export const bookingInputSchema = z.object({
  serviceId: z.uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  email: emailSchema,
  // D3 — "¿venís con trabajo de otro lugar?": absent = false, so the v1 form
  // and the e2e happy path keep validating unchanged.
  externalWork: z.boolean().default(false),
  // S6 — "¿Sumás algo más?": the curated add-on selection. IDs only — prices
  // are resolved server-side from BOOKING_ADDON_CATALOG, never from the form.
  // Absent = no add-ons, so every pre-0016 caller keeps validating unchanged.
  addons: z.array(bookingAddonIdSchema).max(2).default([]),
  // D1 — the clienta must accept the studio terms at the review step
  // (literal true: unchecked or missing rejects the submit server-side).
  termsAccepted: z.literal(true),
});

export type BookingInput = z.infer<typeof bookingInputSchema>;

// The shape persisted in appointments.addons (migration 0016): the price is
// frozen at booking time so a later catalog change never rewrites history.
const storedAddonSchema = z.object({
  id: bookingAddonIdSchema,
  price_cents: z.number().int().nonnegative(),
});

/** RPC payload for create_booking's p_addons — null when nothing was added. */
export function serializeBookingAddons(ids: readonly BookingAddonId[]): string | null {
  if (ids.length === 0) {
    return null;
  }
  return JSON.stringify(ids.map((id) => ({ id, price_cents: bookingAddonPriceCents(id) })));
}

/** Narrowed read of the stored add-ons (CQ-06: unknown in, IDs out). */
export function parseStoredBookingAddons(raw: unknown): BookingAddonId[] {
  const parsed = z.array(storedAddonSchema).safeParse(raw);
  return parsed.success ? parsed.data.map((addon) => addon.id) : [];
}

export const appointmentStatusSchema = z.enum([
  'pendiente',
  'confirmado',
  'cancelado',
  'no_asistio',
]);

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

// ECOM-03 — strict state machine; no arbitrary jumps. The table below stays
// the single source of truth; `canTransitionAppointment` reads it through an
// exhaustive, compile-checked switch (named property access per status — no
// dynamic key indexing).
export const VALID_APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pendiente: ['confirmado', 'cancelado', 'no_asistio'],
  confirmado: ['cancelado', 'no_asistio'],
  cancelado: [],
  no_asistio: [],
};

export function canTransitionAppointment(from: AppointmentStatus, to: AppointmentStatus): boolean {
  switch (from) {
    case 'pendiente':
      return VALID_APPOINTMENT_TRANSITIONS.pendiente.includes(to);
    case 'confirmado':
      return VALID_APPOINTMENT_TRANSITIONS.confirmado.includes(to);
    case 'cancelado':
      return VALID_APPOINTMENT_TRANSITIONS.cancelado.includes(to);
    case 'no_asistio':
      return VALID_APPOINTMENT_TRANSITIONS.no_asistio.includes(to);
  }
}

export const appointmentSchema = z.object({
  id: z.uuid(),
  clientName: z.string().min(1),
  serviceName: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  status: appointmentStatusSchema,
  priceCents: z.number().int().nonnegative(),
});

export type Appointment = z.infer<typeof appointmentSchema>;

export const clientSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  phone: z.string().min(6),
  tags: z.array(z.string()),
  noShowCount: z.number().int().nonnegative(),
  isBlacklisted: z.boolean(),
});

export type Client = z.infer<typeof clientSchema>;

export const exceptionTypeSchema = z.enum(['holiday', 'vacation', 'event', 'block']);

export type ExceptionType = z.infer<typeof exceptionTypeSchema>;

export const calendarExceptionSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  type: exceptionTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
});

export type CalendarException = z.infer<typeof calendarExceptionSchema>;

export const calendarExceptionInputSchema = calendarExceptionSchema.omit({
  id: true,
});
