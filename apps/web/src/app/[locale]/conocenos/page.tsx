import { Header } from '@/components/shared/header';
import SiteFooter from '@/components/shared/site-footer';
import { Link } from '@/i18n/navigation';
import { getPaymentSettings } from '@/lib/actions/settings';
import { INSTAGRAM_URL, TIKTOK_URL, whatsappUrl } from '@/lib/socials';
import { getTranslations } from 'next-intl/server';

/**
 * Conocenos v7 (S4 — approved preview): the NEW screen. Studio blurb on a
 * glass card + the social doors (Instagram / TikTok / WhatsApp) — "vamos
 * ahí a poner las redes después": the rows are wired, the dueña swaps the
 * copy and the real handles when she sends them. Rows are quiet glass
 * strips with a pill ↗ affordance, not chunky buttons (S12).
 */
type ConocenosPageProps = {
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function ConocenosPage({ searchParams }: ConocenosPageProps) {
  const { skeleton } = await searchParams;
  const t = await getTranslations('conocenos');

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
            className="skeleton-shimmer mt-3 h-5 w-28 rounded bg-zinc-800"
          ></div>
          <div
            aria-hidden="true"
            className="skeleton-shimmer mt-3 h-16 w-full rounded-lg bg-zinc-800/60"
          ></div>
          <div className="mt-3.5 space-y-2.5">
            {[0, 1, 2].map((rowIndex) => (
              <div
                key={rowIndex}
                aria-hidden="true"
                className="skeleton-shimmer h-9 w-full rounded-lg bg-zinc-800/60"
              ></div>
            ))}
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const settings = await getPaymentSettings();
  const whatsappPhone = settings?.whatsappPhone ?? '';

  const socials: Array<{ label: string; href: string }> = [
    { label: 'Instagram', href: INSTAGRAM_URL },
    { label: 'TikTok', href: TIKTOK_URL },
    ...(whatsappPhone ? [{ label: 'WhatsApp', href: whatsappUrl(whatsappPhone) }] : []),
  ];

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

        {/* Studio blurb — glass card, quiet text (preview §3 conocenos). */}
        <div className="mt-3 rounded-lg border border-hairline bg-surface p-[13px] backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)]">
          <p className="text-[12.5px] leading-[1.55] text-muted">{t('blurb')}</p>
        </div>

        <p className="mb-2 mt-3.5 font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
          {t('social')}
        </p>
        <div className="divide-y divide-hairline rounded-lg border border-hairline bg-surface backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)]">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-[9px] transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="text-xs text-muted">{social.label}</span>
              <span
                aria-hidden="true"
                className="rounded-full border border-hairline px-3 py-[5px] text-[10.5px] font-semibold text-foreground"
              >
                ↗
              </span>
            </a>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
