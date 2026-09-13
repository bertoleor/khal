import {
  getMercadoPagoPayment,
  readMercadoPagoEnv,
  verifyMercadoPagoSignature,
} from '@/lib/mercadopago';
import { notifyBookingConfirmed } from '@/lib/notify';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

// Mercado Pago webhook (G3): payment -> pending→confirmed + email notify.
// HMAC-SHA256 verified on every call (x-signature / x-request-id headers).
// Idempotency: the confirm UPDATE is conditional on status='pendiente', so
// MP retries are safe (processed_events has a uuid PK — MP payment ids are
// numeric strings, hence not usable as event_id there).

const webhookBodySchema = z.object({
  type: z.string().optional(),
  topic: z.string().optional(),
  action: z.string().optional(),
  data: z.object({ id: z.union([z.string(), z.number()]).optional() }).optional(),
});

const uuidSchema = z.string().uuid();

function readServiceEnv(): { url: string; serviceKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && serviceKey ? { url, serviceKey } : null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = webhookBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const topic = parsed.data.type ?? parsed.data.topic ?? '';
  const action = parsed.data.action ?? '';
  const dataId = parsed.data.data?.id !== undefined ? String(parsed.data.data.id) : null;

  const isPaymentEvent =
    topic === 'payment' || action.startsWith('payment.') || topic === 'merchant_order';
  if (!isPaymentEvent || !dataId) {
    // Ack non-payment events (e.g. merchant_order chatter) so MP stops retrying.
    return NextResponse.json({ received: true });
  }

  const mpEnv = readMercadoPagoEnv();
  if (!mpEnv) {
    return NextResponse.json({ error: 'mp_not_configured' }, { status: 500 });
  }

  const signatureOk = verifyMercadoPagoSignature({
    secret: mpEnv.webhookSecret,
    signatureHeader: req.headers.get('x-signature'),
    requestIdHeader: req.headers.get('x-request-id'),
    dataId,
  });
  if (!signatureOk) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let payment;
  try {
    payment = await getMercadoPagoPayment(mpEnv.accessToken, dataId);
  } catch {
    // Transient MP API failure: 502 so MP retries with backoff.
    return NextResponse.json({ error: 'mp_lookup_failed' }, { status: 502 });
  }
  if (!payment || payment.status !== 'approved') {
    // Pending/rejected/unknown: ack, nothing to confirm.
    return NextResponse.json({ received: true, status: payment?.status ?? 'unknown' });
  }

  const appointmentId = payment.external_reference;
  if (!appointmentId || !uuidSchema.safeParse(appointmentId).success) {
    return NextResponse.json({ error: 'unknown_booking' }, { status: 200 });
  }

  const serviceEnv = readServiceEnv();
  if (!serviceEnv) {
    return NextResponse.json({ received: true, confirmed: false, reason: 'db_not_configured' });
  }

  const client = createClient(serviceEnv.url, serviceEnv.serviceKey);
  const { error, count } = await client
    .from('appointments')
    .update({ status: 'confirmado', confirmed_at: new Date().toISOString() }, { count: 'exact' })
    .eq('id', appointmentId)
    .eq('status', 'pendiente');

  if (error) {
    return NextResponse.json({ error: 'confirm_failed' }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    // Only notify on a real pending→confirmed transition (retries stay silent).
    await notifyBookingConfirmed({ event: 'booking.confirmed', appointmentId, paymentId: dataId });
  }

  return NextResponse.json({ received: true, confirmed: (count ?? 0) > 0 });
}
