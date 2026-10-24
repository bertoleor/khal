'use server';

import { getService } from '@/lib/actions/catalog';
import { createBookingPreference, readMercadoPagoEnv } from '@/lib/mercadopago';
import { computeAmountDueCents } from '@khal/utils';
import { z } from 'zod';

export interface CheckoutPreferenceState {
  ok: boolean;
  checkoutUrl?: string;
  code?: 'invalid' | 'unavailable';
}

const preferenceInputSchema = z.object({
  bookingId: z.uuid(),
  serviceId: z.uuid(),
  // zod 4 pipe preserves the zod 3 trim-before-validate order (see
  // emailSchema in @khal/validations).
  payerEmail: z.string().trim().max(320).pipe(z.email()),
});

/**
 * Creates a Mercado Pago Checkout Pro preference for an existing booking.
 * Prices come server-side from the catalog (never from the client), so the
 * client cannot tamper with the amount. Called from PaymentStep ("Pay online").
 */
export async function createCheckoutPreference(
  bookingId: string,
  serviceId: string,
  payerEmail: string
): Promise<CheckoutPreferenceState> {
  const parsed = preferenceInputSchema.safeParse({ bookingId, serviceId, payerEmail });
  if (!parsed.success) {
    return { ok: false, code: 'invalid' };
  }

  const service = await getService(parsed.data.serviceId);
  if (!service) {
    return { ok: false, code: 'invalid' };
  }

  const amountCents = computeAmountDueCents(
    service.price_cents,
    service.deposit_mode,
    service.deposit_fixed_cents,
    service.deposit_percentage_bp
  );

  const mpEnv = readMercadoPagoEnv();
  if (!mpEnv) {
    // MP not configured: the manual transfer/WhatsApp flow stays available.
    return { ok: false, code: 'unavailable' };
  }

  try {
    const { checkoutUrl } = await createBookingPreference(mpEnv, {
      appointmentId: parsed.data.bookingId,
      serviceName: service.name,
      amountCents,
      currencyCode: service.currency_code,
      payerEmail: parsed.data.payerEmail,
    });
    return { ok: true, checkoutUrl };
  } catch {
    return { ok: false, code: 'unavailable' };
  }
}
