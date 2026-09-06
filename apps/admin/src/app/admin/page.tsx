import { AppointmentList } from "@/components/admin/appointment-list";
import { appointmentsStore } from "@/lib/mocks/appointments";

export default function AdminPage() {
  const appointments = appointmentsStore.list();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Agenda de hoy
      </h1>
      <AppointmentList appointments={appointments} />
    </main>
  );
}
