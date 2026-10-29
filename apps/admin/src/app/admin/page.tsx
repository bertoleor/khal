import { AppointmentList } from '@/components/admin/appointment-list';
import { appointmentsStore } from '@/lib/mocks/appointments';
import { getTranslations } from 'next-intl/server';

type AdminPageProps = {
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { skeleton } = await searchParams;
  const t = await getTranslations('Admin.appointments');
  const appointments = appointmentsStore.list();

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-6">
<h1><span className="sr-only">Administración</span>
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((rowIndex) => (
            <div
              key={rowIndex}
              className="flex h-12 flex-wrap items-center gap-3 rounded-2xl border border-white/10 p-3"
            >
              <span className="skeleton-shimmer h-3 w-3 shrink-0 rounded-full bg-white/[0.1]"></span>
              <div className="min-w-0 flex-1">
                <p className="skeleton-shimmer h-4 w-1/2 rounded bg-white/[0.1]"></p>
                <p className="skeleton-shimmer mt-1 h-3 w-1/3 rounded bg-white/[0.06]"></p>
              </div>
              <span className="skeleton-shimmer h-3 w-1/4 rounded bg-white/[0.06]"></span>
              <div className="flex gap-1">
                <span className="skeleton-shimmer h-8 w-10 rounded-full bg-emerald-400/20"></span>
                <span className="skeleton-shimmer h-8 w-10 rounded-full bg-white/[0.06]"></span>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{t('title')}</h1>
      <AppointmentList appointments={appointments} />
    </main>
  );
}
