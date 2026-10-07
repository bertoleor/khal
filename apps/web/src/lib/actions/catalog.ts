'use server';

import { createBookingSupabaseClient, readBookingSupabaseEnv } from '@/lib/supabase/booking-client';
import { serviceSchema, type Service } from '@khal/validations';

// Server-only catalog reads, straight from the `services` table (ORN-80). The
// anon RLS select policy services_anon_select (migration 0001:
// `using (is_visible and deleted_at is null)`) is the read surface, so the
// query filters on is_visible and orders by sort_order — PostgREST does the
// work; no in-memory mock fallback remains.
//
// Fail-soft mirrors booking.ts: when Supabase env is missing (local dev) the
// catalog reports empty / the service null, never throws — a storefront with
// no backend shows an empty catalog instead of crashing the render.
//
// Rows are validated with serviceSchema.safeParse and invalid rows are
// skipped defensively: bad DB data must never 500 the catalog page. SQL
// NULLs arrive as null and are dropped from the object before parsing (zod
// .optional() rejects null); unknown keys (organization_id, timestamps,
// deleted_at) are stripped by the zod object default.
const NULLABLE_TO_OPTIONAL_KEYS = [
  'description',
  'photo_path',
  'deposit_mode',
  'deposit_fixed_cents',
  'deposit_percentage_bp',
] as const;

function parseRow(row: Record<string, unknown>): Service | null {
  const normalized: Record<string, unknown> = { ...row };
  for (const key of NULLABLE_TO_OPTIONAL_KEYS) {
    if (normalized[key] === null) {
      delete normalized[key];
    }
  }
  const parsed = serviceSchema.safeParse(normalized);
  return parsed.success ? parsed.data : null;
}

export async function getCatalog(): Promise<Service[]> {
  const env = readBookingSupabaseEnv();
  if (!env) {
    return [];
  }

  const client = createBookingSupabaseClient(env);
  const { data, error } = await client
    .from('services')
    .select()
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    return [];
  }

  const services: Service[] = [];
  for (const row of data) {
    const service = parseRow(row as Record<string, unknown>);
    if (service) {
      services.push(service);
    }
  }
  return services;
}

export async function getService(id: string): Promise<Service | null> {
  const env = readBookingSupabaseEnv();
  if (!env) {
    return null;
  }

  const client = createBookingSupabaseClient(env);
  const { data, error } = await client
    .from('services')
    .select()
    .eq('id', id)
    .eq('is_visible', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parseRow(data as Record<string, unknown>);
}
