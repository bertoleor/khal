'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Admin.error');

  useEffect(() => {
    // Error reported via structured logger (OBS-01) — no console.log (CQ-07)
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
        <p className="mt-2 text-slate-500">{t('description')}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {t('retry')}
          </button>
          <a
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {t('home')}
          </a>
        </div>
      </div>
    </div>
  );
}
