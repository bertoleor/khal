'use server';

import { requireAuth } from '@/lib/auth';
import { serviceFormSchema, type ServiceFormInput } from '@/lib/schemas';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Service } from '@khal/validations';
import { revalidatePath } from 'next/cache';

/**
 * Catalog server actions (khal-admin-100-operable T2).
 *
 * Speaks the REAL 0001 schema: duration_minutes/buffer_minutes, integer
 * cents, organization_id from the session's `app_metadata.org_id` claim,
 * SOFT delete (deleted_at — appointments.service_id has no ON DELETE
 * CASCADE), and zod validation on every mutation BEFORE Supabase.
 * Mutations return { ok, data } | { ok: false, error } so the client form
 * never has to parse a thrown RSC boundary error.
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const SERVICES_PATH = '/admin/servicios';
const PHOTO_BUCKET = 'service-photos';
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const IMAGE_MIME_RE = /^image\/(png|jpe?g|webp|avif|gif)$/i;

type DbService = Service & { deleted_at: string | null };

/** null -> undefined for optional text columns so rows satisfy the Service type. */
function normalizeRow(row: DbService): Service {
  return {
    ...row,
    description: row.description ?? undefined,
    photo_path: row.photo_path ?? undefined,
  };
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Datos inválidos';
}

export async function fetchServices(): Promise<Service[]> {
  const auth = await requireAuth();
  if (!auth.ok) throw new Error(auth.error ?? 'Unauthenticated');

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return ((data as DbService[]) ?? []).map(normalizeRow);
}

export async function createService(input: ServiceFormInput): Promise<ActionResult<Service>> {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!auth.ctx.orgId) return { ok: false, error: 'La sesión no tiene organización asignada' };

  const parsed = serviceFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('services')
    .insert({ ...parsed.data, organization_id: auth.ctx.orgId })
    .select()
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear el servicio' };

  revalidatePath(SERVICES_PATH);
  return { ok: true, data: normalizeRow(data as DbService) };
}

export async function updateService(
  id: string,
  input: ServiceFormInput
): Promise<ActionResult<Service>> {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = serviceFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  // organization_id is deliberately NOT updatable from the form.
  const { organization_id: _ignored, ...row } = parsed.data as Record<string, unknown>;
  void _ignored;

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('services')
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data)
    return { ok: false, error: error?.message ?? 'No se pudo guardar el servicio' };

  revalidatePath(SERVICES_PATH);
  return { ok: true, data: normalizeRow(data as DbService) };
}

export async function deleteService(id: string): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await getSupabaseServerClient();
  // SOFT delete: appointments.service_id has no ON DELETE CASCADE.
  const { data, error } = await supabase
    .from('services')
    .update({ deleted_at: new Date().toISOString(), is_visible: false })
    .eq('id', id)
    .select()
    .single();

  if (error || !data)
    return { ok: false, error: error?.message ?? 'No se pudo eliminar el servicio' };

  revalidatePath(SERVICES_PATH);
  return { ok: true, data: { id } };
}

export async function toggleVisibility(id: string, next: boolean): Promise<ActionResult<Service>> {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await getSupabaseServerClient();
  // Single update with the desired state — no read-then-flip race.
  const { data, error } = await supabase
    .from('services')
    .update({ is_visible: next, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data)
    return { ok: false, error: error?.message ?? 'No se pudo actualizar el servicio' };

  revalidatePath(SERVICES_PATH);
  return { ok: true, data: normalizeRow(data as DbService) };
}

export async function uploadServicePhoto(file: File): Promise<ActionResult<{ url: string }>> {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!file || !IMAGE_MIME_RE.test(file.type ?? '')) {
    return { ok: false, error: 'Solo se pueden subir imágenes (png, jpg, webp, avif o gif)' };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: 'La foto pesa más de 4MB' };
  }

  const supabase = await getSupabaseServerClient();
  const ext = IMAGE_MIME_RE.exec(file.type)?.[1] ?? 'png';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) return { ok: false, error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(filename);

  revalidatePath(SERVICES_PATH);
  return { ok: true, data: { url: publicUrl } };
}

export async function bulkIncrease(
  ids: string[],
  percentageBp = 1000
): Promise<ActionResult<{ count: number }>> {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (ids.length === 0) return { ok: false, error: 'No hay servicios seleccionados' };
  if (percentageBp <= 0 || percentageBp > 5000) {
    return { ok: false, error: 'El aumento tiene que estar entre 0% y 50%' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: rows, error: fetchError } = await supabase
    .from('services')
    .select('id, price_cents')
    .in('id', ids);

  if (fetchError) return { ok: false, error: fetchError.message };

  const updates = ((rows as { id: string; price_cents: number }[]) ?? []).map((s) => ({
    id: s.id,
    price_cents: s.price_cents + Math.round((s.price_cents * percentageBp) / 10000),
    updated_at: new Date().toISOString(),
  }));

  if (updates.length === 0) return { ok: false, error: 'No se encontraron los servicios' };

  const { error: updateError } = await supabase
    .from('services')
    .upsert(updates, { onConflict: 'id' });

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath(SERVICES_PATH);
  return { ok: true, data: { count: updates.length } };
}
