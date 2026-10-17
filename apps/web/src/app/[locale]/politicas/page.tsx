import { Header } from '@/components/shared/header';
import { getTranslations } from 'next-intl/server';

type PoliciesPageProps = {
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function PoliciesPage({ searchParams }: PoliciesPageProps) {
  const { skeleton } = await searchParams;
  const t = await getTranslations('policies');

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <div className="relative min-h-dvh">
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto max-w-lg px-4 pb-16 pt-10 sm:max-w-6xl sm:px-6"
        >
          <div className="space-y-6">
            <h1 className="skeleton-shimmer h-10 w-1/2 rounded bg-zinc-800"></h1>
            <p className="skeleton-shimmer h-5 w-1/3 rounded bg-zinc-800/60"></p>
            <div className="space-y-4">
              {['w-1/2', 'w-1/3', 'w-2/5', 'w-3/5'].map((titleWidth, sectionIndex) => (
                <section
                  key={sectionIndex}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
                >
                  <h2 className={`skeleton-shimmer h-8 rounded bg-zinc-800 ${titleWidth}`}></h2>
                  <p className="skeleton-shimmer mt-2 h-4 w-full rounded bg-zinc-800/60"></p>
                  <p className="skeleton-shimmer mt-2 h-4 w-2/3 rounded bg-zinc-800/60"></p>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

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
