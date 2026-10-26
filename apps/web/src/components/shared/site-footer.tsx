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
      <div className="flex items-center justify-between gap-x-4 px-[5px] pb-[9px] pt-[3px] font-mono-khal text-[8px] uppercase tracking-[2px]">
        <nav
          aria-label="Redes del estudio"
          className="flex flex-wrap items-center gap-x-[5px] gap-y-1 text-faint"
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
                className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
            className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Políticas
          </Link>
        </nav>
        <span className="text-faint">vicente lópez</span>
      </div>
    </footer>
  );
}
