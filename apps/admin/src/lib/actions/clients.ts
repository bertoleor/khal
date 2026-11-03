"use server";

import { requireAuth } from '@/lib/auth';
import { clientsStore } from '@/lib/mocks/clients';
import { revalidatePath } from 'next/cache';
import { withAuthTransition } from '@/shared/action-base';

export async function toggleBlacklisted(formData: FormData): Promise<{ error?: string }> {
  return await withAuthTransition(
    formData,
    clientsStore,
    'toggleBlacklisted',
    '/admin/clientes'
  );
}
