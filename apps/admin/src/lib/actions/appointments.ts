"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { appointmentStatusSchema } from "@khal/validations";
import { appointmentsStore } from "@/lib/mocks/appointments";

export async function transitionAppointment(formData: FormData): Promise<{
  error?: string;
}> {
  const auth = await requireAuth();
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("id") ?? "");
  const toRaw = String(formData.get("to") ?? "");

  const statusParse = appointmentStatusSchema.safeParse(toRaw);
  if (!statusParse.success) {
    return { error: "Invalid appointment status" };
  }

  appointmentsStore.transition(id, statusParse.data);
  revalidatePath("/admin");
  return {};
}
