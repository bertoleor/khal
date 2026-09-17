import { formatReminderEsAR } from '@khal/utils';
import { Resend } from 'resend';

// REMINDERS-01 — booking reminder email sent via Resend, using the es-AR
// voseo copy (formatReminderEsAR). Mirrors notify.ts: no-op when unconfigured
// so a missing RESEND_API_KEY never fails the booking confirmation path. The
// UI live-region role stays REMINDER_LIVE_ROLE ('status', never 'alert').
//
// Trigger decision (card KHAL-F4/t_317211f1): wired additively on MP payment
// confirmation (apps/web/src/app/api/webhooks/mercadopago/route.ts). The
// scheduled near-appointment delivery is the production target — a QStash
// worker whose topology + endpoint contract is owned by the SRE coordinator
// card (03-sre). TODO(scheduler): consume that worker endpoint once it exists.

export interface ReminderEmailParams {
  to: string;
  nombre: string;
  /** "HH:mm" 24h, e.g. "18:30". */
  hora: string;
}

function readReminderEnv(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return null;
  }
  return { apiKey, from };
}

export async function sendBookingReminder({
  to,
  nombre,
  hora,
}: ReminderEmailParams): Promise<boolean> {
  const env = readReminderEnv();
  if (!env) {
    return false; // unconfigured → no-op, like notify.ts
  }
  try {
    const resend = new Resend(env.apiKey);
    const { data, error } = await resend.emails.send({
      from: env.from,
      to: [to],
      subject: `Recordatorio de reserva — ${hora}`,
      text: formatReminderEsAR({ nombre, hora }),
    });
    if (error) {
      return false;
    }
    return data?.id != null;
  } catch {
    // A reminder must never fail the booking confirmation path.
    return false;
  }
}
