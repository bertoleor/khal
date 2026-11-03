// NEW: Shared helper for service actions (khal-admin-100-operable T3)
import { requireAuth } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Service } from '@khal/validations';

const SERVICES_PATH = '/admin/servicios';

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
  return { ok: true, data: normalizeRow(data as DbService) };
}

/** Soft delete: sets deleted_at and is_visible=false */
export async function deleteService(id: string): Promise<{ ok: boolean; error?: string; data?: { id: string } }> {
  return await withServiceUpdate(async (supabase) => {
    const { error, data } = await supabase
      .from('services')
      .update({ deleted_at: new Date().toISOString(), is_visible: false })
      .eq('id', id)
      .select();
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
      .select();
    return { error, data };
  });
}
