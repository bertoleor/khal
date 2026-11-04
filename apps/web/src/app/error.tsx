'use client';

import { useTranslations } from 'next-intl';

// Named RouteError (not Error): the component must not shadow the global
// Error constructor. Next.js only requires the default export here — the
// function name itself is free (sonarjs/no-globals-shadowing).
export default function RouteError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#000000] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted">{t('description')}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-accent px-[17px] py-[11px] text-[13px] font-semibold text-accent-contrast transition-[background-color] duration-160 ease-out will-change-transform hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t('retry')}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-hairline bg-surface/90 px-[17px] py-[11px] text-[13px] font-semibold text-foreground backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)] transition-[background-color,border-color] duration-160 ease-out will-change-transform hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t('home')}
          </a>
        </div>
      </div>
    </div>
  );
}
