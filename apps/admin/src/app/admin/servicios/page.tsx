import { ServiceManager } from '@/components/admin/service-manager';
import { fetchServices } from '@/lib/actions/services';
import { requireAuth } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

/**
 * Servicios (khal-admin-100-operable T4) — server shell.
 *
 * Auth-gated (verified JWT role via requireAuth; edge middleware only checks
 * cookie presence), fetches the live catalog once server-side and hands it
 * to the client manager. All writes flow through the server actions, which
 * revalidate this path.
 */
type ServiciosPageProps = {
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function ServiciosPage({ searchParams }: ServiciosPageProps) {
  const { skeleton } = await searchParams;
  const auth = await requireAuth();
  if (!auth.ok) redirect('/login');

  const t = await getTranslations('Admin.services');
  const services = await fetchServices();

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="skeleton-shimmer h-10 w-1/4 rounded bg-slate-200"></h1>
        <p className="skeleton-shimmer mt-1 h-4 w-1/3 rounded bg-slate-100"></p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4].map((cardIndex) => (
            <div key={cardIndex} className="rounded-xl border border-slate-200 p-4">
              <div className="skeleton-shimmer h-4 w-12 rounded-full bg-emerald-100"></div>
              <div className="mt-2 space-y-1">
                <p className="skeleton-shimmer h-3 w-2/3 rounded bg-slate-200"></p>
                <p className="skeleton-shimmer h-2 w-1/2 rounded bg-slate-100"></p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="skeleton-shimmer h-2 w-2 rounded-full bg-emerald-200"></span>
                  <span className="skeleton-shimmer h-2 w-14 rounded bg-slate-100"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
      <ServiceManager initialServices={services} />
    </main>
  );
}
