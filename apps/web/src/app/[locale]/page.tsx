import { CatalogList } from '@/components/catalog/catalog-list';
import { FlowGradientHero } from '@/components/home/flow-gradient-hero';
import { Header } from '@/components/shared/header';
import SiteFooter from '@/components/shared/site-footer';
import { getCatalog } from '@/lib/actions/catalog';
import { getPaymentSettings } from '@/lib/actions/settings';
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
              <h1
                aria-hidden="true"
                className="skeleton-shimmer h-10 w-2/3 rounded bg-zinc-800 sm:h-12 lg:h-14"
              ></h1>
              <p className="skeleton-shimmer h-5 w-1/2 rounded bg-zinc-800/60 sm:h-6"></p>
            </div>
            <div className="hidden justify-end sm:col-span-4 sm:flex">
              <div className="skeleton-shimmer h-28 w-28 rounded-2xl bg-zinc-800 lg:h-36 lg:w-36"></div>
            </div>
          </section>
          <section className="mt-10 sm:mt-12">
            <h2
              aria-hidden="true"
              className="skeleton-shimmer mb-4 h-3 w-32 rounded bg-zinc-800/60"
            ></h2>
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
  const settings = await getPaymentSettings();

  return (
    <div className="relative min-h-dvh">
      {/* v2 (D10/D12): la portada ES el hero interactivo aprobado — el
          catálogo vive debajo en el mismo flujo vertical (sin navbar). */}
      <FlowGradientHero />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-lg px-4 pb-16 pt-14 sm:max-w-6xl sm:px-6"
      >
        {/* Catalog — el ancla del CTA del hero (#servicios). Filas, no cards
            (board s1); la primera fila es el servicio firma. */}
        <section id="servicios" className="scroll-mt-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-faint">
            {t('title')}
          </h2>
          <CatalogList
            services={services}
            emptyMessage={t('empty')}
            emptyCtaLabel={t('emptyCta')}
            whatsappPhone={settings?.whatsappPhone ?? ''}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
