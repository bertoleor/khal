import type { Appointment } from "@khal/validations";
import { canTransitionAppointment } from "@khal/validations";

function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const seed: Appointment[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    clientName: "María",
    serviceName: "Lifting de Pestañas",
    date: todayIso(),
    time: "10:00",
    status: "pendiente",
    priceCents: 4500000,
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    clientName: "Juana",
    serviceName: "Esmaltado Semipermanente",
    date: todayIso(),
    time: "11:30",
    status: "confirmado",
    priceCents: 3800000,
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    clientName: "Carla",
    serviceName: "Diseño de Cejas",
    date: todayIso(),
    time: "14:00",
    status: "pendiente",
    priceCents: 2800000,
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    clientName: "Sofía",
    serviceName: "Spa de Uñas",
    date: todayIso(),
    time: "15:30",
    status: "no_asistio",
    priceCents: 5500000,
  },
];

// In-memory mock store (CQ-04). Replaced by the typed Supabase clients
// table + SECURITY DEFINER actions once linked. Mutations are ephemeral.
class AppointmentStore {
  constructor(private items: Appointment[] = seed) {}

  list(): Appointment[] {
    return [...this.items];
  }

  transition(id: string, to: Appointment["status"]): boolean {
    const target = this.items.find((appointment) => appointment.id === id);
    if (!target || !canTransitionAppointment(target.status, to)) {
      return false;
    }
    target.status = to;
    return true;
  }
}

export const appointmentsStore = new AppointmentStore();
