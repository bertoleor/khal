"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { servicesStore } from "@/lib/mocks/services";

export async function bulkIncrease(formData: FormData): Promise<{
  error?: string;
}> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const ids = formData.getAll("ids").map(String);
  servicesStore.bulkIncrease(ids, 1000);
  revalidatePath("/admin/servicios");
  return {};
}

export async function toggleVisibility(formData: FormData): Promise<{
  error?: string;
}> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("id") ?? "");
  servicesStore.toggleVisibility(id);
  revalidatePath("/admin/servicios");
  return {};
}
