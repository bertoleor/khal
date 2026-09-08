"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { calendarExceptionInputSchema } from "@khal/validations";
import { exceptionsStore } from "@/lib/mocks/exceptions";

export async function addException(formData: FormData): Promise<{
  error?: string;
}> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  const parsed = calendarExceptionInputSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    date: formData.get("date"),
    startTime: startTime === "" ? undefined : startTime,
    endTime: endTime === "" ? undefined : endTime,
  });

  if (!parsed.success) {
    return { error: "Invalid exception data" };
  }

  exceptionsStore.add(parsed.data);
  revalidatePath("/admin/bloqueos");
  return {};
}
