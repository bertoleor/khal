import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-slate-400">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
        <p className="mt-2 text-slate-500">{t('description')}</p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {t('home')}
          </a>
        </div>
      </div>
    </div>
  );
}
