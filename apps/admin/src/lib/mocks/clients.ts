import type { Client } from "@khal/validations";

const seed: Client[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "María",
    phone: "+5491100000001",
    tags: ["VIP"],
    noShowCount: 0,
    isBlacklisted: false,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Juana",
    phone: "+5491100000002",
    tags: ["Frecuente"],
    noShowCount: 1,
    isBlacklisted: false,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Carla",
    phone: "+5491100000003",
    tags: ["Nueva"],
    noShowCount: 0,
    isBlacklisted: false,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Sofía",
    phone: "+5491100000004",
    tags: ["No Asistió"],
    noShowCount: 3,
    isBlacklisted: true,
  },
];

// In-memory mock store (CQ-04). Replaced by the typed Supabase `clients`
// table once linked. LTV is computed from appointments, never stored (ADMIN-06).
class ClientStore {
  constructor(private items: Client[] = seed) {}

  list(): Client[] {
    return [...this.items];
  }

  toggleBlacklisted(id: string): boolean {
    const target = this.items.find((client) => client.id === id);
    if (!target) {
      return false;
    }
    target.isBlacklisted = !target.isBlacklisted;
    return true;
  }
}

export const clientsStore = new ClientStore();
