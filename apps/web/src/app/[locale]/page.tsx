import { getTranslations } from "next-intl/server";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { Header } from "@/components/shared/header";
import { getCatalog } from "@/lib/actions/catalog";

export default async function HomePage() {
  const t = await getTranslations("catalog");
  const services = await getCatalog();

  return (
    <div className="min-h-dvh bg-white">
      <Header />
      <main className="mx-auto max-w-md px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {t("title")}
        </h1>
        <p className="mt-1 text-slate-500">{t("tagline")}</p>
        <CatalogGrid services={services} emptyMessage={t("empty")} />
      </main>
    </div>
  );
}
