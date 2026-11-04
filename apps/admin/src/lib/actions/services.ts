"use server";

// Shared helper for service actions (khal-admin-100-operable T3)
import { requireAuth } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { depositModeSchema } from '@khal/validations';
import type { Service } from '@khal/validations';

// Full schema for create (with refinements)
const serviceFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Poné un nombre para el servicio').max(120),
    description: z.string().max(5000).optional(),
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
    photo_path: z.string().max(2048).optional(),
    deposit_mode: depositModeSchema.optional(),
    deposit_fixed_cents: z.number().int().nonnegative().optional(),
    deposit_percentage_bp: z.number().int().min(0).max(10000).optional(),
  })
  .superRefine((v, ctx) => {
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

// Partial schema for updates (no refinements - they require full object)
const serviceUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Poné un nombre para el servicio').max(120).optional(),
  description: z.string().max(5000).optional(),
  price_cents: z
    .number({ error: 'El precio tiene que ser un número' })
    .int('El precio va en centavos enteros')
    .nonnegative('El precio no puede ser negativo')
    .optional(),
  currency_code: z.string().length(3).optional(),
  duration_minutes: z
    .number({ error: 'La duración tiene que ser un número' })
    .int('La duración va en minutos enteros')
    .min(15, 'Mínimo 15 minutos')
    .max(480, 'Máximo 480 minutos')
    .optional(),
  buffer_minutes: z
    .number({ error: 'El margen tiene que ser un número' })
    .int('El margen va en minutos enteros')
    .min(0, 'El margen no puede ser negativo')
    .max(120, 'Máximo 120 minutos')
    .optional(),
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  photo_path: z.string().max(2048).optional(),
  deposit_mode: depositModeSchema.optional(),
  deposit_fixed_cents: z.number().int().nonnegative().optional(),
  deposit_percentage_bp: z.number().int().min(0).max(10000).optional(),
});

const SERVICES_PATH = '/admin/servicios';

/** Convert nullable optionals to undefined for Zod validation */
function sanitizeInput(input: Record<string, any>): Record<string, any> {
  const sanitized = { ...input };
  for (const key of Object.keys(sanitized)) {
    if (sanitized[key] === null) {
      sanitized[key] = undefined;
    }
  }
  return sanitized;
}

/** Normalize DB row to Service type */
function normalizeRow(row: any): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    price_cents: row.price_cents,
    currency_code: row.currency_code ?? 'ARS',
    duration_minutes: row.duration_minutes,
    buffer_minutes: row.buffer_minutes ?? 0,
    is_visible: row.is_visible,
    sort_order: row.sort_order,
    photo_path: row.photo_path ?? undefined,
    deposit_mode: row.deposit_mode ?? undefined,
    deposit_fixed_cents: row.deposit_fixed_cents ?? undefined,
    deposit_percentage_bp: row.deposit_percentage_bp ?? undefined,
  };
}

/** Create a new service */
export async function createService(input: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<{ ok: boolean; error?: string; data?: Service }> {
  // Sanitize null -> undefined for Zod validation
  const sanitizedInput = sanitizeInput({ ...input });
  // Validate input BEFORE touching Supabase (zod gate)
  const parsed = serviceFormSchema.safeParse(sanitizedInput);
  if (!parsed.success) {
    return { ok: false, error: 'Datos inválidos' };
  }

  const authResult = await requireAuth();
  if (!authResult.ok) return { ok: false, error: authResult.error };
  if (!authResult.ctx.orgId) return { ok: false, error: 'No organization in session' };

  const supabase = await getSupabaseServerClient();
  const insertResult = await supabase
    .from('services')
    .insert({
      ...parsed.data,
      organization_id: authResult.ctx.orgId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    })
    .select()
    .single();
  const { error, data } = insertResult;

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo crear el servicio' };
  }

  revalidatePath(SERVICES_PATH);
  return { ok: true, data: normalizeRow(data) };
}

