import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // [KHAL-A8] REQUIRED on purpose: the booking form renders the Turnstile
  // widget with this key (KHAL-A4 wiring, booking-form.tsx). The schema
  // runs at boot via src/instrumentation.ts — a deploy missing it now
  // fails fast instead of rendering a keyless widget.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),

  // [KHAL-A8] REQUIRED: the MercadoPago webhook route reads it directly
  // (app/api/webhooks/mercadopago/route.ts) to write with elevated
  // privileges. Missing it at runtime must fail fast, not silently
  // return null and drop webhook confirmations.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // [KHAL-A8] Consumed by lib/mercadopago.ts (readMercadoPagoEnv) and
  // lib/notify.ts with null-fallbacks — payments/notifications degrade
  // to a friendly error, never a boot explosion. Optional for the same
  // reason as TURNSTILE_SECRET_KEY: dev boots without a payment
  // provider configured must still work.
  APP_URL: z.string().url().optional(),
  MP_ACCESS_TOKEN: z.string().min(1).optional(),
  MP_WEBHOOK_SECRET: z.string().min(1).optional(),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  UPSTASH_QSTASH_TOKEN: z.string().optional(),
  N8N_WEBHOOK_URL: z.string().url().optional(),
  N8N_WEBHOOK_SECRET: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  // [KHAL-A4/A8 cross-ref] OPTIONAL on purpose: server-side Turnstile
  // verification (lib/security/turnstile.ts) fails CLOSED without it —
  // createBooking rejects with captcha_failed. A parse-time explosion
  // would kill the whole app boot. Pinned by booking-antibot.test.ts
  // ("env consumption contract") and env-contract.test.ts.
  TURNSTILE_SECRET_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment variables:\n${missing}\n\nExpected format: set each variable in .env.local`
    );
  }
  return result.data;
}

export const env = parseEnv();
