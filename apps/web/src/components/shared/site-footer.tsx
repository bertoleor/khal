import { storePaymentSettings, storeSocialSettings } from '@/lib/mocks/settings';

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-lg px-4 pb-10 pt-8">
      <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm">
        <p className="text-zinc-500">Khal · Pestañas · Vicente López, Buenos Aires</p>
        <nav aria-label="Redes del estudio" className="flex items-center gap-4">
          <a
            href={storeSocialSettings.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-zinc-300 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            Instagram
          </a>
          <a
            href={`https://wa.me/${storePaymentSettings.whatsappPhone}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-zinc-300 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            WhatsApp
          </a>
        </nav>
      </div>
    </footer>
  );
}
