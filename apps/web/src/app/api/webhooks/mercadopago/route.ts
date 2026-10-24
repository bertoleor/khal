import {
  getMercadoPagoPayment,
  readMercadoPagoEnv,
  verifyMercadoPagoSignature,
} from '@/lib/mercadopago';
import { notifyBookingConfirmed } from '@/lib/notify';
import { sendBookingReminder } from '@/lib/send-reminder';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

// Mercado Pago webhook (G3): payment -> pending→confirmed + email notify.
// HMAC-SHA256 verified on every call (x-signature / x-request-id headers).
// Idempotency (two layers): the confirm UPDATE is conditional on
// status='pendiente', AND each approved event is claimed in processed_events
// keyed by its real MP event_key (migration 0004) before the DB is touched, so
// MP retries ack without re-running the confirm/notify path. MP payment ids are
// numeric strings, hence unusable as the original uuid event_id PK — that is why
// processed_events carries its own text event_key.
//
// POST is a linear chain of named steps (readWebhookEvent → signature →
// fetchApprovedPayment → parseAppointmentId → claimProcessedEvent →
// confirmAppointment → sendConfirmNotifications). Each helper is small,
// single-purpose and carries its own audit rationale, so the security-critical
// flow stays readable — and auditable — top to bottom.

const webhookBodySchema = z.object({
  type: z.string().optional(),
  topic: z.string().optional(),
  action: z.string().optional(),
  data: z.object({ id: z.union([z.string(), z.number()]).optional() }).optional(),
});

const uuidSchema = z.string().uuid();

// REMINDERS-01 — additive booking reminder (Resend). Shown copy is the es-AR
// voseo formatReminderEsAR from packages/utils. Best-effort: any failure here
// is swallowed so it can never fail the confirm path (n8n stays canonical).
const reminderRowSchema = z.object({
  scheduled_at: z.string().datetime(),
  clients: z.object({ name: z.string().min(1), email: z.string().email() }).nullable(),
});

const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

/** Derive the es-AR "HH:mm" slot hour from a scheduled_at timestamptz. */
function appointmentHoraEsAR(scheduledAtIso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: ARGENTINA_TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(scheduledAtIso));
}

function readServiceEnv(): { url: string; serviceKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && serviceKey ? { url, serviceKey } : null;
}

type WebhookEvent = {
  effectiveTopic: string;
  action: string;
  /** Payment id from the body `data.id`, falling back to the `?data.id=` query param. */
  dataId: string;
  /** Dedup key for processed_events: `action|topic` + dataId (migration 0004). */
  eventKey: string;
};

type WebhookRead = { ok: true; event: WebhookEvent } | { ok: false; response: NextResponse };

/**
 * Step 1 — parse the payload and resolve the event identity.
 *
 * MP delivers the event identity both in the body (`data.id`) and as a URL
 * query param (`?data.id=...&type=payment`) — the official SDKs read
 * `req.query['data.id']` for signature validation. Prefer the body, fall
 * back to the query param, and derive the topic the same way. Non-payment
 * events (e.g. merchant_order chatter) are acked so MP stops retrying.
 */
async function readWebhookEvent(req: NextRequest): Promise<WebhookRead> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'invalid_json' }, { status: 400 }) };
  }

  const parsed = webhookBodySchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'invalid_payload' }, { status: 400 }),
    };
  }

  const topic = parsed.data.type ?? parsed.data.topic ?? '';
  const action = parsed.data.action ?? '';
  const bodyDataId = parsed.data.data?.id !== undefined ? String(parsed.data.data.id) : null;
  const queryDataId = req.nextUrl?.searchParams?.get('data.id') ?? null;
  const dataId = bodyDataId ?? queryDataId;
  const effectiveTopic = topic || req.nextUrl?.searchParams?.get('type') || '';

  const isPaymentEvent =
    effectiveTopic === 'payment' ||
    action.startsWith('payment.') ||
    effectiveTopic === 'merchant_order';
  if (!isPaymentEvent || !dataId) {
    // Ack non-payment events (e.g. merchant_order chatter) so MP stops retrying.
    return { ok: false, response: NextResponse.json({ received: true }) };
  }

  return {
    ok: true,
    event: {
      effectiveTopic,
      action,
      dataId,
      eventKey: `${action || effectiveTopic}:${dataId}`,
    },
  };
}

type PaymentLookup =
  | { ok: true; externalReference: string | null | undefined }
  | { ok: false; response: NextResponse };

/**
 * Step 3 — MP payment lookup (authoritative status; never trust the webhook
 * body alone). Only `approved` payments proceed to the confirm path;
 * pending/rejected/unknown are acked (nothing to confirm).
 */
async function fetchApprovedPayment(accessToken: string, dataId: string): Promise<PaymentLookup> {
  let payment;
  try {
    payment = await getMercadoPagoPayment(accessToken, dataId);
  } catch {
    // Transient MP API failure: 502 so MP retries with backoff.
    return {
      ok: false,
      response: NextResponse.json({ error: 'mp_lookup_failed' }, { status: 502 }),
    };
  }
  if (!payment || payment.status !== 'approved') {
    // Pending/rejected/unknown: ack, nothing to confirm.
    return {
      ok: false,
      response: NextResponse.json({ received: true, status: payment?.status ?? 'unknown' }),
    };
  }
  return { ok: true, externalReference: payment.external_reference };
}

/** Step 4 — the payment's external_reference must be a known booking uuid. */
function parseAppointmentId(externalReference: string | null | undefined): string | null {
  if (!externalReference || !uuidSchema.safeParse(externalReference).success) {
    return null;
  }
  return externalReference;
}

