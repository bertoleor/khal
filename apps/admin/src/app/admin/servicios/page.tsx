import { getTranslations } from "next-intl/server";
import { ServiceList } from "@/components/admin/service-list";
import { servicesStore } from "@/lib/mocks/services";

export default async function ServiciosPage() {
  const t = await getTranslations("Admin.services");
  const services = servicesStore.list();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{t("description")}</p>
      <ServiceList services={services} />
    </main>
  );
}
