import { ClientList, type ClientRow } from '@/components/admin/client-list';
import { appointmentsStore } from '@/lib/mocks/appointments';
import { clientsStore } from '@/lib/mocks/clients';
import { getTranslations } from 'next-intl/server';

type ClientesPageProps = {
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const { skeleton } = await searchParams;
  const t = await getTranslations('Admin.clients');
  const clients = clientsStore.list();
  const appointments = appointmentsStore.list();

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-6">
        <h1 aria-hidden="true" className="skeleton-shimmer h-10 w-1/4 rounded bg-white/[0.1]"></h1>
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((cardIndex) => (
            <div key={cardIndex} className="rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="skeleton-shimmer h-4 w-1/2 rounded bg-white/[0.1]"></p>
                  <p className="skeleton-shimmer mt-1 h-3 w-1/3 rounded bg-white/[0.06]"></p>
                </div>
                <div className="text-right">
                  <p className="skeleton-shimmer h-3 w-10 rounded bg-white/[0.06]"></p>
                  <p className="skeleton-shimmer mt-1 h-4 w-16 rounded bg-white/[0.1]"></p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="skeleton-shimmer h-5 w-20 rounded-full bg-white/[0.06]"></span>
                <span className="skeleton-shimmer h-5 w-16 rounded-full bg-red-400/15"></span>
              </div>
              <div className="skeleton-shimmer mt-3 h-8 w-24 rounded-full border border-white/20"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  const ltvByClient = new Map<string, number>();
  for (const appointment of appointments) {
    if (appointment.status === 'confirmado') {
      ltvByClient.set(
        appointment.clientName,
        (ltvByClient.get(appointment.clientName) ?? 0) + appointment.priceCents
      );
    }
  }

  const rows: ClientRow[] = clients.map((client) => ({
    client,
    ltvCents: ltvByClient.get(client.name) ?? 0,
  }));

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{t('title')}</h1>
      <ClientList rows={rows} />
    </main>
  );
}
