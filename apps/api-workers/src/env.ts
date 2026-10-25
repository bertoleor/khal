import { z } from 'zod';

export const workerEnvSchema = z.object({
  N8N_WEBHOOK_URL: z.url(),
  N8N_WEBHOOK_SECRET: z.string().min(1).optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1).optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1).optional(),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

// ENV-01 — validate at worker boot; refuse to start with missing/malformed vars.
export function loadWorkerEnv(source: NodeJS.ProcessEnv = process.env): WorkerEnv {
  return workerEnvSchema.parse(source);
}