type EventClaim =
  | { outcome: 'claimed'; release: () => Promise<void> }
  | { outcome: 'duplicate'; response: NextResponse }
  | { outcome: 'failed'; response: NextResponse };

/**
 * Step 5 — persisted idempotency gate (migration 0004): claim the MP event
 * by its real event_key (`action|topic` + dataId). on-conflict-do-nothing is
 * atomic, so a replay of an already-processed event inserts 0 rows → the
 * caller acks and never touches appointments/notify again. Transient
 * failures before this point are NOT claimed, so MP's retry still runs the
 * full path. A failure AFTER a successful claim rolls the claim back
 * (best-effort delete) so MP's retry is not deduped away — otherwise a 500
 * here would strand the booking.
 */
async function claimProcessedEvent(client: SupabaseClient, eventKey: string): Promise<EventClaim> {
  const claim = await client
    .from('processed_events')
    // postgrest-js v2 has no `.insert().onConflict()` chain method —
    // `onConflict` is an upsert option (verified against the installed
    // postgrest-js 2.116.0 d.ts, 2026-09-17). ignoreDuplicates → DO NOTHING.
    .upsert(
      { event_key: eventKey, provider: 'mercadopago' },
      {
        onConflict: 'event_key',
        ignoreDuplicates: true,
      }
    )
    .select('event_key');
  if (claim.error) {
    return {
      outcome: 'failed',
      response: NextResponse.json({ error: 'dedup_failed' }, { status: 500 }),
    };
  }
  if (claim.data.length === 0) {
    return {
      outcome: 'duplicate',
      response: NextResponse.json({ received: true, duplicate: true }),
    };
  }

  // Roll back the claim if the confirm step fails, so MP's retry is not
  // deduped away and can run the full path again (otherwise a 500 here
  // would strand the booking: claimed but never confirmed).
  const release = async (): Promise<void> => {
    try {
      await client.from('processed_events').delete().eq('event_key', eventKey);
    } catch {
      // Best-effort: if the delete also fails the event stays claimed —
      // the status='pendiente' conditional UPDATE is still the second
      // idempotency layer, so a later retry is safe, just silent.
    }
  };
  return { outcome: 'claimed', release };
}

type Confirmation = { ok: true; count: number } | { ok: false };

/**
 * Step 6 — the idempotency second layer: the confirm UPDATE is conditional
 * on status='pendiente', so a replay that slipped past the claim updates 0
 * rows and notifies nothing.
 */
async function confirmAppointment(
  client: SupabaseClient,
  appointmentId: string
): Promise<Confirmation> {
  const { error, count } = await client
    .from('appointments')
    .update({ status: 'confirmado', confirmed_at: new Date().toISOString() }, { count: 'exact' })
    .eq('id', appointmentId)
    .eq('status', 'pendiente');

  if (error) {
    return { ok: false };
  }
  return { ok: true, count: count ?? 0 };
}

/**
 * Step 7 — notify only on a real pending→confirmed transition (retries stay
 * silent). The reminder (Resend) is ADDITIVE — n8n remains the canonical
 * confirmation path — and best-effort: it must never fail the confirm path.
 */
async function sendConfirmNotifications(
  client: SupabaseClient,
  appointmentId: string,
  paymentId: string
): Promise<void> {
  await notifyBookingConfirmed({
    event: 'booking.confirmed',
    appointmentId,
    paymentId,
  });
  try {
    const { data } = await client
      .from('appointments')
      .select('scheduled_at, clients ( name, email )')
      .eq('id', appointmentId)
      .single();
    const row = reminderRowSchema.parse(data);
    const { name, email } = row.clients ?? {};
    if (name && email) {
      await sendBookingReminder({
        to: email,
        nombre: name,
        hora: appointmentHoraEsAR(row.scheduled_at),
      });
    }
  } catch {
    // Best-effort: a reminder must never fail the webhook confirm path.
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const read = await readWebhookEvent(req);
  if (!read.ok) return read.response;

  const mpEnv = readMercadoPagoEnv();
  if (!mpEnv) {
    return NextResponse.json({ error: 'mp_not_configured' }, { status: 500 });
  }

  // Step 2 — HMAC-SHA256 verification on every call (x-signature / x-request-id).
  const signatureOk = verifyMercadoPagoSignature({
    secret: mpEnv.webhookSecret,
    signatureHeader: req.headers.get('x-signature'),
    requestIdHeader: req.headers.get('x-request-id'),
    dataId: read.event.dataId,
  });
  if (!signatureOk) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  const payment = await fetchApprovedPayment(mpEnv.accessToken, read.event.dataId);
  if (!payment.ok) return payment.response;

  const appointmentId = parseAppointmentId(payment.externalReference);
  if (appointmentId === null) {
    return NextResponse.json({ error: 'unknown_booking' }, { status: 200 });
  }

  const serviceEnv = readServiceEnv();
  if (!serviceEnv) {
    return NextResponse.json({ received: true, confirmed: false, reason: 'db_not_configured' });
  }

  const client = createClient(serviceEnv.url, serviceEnv.serviceKey);

  const claim = await claimProcessedEvent(client, read.event.eventKey);
  if (claim.outcome !== 'claimed') return claim.response;

  const confirmation = await confirmAppointment(client, appointmentId);
  if (!confirmation.ok) {
    await claim.release();
    return NextResponse.json({ error: 'confirm_failed' }, { status: 500 });
  }

  if (confirmation.count > 0) {
    await sendConfirmNotifications(client, appointmentId, read.event.dataId);
  }

  return NextResponse.json({ received: true, confirmed: confirmation.count > 0 });
}
