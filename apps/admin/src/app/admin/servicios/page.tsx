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
export default async function ServiciosPage() {
  const auth = await requireAuth();
  if (!auth.ok) redirect('/login');

  const t = await getTranslations('Admin.services');
  const services = await fetchServices();

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
      <ServiceManager initialServices={services} />
    </main>
  );
}
