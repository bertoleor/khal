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
    return <p className="mt-6 text-zinc-400">{t('clients.empty')}</p>;
  }

  return (
    <ul className="mt-4 space-y-2">
      {rows.map(({ client, ltvCents }) => (
        <li key={client.id} className="rounded-2xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{client.name}</p>
              <p className="truncate text-sm text-zinc-400">{client.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">{t('clients.ltv')}</p>
              <p className="font-medium text-white">{formatCents(ltvCents, 'ARS')}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {client.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-400"
              >
                {tag}
              </span>
            ))}
            {client.noShowCount > 0 ? (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
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
                  ? 'rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400'
                  : 'rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400'
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