/** Update an existing service */
export async function updateService(id: string, input: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<{ ok: boolean; error?: string; data?: Service }> {
  // Sanitize null -> undefined for Zod validation
  const sanitizedInput = sanitizeInput({ ...input });
  // Validate input BEFORE touching Supabase (zod gate) - partial validation without refinements
  const parsed = serviceUpdateSchema.safeParse(sanitizedInput);
  if (!parsed.success) {
    return { ok: false, error: 'Datos inválidos' };
  }

  // Additional refinement checks for deposit fields
  if (parsed.data.deposit_mode === 'fixed' && !(parsed.data.deposit_fixed_cents ?? 0)) {
    return { ok: false, error: 'Falta el monto fijo de la seña' };
  }
  if (parsed.data.deposit_mode === 'percentage' && !(parsed.data.deposit_percentage_bp ?? 0)) {
    return { ok: false, error: 'Falta el porcentaje de la seña' };
  }

  const authResult = await requireAuth();
  if (!authResult.ok) return { ok: false, error: authResult.error };

  const supabase = await getSupabaseServerClient();
  const updateResult = await supabase
    .from('services')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', authResult.ctx.orgId)
    .select()
    .single();
  const { error, data } = updateResult;

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo actualizar el servicio' };
  }

  revalidatePath(SERVICES_PATH);
  return { ok: true, data: normalizeRow(data) };
}

/** Soft delete: sets deleted_at and is_visible=false */
export async function deleteService(id: string): Promise<{ ok: boolean; error?: string; data?: { id: string } }> {
  const authResult = await requireAuth();
  if (!authResult.ok) return { ok: false, error: authResult.error };

  const supabase = await getSupabaseServerClient();
  const { error, data } = await supabase
    .from('services')
    .update({ deleted_at: new Date().toISOString(), is_visible: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', authResult.ctx.orgId)
    .select()
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo eliminar el servicio' };
  }

  revalidatePath(SERVICES_PATH);
  return { ok: true, data: { id: data.id } };
}

/** Toggle visibility: sets is_visible to the desired state */
export async function toggleVisibility(id: string, next: boolean): Promise<{ ok: boolean; error?: string; data?: Service }> {
  const authResult = await requireAuth();
  if (!authResult.ok) return { ok: false, error: authResult.error };

  const supabase = await getSupabaseServerClient();
  const { error, data } = await supabase
    .from('services')
    .update({ is_visible: next, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', authResult.ctx.orgId)
    .select()
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo cambiar la visibilidad' };
  }

  revalidatePath(SERVICES_PATH);
  return { ok: true, data: normalizeRow(data) };
}

/** Bulk increase prices by percentage (bp = basis points, 1000 = 10%) */
export async function bulkIncrease(ids: string[], percentageBp: number): Promise<{ ok: boolean; error?: string }> {
  const authResult = await requireAuth();
  if (!authResult.ok) return { ok: false, error: authResult.error };

  const supabase = await getSupabaseServerClient();

  // Fetch current prices first
  const { data: services, error: fetchError } = await supabase
    .from('services')
    .select('id, price_cents')
    .in('id', ids)
    .eq('organization_id', authResult.ctx.orgId);

  if (fetchError || !services) {
    return { ok: false, error: fetchError?.message ?? 'No se pudieron obtener los servicios' };
  }

  // Build upsert payload
  const upsertPayload = services.map((s) => ({
    id: s.id,
    price_cents: s.price_cents + Math.round((s.price_cents * percentageBp) / 10000),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('services')
    .upsert(upsertPayload)
    .eq('organization_id', authResult.ctx.orgId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(SERVICES_PATH);
  return { ok: true };
}

/** Upload service photo - accepts File or FormData */
export async function uploadServicePhoto(fileOrFormData: File | FormData): Promise<{ ok: boolean; error?: string; data?: { url: string } }> {
  const authResult = await requireAuth();
  if (!authResult.ok) return { ok: false, error: authResult.error };

  // Handle both File and FormData
  let file: File;
  if (fileOrFormData instanceof FormData) {
    file = fileOrFormData.get('file') as File;
  } else {
    file = fileOrFormData;
  }

  if (!file) return { ok: false, error: 'No file provided' };

  // Validate MIME type (gate before upload)
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Solo se permiten imágenes' };
  }

  // Validate file size (gate before upload) - max 4MB
  const MAX_SIZE = 4 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { ok: false, error: 'El archivo no puede superar 4 MB' };
  }

  const supabase = await getSupabaseServerClient();
  const fileName = `${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('service-photos')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }
  const { data: urlData } = supabase.storage
    .from('service-photos')
    .getPublicUrl(fileName);
  return { ok: true, data: { url: urlData.publicUrl } };
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
    .eq('organization_id', authResult.ctx.orgId)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data.map(normalizeRow);
}