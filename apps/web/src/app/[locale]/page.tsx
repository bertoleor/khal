import BackgroundMesh from '@/components/BackgroundMesh';
import { CatalogGrid } from '@/components/catalog/catalog-grid';
import { Header } from '@/components/shared/header';
import { getCatalog } from '@/lib/actions/catalog';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('catalog');
  const services = await getCatalog();

  return (
    <div className="relative min-h-dvh">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <BackgroundMesh />
      </div>
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-lg px-4 pb-16 pt-10 sm:pt-16">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-zinc-400">{t('tagline')}</p>
        <CatalogGrid services={services} emptyMessage={t('empty')} />
      </main>
    </div>
  );
}
