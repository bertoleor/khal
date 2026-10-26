import { Header } from '@/components/shared/header';
import SiteFooter from '@/components/shared/site-footer';
import { Link } from '@/i18n/navigation';
import { getPaymentSettings } from '@/lib/actions/settings';
import { whatsappUrl } from '@/lib/socials';
import { getTranslations } from 'next-intl/server';

/**
 * Home v7 (S2 — approved preview): a personal linktree, not a storefront.
 * Wordmark "Khal" (TAN Nightingale) + tagline + ONLY four doors: Agendá tu
 * turno (solid pill), Catálogo, Conocenos, WhatsApp ↗. Prices do NOT live
 * here (S2) — the funnel starts at the catálogo. Delicacy scale (S12):
 * buttons 11px/17px padding, 13px text, 9px stack gap, real pills; arrows
 * are their own span with air (pl-4, 11px, 45% ink) — never glued to the
 * text. Desktop puts wordmark and doors side by side (preview v7 §2).
 */
type HomePageProps = {
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { skeleton } = await searchParams;
  const t = await getTranslations('home');
  const settings = await getPaymentSettings();
  const whatsappPhone = settings?.whatsappPhone ?? '';

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <div className="relative flex min-h-dvh flex-col">
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-16 sm:max-w-6xl sm:px-6"
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-8 sm:flex-row sm:gap-9">
            <div className="text-center">
              <div
                aria-hidden="true"
                className="skeleton-shimmer mx-auto h-[46px] w-32 rounded bg-zinc-800"
              ></div>
              <div
                aria-hidden="true"
                className="skeleton-shimmer mx-auto mt-3 h-2 w-40 rounded bg-zinc-800/60"
              ></div>
            </div>
            <div className="flex w-full flex-col gap-[9px] sm:max-w-[360px]">
              {[0, 1, 2, 3].map((buttonIndex) => (
                <div
                  key={buttonIndex}
                  aria-hidden="true"
                  className="skeleton-shimmer h-10 w-full rounded-full bg-zinc-800"
                ></div>
              ))}
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Glass door (S12): token surface + hairline + blur + inset highlight.
  const doorClass =
    'flex items-center rounded-full border border-hairline bg-surface px-[17px] py-[11px] text-[13px] font-semibold tracking-[-0.005em] text-foreground backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)] transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.985]';
  // The prime door is the only solid pill (S2): accent ink, contrast text.
  const primeClass =
    'flex items-center rounded-full bg-accent px-[17px] py-[11px] text-[13px] font-semibold tracking-[-0.005em] text-accent-contrast transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.985]';
  // Arrows breathe on their own (S12): own span, 11px, 45% ink, pl-4 air.
  const arrowClass = 'ml-auto pl-4 text-[11px] font-normal opacity-45';

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-16 sm:max-w-6xl sm:px-6"
      >
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex w-full flex-col items-center sm:flex-row sm:items-center sm:gap-9">
            <div className="text-center sm:basis-[230px] sm:shrink-0">
              <h1 className="select-none font-wordmark text-[46px] leading-[0.95] text-foreground sm:text-[52px]">
                Khal
              </h1>
              <p className="mt-2.5 font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
                {t('tagline')}
              </p>
            </div>
            <nav
              aria-label="Enlaces del estudio"
              className="mt-[30px] flex w-full flex-col gap-[9px] sm:mt-0 sm:max-w-[360px] sm:flex-1"
            >
              <Link href="/catalogo" className={primeClass}>
                {t('book')}
                <span aria-hidden="true" className={arrowClass}>
                  →
                </span>
              </Link>
              <Link href="/catalogo" className={doorClass}>
                {t('catalog')}
                <span aria-hidden="true" className={arrowClass}>
                  →
                </span>
              </Link>
              <Link href="/conocenos" className={doorClass}>
                {t('about')}
                <span aria-hidden="true" className={arrowClass}>
                  →
                </span>
              </Link>
              {whatsappPhone ? (
                <a
                  href={whatsappUrl(whatsappPhone)}
                  target="_blank"
                  rel="noreferrer"
                  className={doorClass}
                >
                  {t('whatsapp')}
                  <span aria-hidden="true" className={arrowClass}>
                    ↗
                  </span>
                </a>
              ) : null}
            </nav>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
