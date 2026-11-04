"use server";

import { requireAuth } from '@/lib/auth';
import { appointmentsStore } from '@/lib/mocks/appointments';
import { appointmentStatusSchema } from '@khal/validations';
import { revalidatePath } from 'next/cache';
import { withAuthTransition } from '@/shared/action-base';

export async function transitionAppointment(formData: FormData): Promise<{ error?: string }> {
  return await withAuthTransition(
    formData,
    appointmentsStore as unknown as Store<unknown>,
    'transition',
    '/admin',
    appointmentStatusSchema
  );
}
