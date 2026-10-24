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
  // D1 — the clienta must accept the studio terms at the review step
  // (literal true: unchecked or missing rejects the submit server-side).
  termsAccepted: z.literal(true),
});

export type BookingInput = z.infer<typeof bookingInputSchema>;

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
