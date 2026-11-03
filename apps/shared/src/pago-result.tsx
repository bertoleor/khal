// NEW: Shared payment result component (khal-design-system T3)
// Extracted from pago/exito and pago/pendiente to eliminate JSCPD clone
import { PaymentStatus } from '@/lib/payment-types';

/** Props for PagoResult component */
export type PagoResultProps = {
  /** Status: 'exito' o 'pendiente' */
  status: PaymentStatus;
  /** Título i18n */
  titleKey: string;
  /** Cuerpo i18n */
  bodyKey: string;
  /** Datos del pago */
  paymentData: {
    amount: string;
    currency: string;
    transactionId?: string;
    reference?: string;
  };
};

/** Payment result presentation component */
export function PagoResult({ status, titleKey, bodyKey, paymentData }: PagoResultProps) {
  const t = useTranslations('payments');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">
        {t(titleKey)}
      </h1>

      <p className="text-zinc-300">
        {t(bodyKey, {
          amount: paymentData.amount,
          currency: paymentData.currency,
        })}
      </p>

      {/* CTA or booking info */}
      <div>
        <p className="text-sm text-zinc-400">
          Tu reserva está {status === 'exito' ? 'confirmada' : 'en proceso'}. \
          Recibirás una confirmación por correo electrónico.
        </p>
      </div>
    </div>
  );
}
