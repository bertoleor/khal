import { CatalogGrid } from '@/components/catalog/catalog-grid';
import { Header } from '@/components/shared/header';
import SiteFooter from '@/components/shared/site-footer';
import { Link } from '@/i18n/navigation';
import { getCatalog } from '@/lib/actions/catalog';
import { getPaymentSettings } from '@/lib/actions/settings';
import { getTranslations } from 'next-intl/server';

/**
 * Catálogo v7 (S3 — approved preview): its own screen now, reached from the
 * home linktree. Photos only — a 2-column grid of 4/5 cards with the name
 * chip; the price lives in the service detail, one tap away. The back door
 * is the typographic kicker, part of the text flow (no pill, no box).
 */
type CatalogoPageProps = {
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const { skeleton } = await searchParams;
  const t = await getTranslations('catalog');

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <div className="relative flex min-h-dvh flex-col">
        <Header />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-lg flex-1 px-5 pb-16">
          <div
            aria-hidden="true"
            className="skeleton-shimmer mt-3 h-2 w-16 rounded bg-zinc-800/60"
          ></div>
          <div
            aria-hidden="true"
            className="skeleton-shimmer mt-3 h-5 w-32 rounded bg-zinc-800"
          ></div>
          <div className="mt-3 grid grid-cols-2 gap-[9px]">
            {[0, 1, 2, 3].map((cardIndex) => (
              <div
                key={cardIndex}
                aria-hidden="true"
                className="skeleton-shimmer aspect-[4/5] rounded-md bg-zinc-800"
              ></div>
            ))}
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const services = await getCatalog();
  const settings = await getPaymentSettings();

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-lg flex-1 px-5 pb-16">
        <Link
          href="/"
          className="mt-3 inline-block font-mono-khal text-[8px] uppercase tracking-[2.5px] text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ← {t('back')}
        </Link>
        <h1 className="mt-3 text-[18px] font-bold tracking-[-0.02em] text-foreground">
          {t('title')}
        </h1>
        <div className="mt-3">
          <CatalogGrid
            services={services}
            emptyMessage={t('empty')}
            emptyCtaLabel={t('emptyCta')}
            whatsappPhone={settings?.whatsappPhone ?? ''}
            photoFallbackLabel={t('photoFallback')}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
