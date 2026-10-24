import { ExceptionsList } from '@/components/admin/exceptions-list';
import { exceptionsStore } from '@/lib/mocks/exceptions';
import { getTranslations } from 'next-intl/server';

type BloqueosPageProps = {
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function BloqueosPage({ searchParams }: BloqueosPageProps) {
  const { skeleton } = await searchParams;
  const t = await getTranslations('Admin.exceptions');
  const exceptions = exceptionsStore.list();

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-6">
        <h1 aria-hidden="true" className="skeleton-shimmer h-10 w-1/4 rounded bg-white/[0.1]"></h1>
        <p className="skeleton-shimmer mt-1 h-4 w-1/3 rounded bg-white/[0.06]"></p>
        <div className="mt-4 space-y-4">
          {/* New-exception form skeleton */}
          <div className="space-y-3 rounded-2xl border border-white/10 p-4">
            <div className="skeleton-shimmer h-10 w-full rounded-xl bg-white/[0.06]"></div>
            <div className="flex gap-2">
              <div className="skeleton-shimmer h-10 w-full rounded-xl bg-white/[0.06]"></div>
              <div className="skeleton-shimmer h-10 w-full rounded-xl bg-white/[0.06]"></div>
            </div>
            <div className="skeleton-shimmer h-11 w-full rounded-full bg-emerald-400"></div>
          </div>

          {/* Exception list skeleton */}
          <div className="space-y-2">
            {[0, 1, 2].map((rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center justify-between rounded-2xl border border-white/10 p-3"
              >
                <div>
                  <p className="skeleton-shimmer h-4 w-2/3 rounded bg-white/[0.1]"></p>
                  <p className="skeleton-shimmer mt-1 h-3 w-1/3 rounded bg-white/[0.06]"></p>
                </div>
                <span className="skeleton-shimmer h-8 w-8 rounded-full bg-white/[0.06]"></span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{t('title')}</h1>
      <p className="mt-1 text-sm text-zinc-400">{t('description')}</p>
      <ExceptionsList exceptions={exceptions} />
    </main>
  );
}
