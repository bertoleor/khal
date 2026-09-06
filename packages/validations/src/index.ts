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
