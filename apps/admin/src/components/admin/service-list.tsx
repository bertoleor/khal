'use client';

import {
  bulkIncrease as bulkIncreaseAction,
  toggleVisibility as toggleVisibilityAction,
} from '@/lib/actions/services';
import { formatCents } from '@khal/utils';
import type { Service } from '@khal/validations';
import { useTranslations } from 'next-intl';

function handleToggleVisibility(formData: FormData): void {
  const id = formData.get('id') as string;
  const next = formData.get('next') === 'true';
  void toggleVisibilityAction(id, next);
}

function handleBulkIncrease(formData: FormData): void {
  const ids = formData.getAll('ids') as string[];
  void bulkIncreaseAction(ids);
}

export function ServiceList({ services }: { services: Service[] }) {
  const t = useTranslations('Admin');

  return (
    <form className="mt-4 space-y-2">
      {services.map((service) => (
        <div
          key={service.id}
          className="flex items-center gap-3 rounded-2xl border border-white/10 p-3"
        >
          <input
            type="checkbox"
            name="ids"
            value={service.id}
            aria-label={service.name}
            className="h-4 w-4"
          />
          <input type="hidden" name="next" value={!service.is_visible ? 'true' : 'false'} />
          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-medium ${
                service.is_visible ? 'text-white' : 'text-zinc-400'
              }`}
            >
              {service.name}
            </p>
            <p className="text-sm text-zinc-400">
              {formatCents(service.price_cents, service.currency_code)}
            </p>
          </div>
          <button
            formAction={handleToggleVisibility}
            name="id"
            value={service.id}
            type="submit"
            className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            {service.is_visible ? t('services.hide') : t('services.show')}
          </button>
        </div>
      ))}

      <button
        formAction={handleBulkIncrease}
        type="submit"
        className="mt-4 w-full rounded-full bg-emerald-400 py-3 text-sm font-medium text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      >
        {t('services.bulkIncrease')}
      </button>
    </form>
  );
}
