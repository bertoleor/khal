import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#000000] px-4">
      <div className="max-w-md text-center">
        <p className="font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted">{t('description')}</p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-accent px-[17px] py-[11px] text-[13px] font-semibold text-accent-contrast transition-[background-color] duration-160 ease-out will-change-transform hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t('home')}
          </a>
        </div>
      </div>
    </div>
  );
}
