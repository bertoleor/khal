import { increaseCentsByBp } from '@khal/utils';
import type { Service } from '@khal/validations';

const seed: Service[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Lifting de Pestañas',
    price_cents: 4500000,
    currency_code: 'ARS',
    duration_minutes: 60,
    buffer_minutes: 15,
    is_visible: true,
    sort_order: 1,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Esmaltado Semipermanente',
    price_cents: 3800000,
    currency_code: 'ARS',
    duration_minutes: 75,
    buffer_minutes: 15,
    is_visible: true,
    sort_order: 2,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Diseño de Cejas',
    price_cents: 2800000,
    currency_code: 'ARS',
    duration_minutes: 45,
    buffer_minutes: 10,
    is_visible: true,
    sort_order: 3,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Spa de Uñas Completo',
    price_cents: 5500000,
    currency_code: 'ARS',
    duration_minutes: 90,
    buffer_minutes: 15,
    is_visible: false,
    sort_order: 4,
  },
];

// In-memory mock store (CQ-04). Replaced by the typed Supabase `services`
// table once linked. Bulk mutations use integer half-up arithmetic (MONEY-01).
class ServiceStore {
  constructor(private items: Service[] = seed) {}

  list(): Service[] {
    return [...this.items];
  }

  toggleVisibility(id: string): boolean {
    const target = this.items.find((service) => service.id === id);
    if (!target) {
      return false;
    }
    target.is_visible = !target.is_visible;
    return true;
  }

  bulkIncrease(ids: string[], bp: number): number {
    let changed = 0;
    for (const service of this.items) {
      if (ids.includes(service.id)) {
        service.price_cents += increaseCentsByBp(service.price_cents, bp);
        changed += 1;
      }
    }
    return changed;
  }
}

export const servicesStore = new ServiceStore();
