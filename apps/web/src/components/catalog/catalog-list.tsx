import { Link } from '@/i18n/navigation';
import { formatCents } from '@khal/utils';
import type { Service } from '@khal/validations';

/**
 * Catálogo v2 (board s1 — T-F2.1): LISTA de filas, no grilla de cards.
 * La PRIMERA fila es el servicio firma, agrandado y enmarcado (jerarquía de
 * un vistazo); el resto son filas quietas separadas por hairline.
 * Empty state diseñado: el mensaje + CTA de WhatsApp (nada de cajas grises).
 */
export function CatalogList({
  services,
  emptyMessage,
  emptyCtaLabel,
  whatsappPhone,
}: {
  services: Service[];
  emptyMessage: string;
  emptyCtaLabel: string;
  whatsappPhone: string;
}) {
  if (services.length === 0) {
    return (
      <div className="pt-8">
        <p className="max-w-xs text-sm leading-relaxed text-muted">{emptyMessage}</p>
        {whatsappPhone ? (
          <a
            href={`https://wa.me/${whatsappPhone}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block border border-hairline-strong px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]"
          >
            {emptyCtaLabel}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {services.map((service, index) => {
        const featured = index === 0;
        return (
          <Link
            key={service.id}
            href={`/servicios/${service.id}`}
            className={
              featured
                ? // Firma del estudio: marco 2px (borde funcional de jerarquía), cuerpo agrandado.
                  'group flex items-center justify-between gap-4 border-2 border-foreground p-4 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]'
                : 'group flex items-center justify-between gap-4 border-b border-hairline py-3.5 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]'
            }
          >
            <span className="min-w-0">
              <span
                className={
                  featured
                    ? 'block text-lg font-semibold leading-tight text-foreground'
                    : 'block text-[15px] font-semibold leading-tight text-foreground'
                }
              >
                {service.name}
              </span>
              {service.description ? (
                <span className="mt-0.5 block truncate text-[13px] text-faint">
                  {service.description}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-right">
              <span
                className={
                  featured
                    ? 'block text-lg font-semibold text-foreground'
                    : 'block text-[15px] font-semibold text-foreground'
                }
              >
                {formatCents(service.price_cents, service.currency_code)}
              </span>
              <span className="mt-0.5 block font-mono-khal text-[10px] uppercase tracking-[1.5px] text-faint">
                {service.duration_minutes} min
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
