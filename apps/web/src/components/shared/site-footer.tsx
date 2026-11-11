import { Link } from '@/i18n/navigation';
import { getPaymentSettings } from '@/lib/actions/settings';
import { INSTAGRAM_URL, TIKTOK_URL, whatsappUrl } from '@/lib/socials';

/**
 * Footer v7 (S11 — approved preview): the ghost watermark IS the closure —
 * "Khal" in TAN Nightingale (capital K, lowercase rest — never "KHAL"),
 * complete and uncut, floating over the fondo at 72px in the ghost tint.
 * Under it, one mono line of the four doors: instagram · tiktok · whatsapp ·
 * políticas, separated by hairline middots; vicente lópez closes on the
 * right. Hierarchy comes from scale and air (no boxes, no border-top).
 * Responsive: 1-col mobile, 2-col tablet, 4-col desktop.
 */
export default async function SiteFooter() {
  const settings = await getPaymentSettings();
  const whatsappPhone = settings?.whatsappPhone ?? '';

  const socials: Array<{ label: string; href: string }> = [
    { label: 'Instagram', href: INSTAGRAM_URL },
    { label: 'TikTok', href: TIKTOK_URL },
    ...(whatsappPhone ? [{ label: 'WhatsApp', href: whatsappUrl(whatsappPhone) }] : []),
  ];

  return (
    <footer className="mx-auto w-full max-w-lg px-5 pb-12 pt-6 sm:max-w-6xl sm:px-6">
      <div
        aria-hidden="true"
        className="select-none text-center font-wordmark text-[72px] leading-[0.95] text-foreground/[0.06] light:text-foreground/[0.05]"
      >
        Khal
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between gap-x-4 sm:gap-x-0 sm:pb-[9px] sm:pt-[3px] font-mono-khal text-[8px] uppercase tracking-[2px]">
        <nav
          aria-label="Redes del estudio"
          className="flex flex-wrap items-center gap-x-[5px] gap-y-1 text-faint w-full sm:w-auto"
        >
          {socials.map((social, index) => (
            <span key={social.label} className="flex items-center gap-x-[5px]">
              {index > 0 ? (
                <span aria-hidden="true" className="text-faint">
                  ·
                </span>
              ) : null}
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="transition-[color] duration-160 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] touch-manipulation flex items-center py-1"
              >
                {social.label}
              </a>
            </span>
          ))}
          <span aria-hidden="true" className="text-faint">
            ·
          </span>
          <Link
            href="/politicas"
            className="transition-[color] duration-160 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] touch-manipulation flex items-center py-1"
          >
            Políticas
          </Link>
        </nav>
        <span className="text-faint self-center sm:self-auto">vicente lópez</span>
      </div>
    </footer>
  );
}
