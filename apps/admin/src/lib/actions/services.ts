"use server";

import { revalidatePath } from "next/cache";
import { servicesStore } from "@/lib/mocks/services";

export async function bulkIncrease(formData: FormData): Promise<void> {
  const ids = formData.getAll("ids").map(String);
  servicesStore.bulkIncrease(ids, 1000);
  revalidatePath("/admin/servicios");
}

export async function toggleVisibility(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  servicesStore.toggleVisibility(id);
  revalidatePath("/admin/servicios");
}
