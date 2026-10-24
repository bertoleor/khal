import { z } from 'zod';

// Post-booking notification fan-out (G3). Email infra = the existing n8n
// webhook (N8N_WEBHOOK_URL / N8N_WEBHOOK_SECRET, already in .env.example).
// No-op when unconfigured — "notify by email if infra exists".

const notifyPayloadSchema = z.object({
  event: z.string(),
  appointmentId: z.uuid(),
  paymentId: z.string(),
});

export type BookingNotifyPayload = z.infer<typeof notifyPayloadSchema>;

export async function notifyBookingConfirmed(payload: BookingNotifyPayload): Promise<boolean> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    return false;
  }
  const secret = process.env.N8N_WEBHOOK_SECRET;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-webhook-secret': secret } : {}),
      },
      body: JSON.stringify(notifyPayloadSchema.parse(payload)),
    });
    return response.ok;
  } catch {
    // Notification must never fail the webhook confirmation path.
    return false;
  }
}
