import { ExceptionsList } from "@/components/admin/exceptions-list";
import { exceptionsStore } from "@/lib/mocks/exceptions";

export default function BloqueosPage() {
  const exceptions = exceptionsStore.list();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Bloqueos de agenda
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Feriados, vacaciones o cierres que se restan de la disponibilidad.
      </p>
      <ExceptionsList exceptions={exceptions} />
    </main>
  );
}
