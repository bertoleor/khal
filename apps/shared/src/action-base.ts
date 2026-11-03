/** Shared action base for form transitions with auth validation.
 * Subclasses implement the store method and revalidation path.
 */
export async function withAuthTransition<
  TStoreMethod extends keyof any,
>(
  formData: FormData,
  store: any,
  storeMethod: TStoreMethod,
  revalidatePath: string,
  schema?: any
): Promise<{ error?: string }> {
  'use server';

  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get('id') ?? '');

  // Optional schema validation
  if (schema) {
    const toRaw = String(formData.get('to') ?? '');
    const statusParse = schema.safeParse(toRaw);
    if (!statusParse.success) {
      return { error: 'Invalid data' };
    }
    ;(store as any)[storeMethod](id, statusParse.data);
  } else {
    ;(store as any)[storeMethod](id);
  }

  revalidatePath(revalidatePath);
  return {};
}