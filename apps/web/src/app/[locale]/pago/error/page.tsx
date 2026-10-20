import { PagoResult } from '@/components/payment/pago-result';
import { Header } from '@/components/shared/header';
import { buildPagoProps } from '@/lib/pago-page';
import type { Metadata } from 'next';

// MP Checkout Pro back_url target for rejected/failed payments. Nothing is
// confirmed here; the client can retry from the booking or fall back to the
// manual transfer flow. No payment data beyond the sanitized id is shown.
export const metadata: Metadata = { robots: { index: false } };

type PagoErrorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PagoErrorPage({ searchParams }: PagoErrorPageProps) {
  const props = await buildPagoProps({
    status: 'error',
    titleKey: 'errorTitle',
    bodyKey: 'errorBody',
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
