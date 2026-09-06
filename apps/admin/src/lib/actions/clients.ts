"use server";

import { revalidatePath } from "next/cache";
import { clientsStore } from "@/lib/mocks/clients";

export async function toggleBlacklisted(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  clientsStore.toggleBlacklisted(id);
  revalidatePath("/admin/clientes");
}
