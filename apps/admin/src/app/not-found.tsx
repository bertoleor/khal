import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('Admin.notFound');

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white/[0.04] px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-zinc-500">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{t('title')}</h1>
        <p className="mt-2 text-zinc-400">{t('description')}</p>
        <div className="mt-6">
          <a
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            {t('home')}
          </a>
        </div>
      </div>
    </div>
  );
}
