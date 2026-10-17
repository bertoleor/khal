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
        <h1 className="skeleton-shimmer h-10 w-1/4 rounded bg-slate-200"></h1>
        <p className="skeleton-shimmer mt-1 h-4 w-1/3 rounded bg-slate-100"></p>
        <div className="mt-4 space-y-4">
          {/* New-exception form skeleton */}
          <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <div className="skeleton-shimmer h-10 w-full rounded-xl bg-slate-100"></div>
            <div className="flex gap-2">
              <div className="skeleton-shimmer h-10 w-full rounded-xl bg-slate-100"></div>
              <div className="skeleton-shimmer h-10 w-full rounded-xl bg-slate-100"></div>
            </div>
            <div className="skeleton-shimmer h-11 w-full rounded-full bg-slate-900"></div>
          </div>

          {/* Exception list skeleton */}
          <div className="space-y-2">
            {[0, 1, 2].map((rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-3"
              >
                <div>
                  <p className="skeleton-shimmer h-4 w-2/3 rounded bg-slate-200"></p>
                  <p className="skeleton-shimmer mt-1 h-3 w-1/3 rounded bg-slate-100"></p>
                </div>
                <span className="skeleton-shimmer h-8 w-8 rounded-full bg-slate-100"></span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('description')}</p>
      <ExceptionsList exceptions={exceptions} />
    </main>
  );
}
