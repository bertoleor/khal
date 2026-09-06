import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("common");

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-slate-500">{t("tagline")}</p>
    </main>
  );
}