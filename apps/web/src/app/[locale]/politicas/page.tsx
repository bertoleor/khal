import { Header } from '@/components/shared/header';
import { Link } from '@/i18n/navigation';
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
<h1><span className="sr-only">Políticas</span></h1>
            <p className="skeleton-shimmer h-5 w-1/3 rounded bg-zinc-800/60"></p>
            <div className="space-y-4">
              {['w-1/2', 'w-1/3', 'w-2/5', 'w-3/5'].map((titleWidth, sectionIndex) => (
                <section
                  key={sectionIndex}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
                >
                  <h2
                    aria-hidden="true"
                    className={`skeleton-shimmer h-8 rounded bg-zinc-800 ${titleWidth}`}
                  ></h2>
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
      <main id="main" tabIndex={-1} className="mx-auto max-w-lg px-4 pb-16 pt-6">
        <Link
          href="/"
          className="inline-block font-mono-khal text-[11px] uppercase tracking-[2px] text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ← {t('back')}
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
        <p className="mt-2 text-sm text-faint">{t('intro')}</p>

        {/* Términos numerados (board s6 — "la política se LEE, no se esconde"):
            número fantasma + título + cuerpo legible, hairline entre ítems. */}
        <ol className="mt-8">
          {(
            [
              { title: t('depositTitle'), body: t('depositBody') },
              { title: t('cancellationTitle'), body: t('cancellationBody') },
              { title: t('noShowTitle'), body: t('noShowBody') },
              { title: t('punctualityTitle'), body: t('punctualityBody') },
              { title: t('externalWorkTitle'), body: t('externalWorkBody') },
            ] as const
          ).map((term, index) => (
            <li key={term.title} className="flex gap-4 border-b border-hairline py-5">
              <span
                aria-hidden="true"
                className="w-8 shrink-0 select-none text-right text-4xl font-bold leading-none text-foreground/[0.14]"
              >
                {index + 1}
              </span>
              <div>
                <h2 className="font-semibold text-foreground">{term.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{term.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 font-mono-khal text-[10px] uppercase tracking-[2px] text-faint">
          {t('more')}
        </p>
      </main>
    </div>
  );
}
