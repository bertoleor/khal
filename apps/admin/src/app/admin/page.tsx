import { skeletonLayout } from '@/shared/skeleton-layout';
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
    return skeletonLayout('Admin.appointments', skeleton);
  }

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{t('title')}</h1>
      <AppointmentList appointments={appointments} />
    </main>
  );
}
