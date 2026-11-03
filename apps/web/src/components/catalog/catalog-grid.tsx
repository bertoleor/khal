import { Link } from '@/i18n/navigation';
import { LinkButton } from '@/components/button';
import type { Service } from '@khal/validations';
import Image from 'next/image';

/**
 * Catálogo v7 (S3 — approved preview): PHOTOS ONLY. A 2-column grid of 4/5
 * photo cards with the service name on a glass chip — no prices, no rows
 * (the dueña moved prices to the detail screen so the grid stays clean).
 * Tap a photo → service detail, where the price lives. Real photos are
 * pending, so a service without photo_path renders the delicate "foto"
 * placeholder slot instead of a broken image.
 */
export function CatalogGrid({
  services,
  emptyMessage,
  emptyCtaLabel,
  whatsappPhone,
  photoFallbackLabel,
}: {
  services: Service[];
  emptyMessage: string;
  emptyCtaLabel: string;
  whatsappPhone: string;
  photoFallbackLabel: string;
}) {
  if (services.length === 0) {
    return (
      <div className="pt-8">
        <p className="max-w-xs text-[12.5px] leading-[1.55] text-muted">{emptyMessage}</p>
        {whatsappPhone ? (
          <LinkButton
            href={`https://wa.me/${whatsappPhone}`}
            variant="glass"
            size="md"
            external
            className="mt-5"
            aria-label={emptyCtaLabel + ' (se abre en nueva pestaña)'}
          >
            {emptyCtaLabel}
          </LinkButton>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-[9px]">
      {services.map((service) => (
        <Link
          key={service.id}
          href={`/servicios/${service.id}`}
          className="relative block overflow-hidden rounded-md border border-hairline bg-surface backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)] transition-[background-color,border-color] duration-160 ease-out will-change-transform hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]"
        >
          {service.photo_path ? (
            <div className="relative aspect-[4/5]">
              <Image
                src={service.photo_path}
                alt={service.name}
                fill
                sizes="(max-width: 390px) 50vw, 320px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/5] flex-col items-center justify-center gap-1.5 text-faint">
              <span aria-hidden="true" className="text-[20px] leading-none opacity-40">
                ◉
              </span>
              <span className="text-[10px]">{photoFallbackLabel}</span>
            </div>
          )}
          {/* Name chip over the photo (preview .pcard .lab): dark glass on
              dark mode, paper glass on light mode. */}
          <span className="absolute inset-x-[7px] bottom-[7px] rounded-[9px] bg-surface/60 px-2.5 py-1.5 text-[11px] font-semibold text-foreground backdrop-blur-md">
            {service.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
