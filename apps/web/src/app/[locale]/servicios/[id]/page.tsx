import { Header } from '@/components/shared/header';
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

type ServiceDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function ServiceDetailPage({ params, searchParams }: ServiceDetailPageProps) {
  const { id } = await params;
  const { skeleton } = await searchParams;
  const t = await getTranslations('catalog');

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <div className="relative min-h-dvh">
        <Header />
        <main className="mx-auto max-w-lg px-4 pb-28">
          <div className="mt-4 flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="skeleton-shimmer h-16 w-16 rounded-full bg-zinc-800"></div>
          </div>
          <h1
            aria-hidden="true"
            className="skeleton-shimmer mt-5 h-10 w-1/2 rounded bg-zinc-800"
          ></h1>
          <p className="skeleton-shimmer mt-2 h-4 w-1/3 rounded bg-zinc-800/60"></p>
          <dl className="mt-4 space-y-1">
            <div className="flex justify-between border-b border-white/5 py-2.5">
              <dt className="skeleton-shimmer h-5 w-1/3 rounded bg-zinc-800/60"></dt>
              <dd className="skeleton-shimmer h-5 w-1/3 rounded bg-zinc-800/60"></dd>
            </div>
            <div className="flex justify-between border-b border-white/5 py-2.5">
              <dt className="skeleton-shimmer h-5 w-1/3 rounded bg-zinc-800/60"></dt>
              <dd className="skeleton-shimmer h-5 w-1/3 rounded bg-emerald-400/30"></dd>
            </div>
          </dl>
        </main>
        <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-black/70 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-3">
            <span className="skeleton-shimmer h-8 w-1/4 rounded bg-zinc-800"></span>
            <span className="skeleton-shimmer flex h-11 w-32 items-center justify-center rounded-full bg-emerald-400">
              <span className="skeleton-shimmer h-4 w-1/2 rounded bg-zinc-900/80"></span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  const service = await getService(id);

  if (!service) {
    notFound();
  }

  const deposit = depositAmountCents(service);

  return (
    <div className="relative min-h-dvh">
      <Header />
      <main className="mx-auto max-w-lg px-4 pb-36">
        {/* "Atrás" tipográfico (D9): parte del texto, cero píldoras. */}
        <Link
          href="/"
          className="mt-4 inline-block font-mono-khal text-[11px] uppercase tracking-[2px] text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ← {t('back')}
        </Link>

        {/* Imagen protagonista (board s2). */}
        {service.photo_path ? (
          <div className="mt-3 h-52 overflow-hidden sm:h-64">
            <Image
              src={service.photo_path}
              alt={service.name}
              width={512}
              height={256}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mt-3 flex h-52 items-center justify-center bg-surface text-6xl font-semibold text-foreground/80 sm:h-64">
            {service.name.slice(0, 1)}
          </div>
        )}

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          {service.name}
        </h1>

        {/* Cluster de datos (board s2): borde funcional a la izquierda, filas
            con hairline — la seña se ve ANTES de entrar al flujo. */}
        <dl className="mt-4 border-l-2 border-foreground pl-4 text-[13px]">
          <div className="flex items-baseline justify-between border-b border-hairline py-2.5">
            <dt className="text-faint">{t('duration')}</dt>
            <dd className="font-semibold text-foreground">{service.duration_minutes} min</dd>
          </div>
          <div className="flex items-baseline justify-between border-b border-hairline py-2.5">
            <dt className="text-faint">{t('price')}</dt>
            <dd className="font-semibold text-foreground">
              {formatCents(service.price_cents, service.currency_code)}
            </dd>
          </div>
          {deposit != null ? (
            <div className="flex items-baseline justify-between py-2.5">
              <dt className="text-faint">
                {t('deposit')}
                {service.deposit_mode === 'percentage' && service.deposit_percentage_bp != null
                  ? ` (${service.deposit_percentage_bp / 100}%)`
                  : ''}
              </dt>
              <dd className="font-semibold text-accent-soft">
                {formatCents(deposit, service.currency_code)}
              </dd>
            </div>
          ) : null}
        </dl>

        {service.description ? (
          <p className="mt-4 text-sm leading-relaxed text-muted">{service.description}</p>
        ) : null}
      </main>

      {/* CTA sticky — borde funcional de barra (D11) + safe area iOS (D8). */}
      <div className="fixed inset-x-0 bottom-0 border-t border-hairline bg-background/85 backdrop-blur pb-safe">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-3">
          <div>
            <span className="block text-lg font-semibold leading-tight text-foreground">
              {formatCents(service.price_cents, service.currency_code)}
            </span>
            {deposit != null ? (
              <span className="block font-mono-khal text-[9px] uppercase tracking-[1.5px] text-faint">
                {t('deposit')} {formatCents(deposit, service.currency_code)}
              </span>
            ) : null}
          </div>
          <Link
            href={`/servicios/${service.id}/reservar`}
            className="bg-accent px-6 py-3 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
          >
            {t('book')}
          </Link>
        </div>
      </div>
    </div>
  );
}
