import type { Service } from "@khal/validations";

// Provisional static data (CQ-04). Replaced by a Supabase typed query when the
// store is linked (slice 1b is unlinked until the project is provisioned).
export const mockServices: Service[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Lifting de Pestañas",
    description:
      "Curvado y lifting de pestañas naturales con fijador de larga duración. Venir sin rímel.",
    price_cents: 4500000,
    currency_code: "ARS",
    duration_minutes: 60,
    buffer_minutes: 15,
    is_visible: true,
    sort_order: 1,
    deposit_mode: "percentage",
    deposit_percentage_bp: 3000,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Esmaltado Semipermanente",
    description: "Manicura semipermanente con tres semanas de duración.",
    price_cents: 3800000,
    currency_code: "ARS",
    duration_minutes: 75,
    buffer_minutes: 15,
    is_visible: true,
    sort_order: 2,
    deposit_mode: "fixed",
    deposit_fixed_cents: 1500000,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Diseño de Cejas",
    description: "Perfilado y diseño de cejas a medida de tu rostro.",
    price_cents: 2800000,
    currency_code: "ARS",
    duration_minutes: 45,
    buffer_minutes: 10,
    is_visible: true,
    sort_order: 3,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Spa de Uñas Completo",
    description: "Tratamiento completo: exfoliación, hidratación y esmaltado.",
    price_cents: 5500000,
    currency_code: "ARS",
    duration_minutes: 90,
    buffer_minutes: 15,
    is_visible: false,
    sort_order: 4,
  },
];
