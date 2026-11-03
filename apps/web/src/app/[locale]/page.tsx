import { Header } from '@/components/shared/header';
import SiteFooter from '@/components/shared/site-footer';
import { FlowGradientBackground } from '@/components/shared/flow-gradient-background';
import { LinkButton } from '@/components/button';
import { CursorTrail } from '@/components/cursor-trail';
import { ArrowRight } from '@/components/ui/arrow-right';
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
 *
 * Fondo (owner order, 2026-10-30): the verbatim 21st.dev flow-gradient
 * component is a fixed full-page layer behind EVERYTHING — header, hero,
 * nav and footer alike — and the clienta UI floats above it. The UI layer
 * uses canonical Button/LinkButton components with proper contrast overlays.
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
        <CursorTrail />
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

  return (
    <div className="relative min-h-dvh">
      {/* Verbatim 21st.dev flow-gradient — fixed background behind the whole
          page (header, hero, nav, footer). aria-hidden: purely decorative. */}
      <div aria-hidden="true" className="fixed inset-0 z-0">
        <FlowGradientBackground />
      </div>

      {/* Clienta UI above the background. */}
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Header />
        <CursorTrail />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-16 sm:max-w-6xl sm:px-6"
        >
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="flex w-full flex-col items-center sm:flex-row sm:items-center sm:gap-9">
              <div className="relative text-center sm:basis-[230px] sm:shrink-0">
                {/* Overlay for contrast on gradient */}
                <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
                <h1 className="relative select-none font-wordmark text-[46px] leading-[0.95] text-white sm:text-[52px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                  Khal
                </h1>
                <p className="relative mt-2.5 font-mono-khal text-[9px] uppercase tracking-[2.5px] text-muted/80">
                  {t('tagline')}
                </p>
              </div>
              <nav
                aria-label="Enlaces del estudio"
                className="relative mt-[30px] flex w-full flex-col gap-[9px] sm:mt-0 sm:max-w-[360px] sm:flex-1"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-black/40 rounded-full" aria-hidden="true" />
                  <LinkButton
                    href="/catalogo"
                    variant="primary"
                    size="md"
                    icon={<ArrowRight />}
                    iconPosition="right"
                    className="relative"
                  >
                    {t('book')}
                  </LinkButton>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-black/40 rounded-full" aria-hidden="true" />
                  <LinkButton
                    href="/catalogo"
                    variant="glass"
                    size="md"
                    icon={<ArrowRight />}
                    iconPosition="right"
                    className="relative"
                  >
                    {t('catalog')}
                  </LinkButton>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-black/40 rounded-full" aria-hidden="true" />
                  <LinkButton
                    href="/conocenos"
                    variant="glass"
                    size="md"
                    icon={<ArrowRight />}
                    iconPosition="right"
                    className="relative"
                  >
                    {t('about')}
                  </LinkButton>
                </div>
                {whatsappPhone ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-black/40 rounded-full" aria-hidden="true" />
                    <a
                      href={whatsappUrl(whatsappPhone)}
                      target="_blank"
                      rel="noreferrer"
                      className="relative flex items-center rounded-full border border-hairline bg-surface/90 px-[17px] py-[11px] text-[13px] font-semibold tracking-[-0.005em] text-foreground backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)] transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.985]"
                    >
                      {t('whatsapp')}
                      <ArrowRight className="ml-auto pl-4 text-[11px] font-normal opacity-45" aria-hidden="true" />
                    </a>
                  </div>
                ) : null}
              </nav>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
