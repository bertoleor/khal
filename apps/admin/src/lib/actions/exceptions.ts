"use server";

import { revalidatePath } from "next/cache";
import { calendarExceptionInputSchema } from "@khal/validations";
import { exceptionsStore } from "@/lib/mocks/exceptions";

export async function addException(formData: FormData): Promise<void> {
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
    return;
  }

  exceptionsStore.add(parsed.data);
  revalidatePath("/admin/bloqueos");
}
