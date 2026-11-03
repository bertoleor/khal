import { Header } from '@/components/shared/header';
import SiteFooter from '@/components/shared/site-footer';
import { Link } from '@/i18n/navigation';
import { getService } from '@/lib/actions/catalog';
import { formatCents } from '@khal/utils';
import type { Service } from '@khal/validations';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { notFound } from 'next/navigation';

/** Monto de la seña en centavos (percentage → proporcional, fixed → fijo). */
function depositAmountCents(service: Service): number | null {
  if (service.deposit_mode === 'percentage' && service.deposit_percentage_bp != null) {
    return Math.round((service.price_cents * service.deposit_percentage_bp) / 10000);
  }
  if (service.deposit_mode === 'fixed' && service.deposit_fixed_cents != null) {
    return service.deposit_fixed_cents;
  }
  return null;
}

/** Duración legible (S8: todo viaja a 1 h hasta que la dueña confirme
 *  las duraciones reales — "1 h", nunca "60 min"). */
function durationLabel(minutes: number): string {
  return minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`;
}

type ServiceDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ skeleton?: string }>;
};

/**
 * Servicio v7 (S5 — approved preview): photo slot (real photos pending),
 * description, the TOTAL big in mono, duración and seña on quiet glass
 * rows, then the solid pill CTA. No "el resto al pagar al llegar" (the
 * dueña called it redundant) and no sticky bar — the CTA breathes in the
 * flow. Back door goes to the catálogo (S3), typographic kicker style.
 */
export default async function ServiceDetailPage({ params, searchParams }: ServiceDetailPageProps) {
  const { id } = await params;
  const { skeleton } = await searchParams;
  const t = await getTranslations('catalog');

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <div className="relative flex min-h-dvh flex-col">
        <Header />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-lg flex-1 px-5 pb-16">
          <div
            aria-hidden="true"
            className="skeleton-shimmer mt-3 h-2 w-20 rounded bg-zinc-800/60"
          ></div>
          <div
            aria-hidden="true"
            className="skeleton-shimmer mt-3 aspect-[4/3] w-full rounded-md bg-zinc-800/60"
          ></div>
          <div
            aria-hidden="true"
            className="skeleton-shimmer mt-[13px] h-5 w-1/2 rounded bg-zinc-800"
          ></div>
          <div
            aria-hidden="true"
            className="skeleton-shimmer mt-2 h-3 w-2/3 rounded bg-zinc-800/60"
          ></div>
          <div
            aria-hidden="true"
            className="skeleton-shimmer mt-3.5 h-8 w-28 rounded bg-zinc-800"
          ></div>
          <div className="mt-3 space-y-2.5">
            {[0, 1].map((rowIndex) => (
              <div
                key={rowIndex}
                aria-hidden="true"
                className="skeleton-shimmer h-9 w-full rounded-lg bg-zinc-800/60"
              ></div>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="skeleton-shimmer mt-3 h-12 w-full rounded-full bg-zinc-800"
          ></div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const service = await getService(id);

  if (!service) {
    notFound();
  }

  const deposit = depositAmountCents(service);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-lg flex-1 px-5 pb-16">
        {/* "Atrás" tipográfico (S12): parte del texto, cero píldoras. */}
        <Link
          href="/catalogo"
          className="mt-3 inline-block font-mono-khal text-[8px] uppercase tracking-[2.5px] text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ← {t('backCatalog')}
        </Link>

        {/* Foto del servicio (S5): slot con borde punteado hasta que
            lleguen las fotos reales de la dueña. */}
        {service.photo_path ? (
          <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-md">
            <Image
              src={service.photo_path}
              alt={service.name}
              fill
              sizes="(max-width: 390px) 100vw, 512px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="mt-3 flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-hairline bg-surface text-faint backdrop-blur-lg">
            <span aria-hidden="true" className="text-[20px] leading-none opacity-40">
              ◉
            </span>
            <span className="text-[10.5px]">{t('photoSlot')}</span>
          </div>
        )}

        <h1 className="mt-[13px] text-[18px] font-bold tracking-[-0.02em] text-foreground">
          {service.name}
        </h1>

        {service.description ? (
          <p className="mt-[7px] text-[12.5px] leading-[1.55] text-muted">{service.description}</p>
        ) : null}

        {/* El TOTAL en grande (S5): kicker "total" + número mono. Sin
            "el resto al llegar" — redundante (dueña, v7). */}
        <div className="mt-3.5">
          <p className="font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
            {t('total')}
          </p>
          <p className="mt-1.5 font-mono-khal text-[30px] font-bold leading-none tracking-[-1px] tabular-nums text-foreground">
            {formatCents(service.price_cents, service.currency_code)}
          </p>
        </div>

        {/* Datos (S5): duración y seña en filas delicadas py-2.5 px-3.5. */}
        <dl className="mt-3 divide-y divide-hairline rounded-lg border border-hairline bg-surface backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)]">
          <div className="flex items-center justify-between px-3.5 py-2.5 text-xs">
            <dt className="text-muted">{t('duration')}</dt>
            <dd className="font-semibold text-foreground">
              {durationLabel(service.duration_minutes)}
            </dd>
          </div>
          {deposit != null ? (
            <div className="flex items-center justify-between px-3.5 py-2.5 text-xs">
              <dt className="text-muted">{t('depositToBook')}</dt>
              <dd className="font-semibold text-foreground">
                {formatCents(deposit, service.currency_code)}
              </dd>
            </div>
          ) : null}
        </dl>

        {/* CTA (S2/S12): la única píldora sólida de la pantalla, arrow
            con aire propio. */}
        <div className="mt-3">
          <Link
            href={`/servicios/${service.id}/reservar`}
            className="flex items-center justify-center rounded-full bg-accent px-[17px] py-[13px] text-[13.5px] font-semibold text-accent-contrast transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
          >
            {t('book')}
            <span aria-hidden="true" className="pl-4 text-[11px] font-normal opacity-45">
              →
            </span>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
