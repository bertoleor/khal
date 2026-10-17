import { Header } from '@/components/shared/header';
import { Link } from '@/i18n/navigation';
import { getService } from '@/lib/actions/catalog';
import { formatCents } from '@khal/utils';
import type { Service } from '@khal/validations';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { notFound } from 'next/navigation';

function depositLabel(service: Service): string | null {
  if (service.deposit_mode === 'percentage' && service.deposit_percentage_bp != null) {
    return `${service.deposit_percentage_bp / 100}%`;
  }
  if (service.deposit_mode === 'fixed' && service.deposit_fixed_cents != null) {
    return formatCents(service.deposit_fixed_cents, service.currency_code);
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
          <h1 className="skeleton-shimmer mt-5 h-10 w-1/2 rounded bg-zinc-800"></h1>
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

  const deposit = depositLabel(service);

  return (
    <div className="relative min-h-dvh">
      <Header />
      <main className="mx-auto max-w-lg px-4 pb-28">
        {service.photo_path ? (
          <div className="mt-4 h-48 overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={service.photo_path}
              alt={service.name}
              width={512}
              height={192}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mt-4 flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-5xl font-semibold text-white/80 backdrop-blur-sm">
            {service.name.slice(0, 1)}
          </div>
        )}
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">{service.name}</h1>
        {service.description ? <p className="mt-2 text-zinc-400">{service.description}</p> : null}

        <dl className="mt-4 space-y-1 text-sm text-zinc-400">
          <div className="flex justify-between border-b border-white/5 py-2.5">
            <dt>{t('duration')}</dt>
            <dd className="text-zinc-200">{service.duration_minutes} min</dd>
          </div>
          {deposit ? (
            <div className="flex justify-between border-b border-white/5 py-2.5">
              <dt>{t('deposit')}</dt>
              <dd className="text-emerald-300">{deposit}</dd>
            </div>
          ) : null}
        </dl>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-3">
          <span className="text-lg font-semibold text-white">
            {formatCents(service.price_cents, service.currency_code)}
          </span>
          <Link
            href={`/servicios/${service.id}/reservar`}
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 active:scale-[0.98]"
          >
            {t('book')}
          </Link>
        </div>
      </div>
    </div>
  );
}
