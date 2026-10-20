import { PagoResult } from '@/components/payment/pago-result';
import { Header } from '@/components/shared/header';
import { buildPagoProps } from '@/lib/pago-page';
import type { Metadata } from 'next';

// MP Checkout Pro back_url target for payments that did not approve
// immediately (e.g. cash networks or transfers still clearing). The webhook
// confirms the booking when the payment approves; this page only reports.
export const metadata: Metadata = { robots: { index: false } };

type PagoPendientePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PagoPendientePage({ searchParams }: PagoPendientePageProps) {
  const props = await buildPagoProps({
    status: 'pendiente',
    titleKey: 'pendienteTitle',
    bodyKey: 'pendienteBody',
    searchParams: await searchParams,
  });

  return (
    <div className="relative min-h-dvh">
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto max-w-lg px-4 pb-16 pt-10">
        <PagoResult {...props} />
      </main>
    </div>
  );
}
