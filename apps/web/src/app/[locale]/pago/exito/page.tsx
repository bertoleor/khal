import { PagoResult } from '@/components/payment/pago-result';
import { Header } from '@/components/shared/header';
import { buildPagoProps } from '@/lib/pago-page';
import type { Metadata } from 'next';

// MP Checkout Pro sends the client back here via back_urls once the payment
// attempt ends. The page only reports the outcome — the booking confirmation
// itself is asynchronous (webhook + payment re-fetch), so it never confirms.
export const metadata: Metadata = { robots: { index: false } };

type PagoExitoPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PagoExitoPage({ searchParams }: PagoExitoPageProps) {
  const props = await buildPagoProps({
    status: 'exito',
    titleKey: 'exitoTitle',
    bodyKey: 'exitoBody',
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
