import { Header } from '@/components/shared/header';
import { getTranslations } from 'next-intl/server';

export default async function PoliciesPage() {
  const t = await getTranslations('policies');

  return (
    <div className="relative min-h-dvh">
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto max-w-lg px-4 pb-16 pt-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white">{t('title')}</h1>
        <p className="mt-2 text-zinc-400">{t('intro')}</p>

        <div className="mt-8 space-y-4">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
            <h2 className="font-semibold text-white">{t('depositTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t('depositBody')}</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
            <h2 className="font-semibold text-white">{t('cancellationTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t('cancellationBody')}</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
            <h2 className="font-semibold text-white">{t('noShowTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t('noShowBody')}</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
            <h2 className="font-semibold text-white">{t('punctualityTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t('punctualityBody')}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
