import { AppointmentList } from '@/components/admin/appointment-list';
import { appointmentsStore } from '@/lib/mocks/appointments';
import { getTranslations } from 'next-intl/server';

export default async function AdminPage() {
  const t = await getTranslations('Admin.appointments');
  const appointments = appointmentsStore.list();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
      <AppointmentList appointments={appointments} />
    </main>
  );
}
