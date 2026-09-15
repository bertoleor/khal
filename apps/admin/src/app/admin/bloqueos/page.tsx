import { ExceptionsList } from '@/components/admin/exceptions-list';
import { exceptionsStore } from '@/lib/mocks/exceptions';
import { getTranslations } from 'next-intl/server';

export default async function BloqueosPage() {
  const t = await getTranslations('Admin.exceptions');
  const exceptions = exceptionsStore.list();

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('description')}</p>
      <ExceptionsList exceptions={exceptions} />
    </main>
  );
}
