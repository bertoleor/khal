"use server";

import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

export type Store<T> = {
  list: () => T[];
  get: (id: string) => T | undefined;
  create: (data: Omit<T, 'id'>) => T;
  update: (id: string, data: Partial<T>) => T;
  delete: (id: string) => void;
  [key: string]: any;
};

type ActionFn<T> = (
  store: T,
  ...args: any[]
) => Promise<{ error?: string; data?: any }>;

export async function withAuthTransition<T, TData>(
  formData: FormData,
  store: Store<T>,
  actionName: string,
  revalidatePathName: string,
  schema?: z.ZodSchema<TData>
): Promise<{ error?: string }> {
  const authResult = await requireAuth();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  // Extract data from formData
  const rawData: Record<string, any> = {};
  formData.forEach((value, key) => {
    rawData[key] = value;
  });

  // Validate if schema provided
  let validatedData: TData = rawData as TData;
  if (schema) {
    const parsed = schema.safeParse(rawData);
    if (!parsed.success) {
      return { error: 'Datos inválidos' };
    }
    validatedData = parsed.data;
  }

  try {
    // Call the store method
    const method = store[actionName];
    if (typeof method !== 'function') {
      return { error: 'Acción no soportada' };
    }

    const result = await method(validatedData);
    
    if (result.error) {
      return { error: result.error };
    }

    revalidatePath(revalidatePathName);
    return {};
  } catch (error) {
    return { error: 'Error interno del servidor' };
  }
}
