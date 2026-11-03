// NEW: Shared payment page hook (khal-design-system T3)
// Extends the PagoResult shared component to eliminate remaining JSCPD clone
import { useSearchParams } from 'next/navigation';
import { PagoResult } from '@/components/payment/pago-result';
import { Header } from '@/components/shared/header';
import { buildPagoProps } from '@/lib/pago-page';
import { useTranslations } from 'next-intl';

/** Creates pago page config for either 'exito' or 'pendiente' status */
export function usePagoPage(status: 'exito' | 'pendiente') {
  const params = useSearchParams();
  const props = await buildPagoProps({
    status,
    titleKey: `${status}Title`,
    bodyKey: `${status}Body`,
    searchParams: await params,
  });

  const t = useTranslations('payments');

  return {
    Component: () => (
      <div className="relative min-h-dvh">
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto max-w-lg px-4 pb-16 pt-10"
        >
          <PagoResult
            status={status}
            titleKey={${status}Title}
            bodyKey={${status}Body}
            paymentData={props.paymentData}
          />
        </main>
      </div>
    ),
    props,
  };
}
