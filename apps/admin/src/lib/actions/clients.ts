'use server';

import { requireAuth } from '@/lib/auth';
import { clientsStore } from '@/lib/mocks/clients';
import { revalidatePath } from 'next/cache';

export async function toggleBlacklisted(formData: FormData): Promise<{
  error?: string;
}> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get('id') ?? '');
  clientsStore.toggleBlacklisted(id);
  revalidatePath('/admin/clientes');
  return {};
}
