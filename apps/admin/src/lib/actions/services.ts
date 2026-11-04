"use server";

// NEW: Shared helper for service actions (khal-admin-100-operable T3)
import { requireAuth } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Service } from '@khal/validations';

const SERVICES_PATH = '/admin/servicios';

/** Normalize DB row to Service type */
function normalizeRow(row: any): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    price_cents: row.price_cents,
    currency_code: row.currency_code ?? 'ARS',
    duration_minutes: row.duration_minutes,
    buffer_minutes: row.buffer_minutes ?? 0,
    is_visible: row.is_visible,
    sort_order: row.sort_order,
    photo_path: row.photo_path ?? null,
    deposit_mode: row.deposit_mode ?? null,
    deposit_fixed_cents: row.deposit_fixed_cents ?? null,
    deposit_percentage_bp: row.deposit_percentage_bp ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}

/** Shared pattern for service CRUD operations */
async function withServiceUpdate(
  updateFn: (supabase: any) => Promise<{ error: Error | null; data: any }>
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return { ok: false, error: authResult.error };

  const supabase = await getSupabaseServerClient();
  const { error, data } = await updateFn(supabase);
  if (error || !data) {
    const msg = error?.message ?? 'No se pudo completar la operación';
    return { ok: false, error: msg };
  }

  revalidatePath(SERVICES_PATH);
  return { ok: true, data: normalizeRow(data) };
}

/** Fetch all services for admin */
export async function fetchServices(): Promise<Service[]> {
  const authResult = await requireAuth();
  if (!authResult.ok) return [];

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data.map(normalizeRow);
}

/** Convert nullable optionals to undefined for Supabase */
function sanitizeInput(input: Record<string, any>): Record<string, any> {
  const sanitized = { ...input };
  for (const key of Object.keys(sanitized)) {
    if (sanitized[key] === null) {
      sanitized[key] = undefined;
    }
  }
  return sanitized;
}

/** Create a new service */
export async function createService(input: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<{ ok: boolean; error?: string; data?: Service }> {
  return await withServiceUpdate(async (supabase) => {
    const { error, data } = await supabase
      .from('services')
      .insert(sanitizeInput({
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
      .select()
      .single();
    return { error, data };
  });
}

/** Update an existing service */
export async function updateService(id: string, input: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<{ ok: boolean; error?: string; data?: Service }> {
  return await withServiceUpdate(async (supabase) => {
    const { error, data } = await supabase
      .from('services')
      .update(sanitizeInput({ ...input, updated_at: new Date().toISOString() }))
      .eq('id', id)
      .select()
      .single();
    return { error, data };
  });
}

/** Soft delete: sets deleted_at and is_visible=false */
export async function deleteService(id: string): Promise<{ ok: boolean; error?: string; data?: { id: string } }> {
  return await withServiceUpdate(async (supabase) => {
    const { error, data } = await supabase
      .from('services')
      .update({ deleted_at: new Date().toISOString(), is_visible: false })
      .eq('id', id)
      .select()
      .single();
    return { error, data };
  });
}

/** Toggle visibility: sets is_visible to the desired state */
export async function toggleVisibility(id: string, next: boolean): Promise<{ ok: boolean; error?: string; data?: Service }> {
  return await withServiceUpdate(async (supabase) => {
    const { error, data } = await supabase
      .from('services')
      .update({ is_visible: next, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { error, data };
  });
}

/** Bulk increase prices by percentage (bp = basis points, 1000 = 10%) */
export async function bulkIncrease(ids: string[], percentageBp: number): Promise<{ ok: boolean; error?: string }> {
  const authResult = await requireAuth();
  if (!authResult.ok) return { ok: false, error: authResult.error };

  const supabase = await getSupabaseServerClient();
  for (const id of ids) {
    const { data: service } = await supabase
      .from('services')
      .select('price_cents')
      .eq('id', id)
      .single();
    if (service) {
      const newPrice = service.price_cents + Math.round((service.price_cents * percentageBp) / 10000);
      const { error } = await supabase
        .from('services')
        .update({ price_cents: newPrice, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) return { ok: false, error: error.message };
    }
  }
  revalidatePath(SERVICES_PATH);
  return { ok: true };
}

/** Upload service photo */
export async function uploadServicePhoto(formData: FormData): Promise<{ ok: boolean; error?: string; data?: { url: string } }> {
  const authResult = await requireAuth();
  if (!authResult.ok) return { ok: false, error: authResult.error };

  const file = formData.get('file') as File;
  if (!file) return { ok: false, error: 'No file provided' };

  // Implementation would upload to Supabase Storage
  // For now, return placeholder
  return { ok: true, data: { url: '/placeholder.jpg' } };
}
