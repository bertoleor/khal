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

/**
 * Drops the SQL NULLs of the five nullable columns, by name (explicit
 * per-key statements — no dynamic key access). Returns a fresh object so
 * the caller's row is never mutated.
 */
function dropSqlNulls(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...row };
  if (normalized.description === null) delete normalized.description;
  if (normalized.photo_path === null) delete normalized.photo_path;
  if (normalized.deposit_mode === null) delete normalized.deposit_mode;
  if (normalized.deposit_fixed_cents === null) delete normalized.deposit_fixed_cents;
  if (normalized.deposit_percentage_bp === null) delete normalized.deposit_percentage_bp;
  return normalized;
}

function parseRow(row: Record<string, unknown>): Service | null {
  const parsed = serviceSchema.safeParse(dropSqlNulls(row));
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
