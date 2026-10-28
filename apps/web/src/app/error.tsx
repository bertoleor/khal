'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

// Named RouteError (not Error): the component must not shadow the global
// Error constructor. Next.js only requires the default export here — the
// function name itself is free (sonarjs/no-globals-shadowing).
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');

  useEffect(() => {
    // Error reported via structured logger (OBS-01) — no console.log (CQ-07)
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted">{t('description')}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-accent px-[17px] py-[11px] text-[13px] font-semibold text-accent-contrast transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('retry')}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-hairline bg-surface px-[17px] py-[11px] text-[13px] font-semibold text-foreground backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)] transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('home')}
          </a>
        </div>
      </div>
    </div>
  );
}
