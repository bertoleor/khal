import { depositModeSchema } from '@khal/validations';
import { z } from 'zod';

/**
 * Catalog form schema (khal-admin-100-operable T2).
 *
 * Shared by the client form (inline validation) and the server actions
 * (authoritative gate before Supabase). Mirrors the DB contract from
 * migration 0001: integer cents (MONEY-01), duration_minutes/buffer_minutes
 * (SCH-02), and the deposit CHECK (fixed -> deposit_fixed_cents,
 * percentage -> deposit_percentage_bp).
 */
export const serviceFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Poné un nombre para el servicio').max(120),
    description: z.string().max(5000).nullable().optional(),
    price_cents: z
      .number({ error: 'El precio tiene que ser un número' })
      .int('El precio va en centavos enteros')
      .nonnegative('El precio no puede ser negativo'),
    currency_code: z.string().length(3).default('ARS'),
    duration_minutes: z
      .number({ error: 'La duración tiene que ser un número' })
      .int('La duración va en minutos enteros')
      .min(15, 'Mínimo 15 minutos')
      .max(480, 'Máximo 480 minutos'),
    buffer_minutes: z
      .number({ error: 'El margen tiene que ser un número' })
      .int('El margen va en minutos enteros')
      .min(0, 'El margen no puede ser negativo')
      .max(120, 'Máximo 120 minutos'),
    is_visible: z.boolean(),
    sort_order: z.number().int().min(0),
    photo_path: z.string().max(2048).nullable().optional(),
    deposit_mode: depositModeSchema.nullable().optional(),
    deposit_fixed_cents: z.number().int().nonnegative().nullable().optional(),
    deposit_percentage_bp: z.number().int().min(0).max(10000).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    // Mirrors the CHECK constraint on public.services (0001): the deposit
    // fields are required exactly when the mode selects them.
    if (v.deposit_mode === 'fixed' && !(v.deposit_fixed_cents ?? 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['deposit_fixed_cents'],
        message: 'Falta el monto fijo de la seña',
      });
    }
    if (v.deposit_mode === 'percentage' && !(v.deposit_percentage_bp ?? 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['deposit_percentage_bp'],
        message: 'Falta el porcentaje de la seña',
      });
    }
  });

export type ServiceFormInput = z.input<typeof serviceFormSchema>;
