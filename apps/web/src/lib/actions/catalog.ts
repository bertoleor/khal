import type { Service } from "@khal/validations";
import { mockServices } from "@/lib/mocks/services";

// Server-only catalog reads. Currently sourced from mocks (CQ-04); swapped for
// typed Supabase queries (is_visible filter + sort_order) once linked.
export async function getCatalog(): Promise<Service[]> {
  return mockServices
    .filter((service) => service.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getService(id: string): Promise<Service | null> {
  const service = mockServices.find((candidate) => candidate.id === id);
  return service && service.is_visible ? service : null;
}
