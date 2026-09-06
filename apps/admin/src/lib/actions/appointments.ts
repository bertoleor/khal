"use server";

import { revalidatePath } from "next/cache";
import type { AppointmentStatus } from "@khal/validations";
import { appointmentsStore } from "@/lib/mocks/appointments";

export async function transitionAppointment(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "") as AppointmentStatus;
  appointmentsStore.transition(id, to);
  revalidatePath("/admin");
}
