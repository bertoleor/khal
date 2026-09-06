import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .min(6, "Invalid phone")
  .max(24, "Invalid phone")
  .regex(/^\+?[0-9\s-]+$/, "Invalid phone format");

export const emailSchema = z.string().trim().email().max(320);

export const depositModeSchema = z.enum(["full", "fixed", "percentage"]);

export const serviceSchema = z.object({
  id: z.string().uuid(),
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
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  email: emailSchema,
});

export type BookingInput = z.infer<typeof bookingInputSchema>;

export const appointmentStatusSchema = z.enum([
  "pendiente",
  "confirmado",
  "cancelado",
  "no_asistio",
]);

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

// ECOM-03 — strict state machine; no arbitrary jumps.
export const VALID_APPOINTMENT_TRANSITIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  pendiente: ["confirmado", "cancelado", "no_asistio"],
  confirmado: ["cancelado", "no_asistio"],
  cancelado: [],
  no_asistio: [],
};

export function canTransitionAppointment(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  return VALID_APPOINTMENT_TRANSITIONS[from].includes(to);
}

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  clientName: z.string().min(1),
  serviceName: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  status: appointmentStatusSchema,
  priceCents: z.number().int().nonnegative(),
});

export type Appointment = z.infer<typeof appointmentSchema>;

export const clientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().min(6),
  tags: z.array(z.string()),
  noShowCount: z.number().int().nonnegative(),
  isBlacklisted: z.boolean(),
});

export type Client = z.infer<typeof clientSchema>;
