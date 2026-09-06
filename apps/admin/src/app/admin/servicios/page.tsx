import { ServiceList } from "@/components/admin/service-list";
import { servicesStore } from "@/lib/mocks/services";

export default function ServiciosPage() {
  const services = servicesStore.list();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Servicios
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Seleccioná servicios y aplicá el aumento por inflación.
      </p>
      <ServiceList services={services} />
    </main>
  );
}
