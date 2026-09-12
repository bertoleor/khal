'use server';

import { requireAuth } from '@/lib/auth';
import { appointmentsStore } from '@/lib/mocks/appointments';
import { appointmentStatusSchema } from '@khal/validations';
import { revalidatePath } from 'next/cache';

export async function transitionAppointment(formData: FormData): Promise<{
  error?: string;
}> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get('id') ?? '');
  const toRaw = String(formData.get('to') ?? '');

  const statusParse = appointmentStatusSchema.safeParse(toRaw);
  if (!statusParse.success) {
    return { error: 'Invalid appointment status' };
  }

  appointmentsStore.transition(id, statusParse.data);
  revalidatePath('/admin');
  return {};
}
