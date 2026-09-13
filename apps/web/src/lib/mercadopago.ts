import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

// Mercado Pago online capture (G3). Raw REST integration — no SDK dependency:
// POST /checkout/preferences (create) + GET /v1/payments/:id (verify).
// Prices are never touched here: amounts come from the service catalog via
// computeAmountDueCents (packages/utils), converted cents -> ARS major units.

const MP_API_BASE = 'https://api.mercadopago.com';

const preferenceResponseSchema = z.object({
  id: z.string(),
  init_point: z.string().url(),
  sandbox_init_point: z.string().url().optional(),
});

const paymentResponseSchema = z.object({
  id: z.number(),
  status: z.string(),
  status_detail: z.string().nullable().optional(),
  transaction_amount: z.number(),
  currency_id: z.string().optional(),
  external_reference: z.string().nullable().optional(),
});

export type MercadoPagoPayment = z.infer<typeof paymentResponseSchema>;

export interface MercadoPagoEnv {
  accessToken: string;
  webhookSecret: string;
  appUrl: string | null;
}

/** Reads MP server env directly (never throws — callers map null to a friendly code). */
export function readMercadoPagoEnv(): MercadoPagoEnv | null {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (!accessToken || !webhookSecret) {
    return null;
  }
  return {
    accessToken,
    webhookSecret,
    appUrl: process.env.APP_URL ?? null,
  };
}

/**
 * Creates a Checkout Pro preference for a booking deposit/full amount.
 * external_reference carries the appointment id so the webhook can confirm it.
 * Amounts: price_cents (int) -> ARS pesos (unit_price = cents / 100).
 */
export async function createBookingPreference(
  env: MercadoPagoEnv,
  input: {
    appointmentId: string;
    serviceName: string;
    amountCents: number;
    currencyCode: string;
    payerEmail: string;
  }
): Promise<{ preferenceId: string; checkoutUrl: string }> {
  const notificationUrl = env.appUrl ? `${env.appUrl}/api/webhooks/mercadopago` : undefined;

  const response = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: `Seña — ${input.serviceName}`,
          quantity: 1,
          unit_price: input.amountCents / 100,
          currency_id: input.currencyCode,
        },
      ],
      payer: { email: input.payerEmail },
      external_reference: input.appointmentId,
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      ...(env.appUrl
        ? {
            back_urls: {
              success: `${env.appUrl}/pago/exito`,
              pending: `${env.appUrl}/pago/pendiente`,
              failure: `${env.appUrl}/pago/error`,
            },
            auto_return: 'approved',
          }
        : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`MP preference creation failed: HTTP ${response.status}`);
  }

  const parsed = preferenceResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error('MP preference creation failed: unexpected response shape');
  }
  return {
    preferenceId: parsed.data.id,
    checkoutUrl: parsed.data.init_point,
  };
}

/** Fetches a payment from MP to confirm its authoritative status (never trust the webhook body alone). */
export async function getMercadoPagoPayment(
  accessToken: string,
  paymentId: string
): Promise<MercadoPagoPayment | null> {
  const response = await fetch(`${MP_API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`MP payment fetch failed: HTTP ${response.status}`);
  }
  const parsed = paymentResponseSchema.safeParse(await response.json());
  return parsed.success ? parsed.data : null;
}

function parseSignatureHeader(header: string | null): { ts: string; v1: string } | null {
  if (!header) {
    return null;
  }
  const parts = Object.fromEntries(
    header.split(',').map((chunk) => {
      const [key, ...rest] = chunk.split('=');
      return [key.trim(), rest.join('=').trim()];
    })
  );
  // MP sends `ts=`; accept `t=` as an alias for forward-compat.
  const ts = parts['ts'] ?? parts['t'];
  const v1 = parts['v1'];
  if (!ts || !v1) {
    return null;
  }
  return { ts, v1 };
}

/**
 * Verifies the MP webhook HMAC-SHA256 signature.
 * Manifest (per MP docs): `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * signed with MP_WEBHOOK_SECRET; compared against the `v1` hash in `x-signature`.
 */
export function verifyMercadoPagoSignature(input: {
  secret: string;
  signatureHeader: string | null;
  requestIdHeader: string | null;
  dataId: string;
}): boolean {
  const parsed = parseSignatureHeader(input.signatureHeader);
  if (!parsed || !input.requestIdHeader) {
    return false;
  }
  const manifest = `id:${input.dataId};request-id:${input.requestIdHeader};ts:${parsed.ts};`;
  const digest = createHmac('sha256', input.secret).update(manifest).digest('hex');
  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(parsed.v1, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
