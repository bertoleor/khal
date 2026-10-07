import { Header } from '@/components/shared/header';
import { Link } from '@/i18n/navigation';
import { getService } from '@/lib/actions/catalog';
import { formatCents } from '@khal/utils';
import type { Service } from '@khal/validations';
import { getTranslations } from 'next-intl/server';
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

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('catalog');
  const service = await getService(id);

  if (!service) {
    notFound();
  }

  const deposit = depositLabel(service);

  return (
    <div className="min-h-dvh bg-white">
      <Header />
      <main className="mx-auto max-w-md px-4 pb-28">
        <div className="mt-4 flex h-48 items-center justify-center rounded-2xl bg-slate-100 text-4xl font-semibold text-slate-300">
          {service.name.slice(0, 1)}
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
          {service.name}
        </h1>
        {service.description ? <p className="mt-2 text-slate-600">{service.description}</p> : null}

        <dl className="mt-4 space-y-1 text-sm text-slate-500">
          <div className="flex justify-between py-2">
            <dt>{t('duration')}</dt>
            <dd>{service.duration_minutes} min</dd>
          </div>
          {deposit ? (
            <div className="flex justify-between py-2">
              <dt>{t('deposit')}</dt>
              <dd>{deposit}</dd>
            </div>
          ) : null}
        </dl>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4 px-4 py-3">
          <span className="text-lg font-semibold text-slate-900">
            {formatCents(service.price_cents, service.currency_code)}
          </span>
          <Link
            href={`/servicios/${service.id}/reservar`}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {t('book')}
          </Link>
        </div>
      </div>
    </div>
  );
}
