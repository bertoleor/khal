import { Link } from '@/i18n/navigation';
import { getPaymentSettings } from '@/lib/actions/settings';

export default async function SiteFooter() {
  const settings = await getPaymentSettings();
  const whatsappPhone = settings?.whatsappPhone ?? '';
  const instagramUrl = 'https://www.instagram.com/khal.estudiook/';

  return (
    <footer className="mx-auto w-full max-w-lg px-4 pb-12 pt-16 sm:max-w-6xl sm:px-6">
      {/* D9 (board s1): cierre tipográfico — el wordmark fantasma ES la
          transición (sin border-top, sin caja gris); debajo, la fila de
          contacto en mono chiquito. La jerarquía la hacen escala y aire. */}
      <div
        aria-hidden="true"
        className="select-none font-wordmark text-[clamp(64px,20vw,124px)] font-bold leading-[0.8] tracking-[2px] text-foreground/[0.07]"
      >
        KHAL
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 font-mono-khal text-[10px] uppercase tracking-[2px]">
        <nav aria-label="Redes del estudio" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Instagram
          </a>
          <a
            href={`https://wa.me/${whatsappPhone}`}
            target="_blank"
            rel="noreferrer"
            className="text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            WhatsApp
          </a>
          <Link
            href="/politicas"
            className="text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Políticas
          </Link>
        </nav>
        <span className="text-faint">Vicente López · Buenos Aires</span>
      </div>
    </footer>
  );
}
