import { Link } from '@/i18n/navigation';
import { getPaymentSettings } from '@/lib/actions/settings';

export default async function SiteFooter() {
  const settings = await getPaymentSettings();
  const whatsappPhone = settings?.whatsappPhone ?? '';
  const instagramUrl = 'https://www.instagram.com/khal.estudiook/';

  return (
    <footer className="mx-auto w-full max-w-lg px-4 pb-10 pt-14 sm:max-w-6xl sm:px-6">
      {/* D9: cierre tipográfico del espacio — sin border-top, la separación
          la hace el aire. */}
      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="text-faint">
          <span className="font-wordmark text-[15px] leading-none text-foreground">Khal</span>
          <span> · Pestañas · Vicente López, Buenos Aires</span>
        </p>
        <nav aria-label="Redes del estudio" className="flex items-center gap-4">
          <Link
            href="/politicas"
            className="font-medium text-muted transition-colors hover:text-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Políticas
          </Link>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-muted transition-colors hover:text-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Instagram
          </a>
          <a
            href={`https://wa.me/${whatsappPhone}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-muted transition-colors hover:text-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            WhatsApp
          </a>
        </nav>
      </div>
    </footer>
  );
}
