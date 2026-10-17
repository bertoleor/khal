import { CatalogGrid } from '@/components/catalog/catalog-grid';
import { Header } from '@/components/shared/header';
import SiteFooter from '@/components/shared/site-footer';
import { getCatalog } from '@/lib/actions/catalog';
import { getTranslations } from 'next-intl/server';

type HomePageProps = {
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { skeleton } = await searchParams;
  const t = await getTranslations('catalog');

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <div className="relative min-h-dvh">
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-lg px-4 pb-16 pt-10 sm:max-w-6xl sm:px-6 sm:pt-16"
        >
          <section className="grid grid-cols-1 items-center gap-6 sm:grid-cols-12">
            <div className="space-y-3 sm:col-span-8">
              <h1 className="skeleton-shimmer h-10 w-2/3 rounded bg-zinc-800 sm:h-12 lg:h-14"></h1>
              <p className="skeleton-shimmer h-5 w-1/2 rounded bg-zinc-800/60 sm:h-6"></p>
            </div>
            <div className="hidden justify-end sm:col-span-4 sm:flex">
              <div className="skeleton-shimmer h-28 w-28 rounded-2xl bg-zinc-800 lg:h-36 lg:w-36"></div>
            </div>
          </section>
          <section className="mt-10 sm:mt-12">
            <h2 className="skeleton-shimmer mb-4 h-3 w-32 rounded bg-zinc-800/60"></h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {[0, 1, 2, 3].map((cardIndex) => (
                <div
                  key={cardIndex}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
                >
                  <div className="skeleton-shimmer h-14 w-14 shrink-0 rounded-full bg-zinc-800"></div>
                  <div className="min-w-0 flex-1">
                    <div className="skeleton-shimmer h-5 w-2/3 rounded bg-zinc-800"></div>
                    <div className="skeleton-shimmer mt-2 h-4 w-1/3 rounded bg-zinc-800/60"></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const services = await getCatalog();

  return (
    <div className="relative min-h-dvh">
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-lg px-4 pb-16 pt-10 sm:max-w-6xl sm:px-6 sm:pt-16"
      >
        {/* Hero */}
        <section className="grid grid-cols-1 items-center gap-6 sm:grid-cols-12 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.03] sm:p-6 lg:p-8">
          <div className="space-y-3 sm:col-span-8">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t('title')}
            </h1>
            <p className="text-zinc-400 sm:max-w-md sm:text-lg">{t('tagline')}</p>
          </div>
          <div className="hidden justify-end sm:col-span-4 sm:flex">
            <div
              aria-hidden="true"
              className="flex h-28 w-28 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] lg:h-36 lg:w-36"
            >
              <svg
                className="h-12 w-12 text-zinc-600 lg:h-16 lg:w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* Catalog */}
        <section className="mt-10 sm:mt-12">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Servicios & Turnos
          </h2>
          <CatalogGrid services={services} emptyMessage={t('empty')} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
