'use client';

import { toggleBlacklisted as toggleBlacklistedAction } from '@/lib/actions/clients';
import { formatCents } from '@khal/utils';
import type { Client } from '@khal/validations';
import { useTranslations } from 'next-intl';

function handleToggleBlacklisted(formData: FormData): void {
  void toggleBlacklistedAction(formData);
}

export interface ClientRow {
  client: Client;
  ltvCents: number;
}

export function ClientList({ rows }: { rows: ClientRow[] }) {
  const t = useTranslations('Admin');

  if (rows.length === 0) {
    return <p className="mt-6 text-slate-500">{t('clients.empty')}</p>;
  }

  return (
    <ul className="mt-4 space-y-2">
      {rows.map(({ client, ltvCents }) => (
        <li key={client.id} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{client.name}</p>
              <p className="truncate text-sm text-slate-500">{client.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-600">{t('clients.ltv')}</p>
              <p className="font-medium text-slate-900">{formatCents(ltvCents, 'ARS')}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {client.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {tag}
              </span>
            ))}
            {client.noShowCount > 0 ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
                {t('clients.noShow', { count: client.noShowCount })}
              </span>
            ) : null}
          </div>

          <form action={handleToggleBlacklisted} className="mt-3">
            <input type="hidden" name="id" value={client.id} />
            <button
              type="submit"
              className={
                client.isBlacklisted
                  ? 'rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700'
                  : 'rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
              }
            >
              {client.isBlacklisted ? t('clients.removeBlacklist') : t('clients.blacklist')}
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
