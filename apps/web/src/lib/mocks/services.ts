import type { Service } from '@khal/validations';

// Provisional static data (CQ-04). Replaced by a Supabase typed query when the
// store is linked (slice 1b is unlinked until the project is provisioned).
export const mockServices: Service[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Lifting de Pestañas',
    description:
      'Curvado y lifting de pestañas naturales con fijador de larga duración. Venir sin rímel.',
    price_cents: 4500000,
    currency_code: 'ARS',
    duration_minutes: 60,
    buffer_minutes: 15,
    is_visible: true,
    sort_order: 1,
    deposit_mode: 'percentage',
    deposit_percentage_bp: 3000,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Extensiones Clásicas 1:1',
    description:
      'Una extensión por pestaña natural: efecto rimel natural de curvada limpia y duradera.',
    price_cents: 4000000,
    currency_code: 'ARS',
    duration_minutes: 90,
    buffer_minutes: 15,
    is_visible: true,
    sort_order: 2,
    deposit_mode: 'percentage',
    deposit_percentage_bp: 3000,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Extensiones Híbridas',
    description: 'Mix de clásicas y volumen: abanicos suaves para un efecto espeso y natural.',
    price_cents: 4800000,
    currency_code: 'ARS',
    duration_minutes: 120,
    buffer_minutes: 15,
    is_visible: true,
    sort_order: 3,
    deposit_mode: 'percentage',
    deposit_percentage_bp: 3000,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Volumen Ruso',
    description: 'Abanicos hechos a mano 3D-5D: máximo volumen con efecto delineado.',
    price_cents: 5500000,
    currency_code: 'ARS',
    duration_minutes: 150,
    buffer_minutes: 15,
    is_visible: true,
    sort_order: 4,
    deposit_mode: 'percentage',
    deposit_percentage_bp: 3000,
  },
];
