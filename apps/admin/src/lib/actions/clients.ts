"use server";

import { requireAuth } from '@/lib/auth';
import { clientsStore } from '@/lib/stores/clients';
import { revalidatePath } from 'next/cache';
import { withAuthTransition } from '@/shared/action-base';
import type { Store } from '@/shared/action-base';

export async function toggleBlacklisted(formData: FormData): Promise<{ error?: string }> {
  return await withAuthTransition(
    formData,
    clientsStore as unknown as Store<unknown>,
    'toggleBlacklisted',
    '/admin/clientes'
  );
}
