import type { PagoResultProps, PagoStatus } from '@/components/payment/pago-result';
import { getPaymentSettings } from '@/lib/actions/settings';
import { parsePagoSearchParams } from '@/lib/pago-params';
import { buildWhatsAppLink } from '@khal/utils';
import { getTranslations } from 'next-intl/server';

// G3 — shared props builder for the three /pago return pages (MP Checkout Pro
// back_urls). The pages only report the outcome: booking confirmation is
// asynchronous (webhook + payment re-fetch), so nothing here confirms a turn.
// The WhatsApp CTA disappears entirely when no phone is configured
// (fail-soft, same doctrine as the manual transfer section, KHAL-A1).

interface BuildPagoPropsInput {
  status: PagoStatus;
  titleKey: 'exitoTitle' | 'pendienteTitle' | 'errorTitle';
  bodyKey: 'exitoBody' | 'pendienteBody' | 'errorBody';
  searchParams: Record<string, string | string[] | undefined>;
}

/**
 * Builds the full PagoResultProps for a /pago page: per-request copy from the
 * pagoResult namespace, sanitized MP query params and the store's WhatsApp
 * settings. Never throws on malformed params (parsePagoSearchParams is
 * fail-soft).
 */
export async function buildPagoProps(input: BuildPagoPropsInput): Promise<PagoResultProps> {
  const t = await getTranslations('pagoResult');
  const { paymentId } = parsePagoSearchParams(input.searchParams);
  const storePayment = await getPaymentSettings();
  const whatsappPhone = storePayment?.whatsappPhone ?? '';
  const message = paymentId ? t('whatsappMessage', { paymentId }) : t('whatsappMessageNoId');

  return {
    status: input.status,
    title: t(input.titleKey),
    body: t(input.bodyKey),
    paymentLine: paymentId ? t('paymentLabel', { id: paymentId }) : null,
    backToCatalogLabel: t('backToCatalog'),
    backToCatalogHref: '/',
    whatsappLabel: whatsappPhone ? t('whatsappHelp') : null,
    whatsappHref: whatsappPhone ? buildWhatsAppLink(whatsappPhone, message) : null,
  };
}
