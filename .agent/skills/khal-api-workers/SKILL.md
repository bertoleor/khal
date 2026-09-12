---
name: khal-api-workers
description: >
  Use when touching apps/api-workers — the async dispatch layer. Circuit breaker
  (RESILIENCIA-01), webhook HMAC signature + idempotency (WEBHOOKS-01), and
  Zod-boot env validation (ENV-01) for QStash/Telegram/N8N.
metadata:
  author: khal
  version: "0.1.0"
---

# Khal api-workers

`apps/api-workers` is a pure TS library (no runtime) exporting resilience and
integration primitives from `src/index.ts`. It's async *dispatch* glue for
n8n/Telegram/QStash — no UI, no DB access (the DB layer stays in the packages).

## Circuit breaker (`src/circuit-breaker.ts`, RESILIENCIA-01) — MUST

```ts
export type CircuitState = "closed" | "open" | "half_open";
interface CircuitBreakerOptions { failureThreshold: number; openMs: number; }
```
Contract:
- Opens after `failureThreshold` consecutive failures.
- While `open`, `canAttempt()` returns `false` (fail fast); after `openMs` elapses
  it transitions to `half_open` and allows one probe.
- `recordSuccess()` resets failures and returns to `closed`;
  `recordFailure()` from `half_open` or at threshold re-opens.
- **Time is injectable** — the constructor takes `now: () => number = Date.now`.
  This is deliberate so tests stay deterministic. 🚫 never call `Date.now()`
  directly where the breaker already injects `now`; pass a fake clock in tests.
- In production, persist intent `status='pending_retry'` when a call fails open
  (RESILIENCIA-01) rather than dropping the work.

## Webhook integrity (`src/webhook.ts`, WEBHOOKS-01)

1. **HMAC-SHA256, constant-time** — `isValidSignature(payload, signature, secret)`:
   `createHmac("sha256", secret)` + `timingSafeEqual`. 🚫 never compare signatures
   with `===` (timing side-channel); guard length mismatch with an early `false`
   before `timingSafeEqual`. This is the only path allowed to return non-200.
2. **Idempotency (layer 1)** — the `EventDeduplicator` keyed by `event_id`
   documents the contract (`isDuplicate`); the persisted form is the
   `processed_events` table (PK `event_id`). 🚫 never re-apply an event already
   processed.
3. **Dead-letter (layer 2)** — failed inbound events land in `failed_webhooks_log`
   with `retry_count`, never silently dropped.

## Environment (`src/env.ts`, ENV-01)

`workerEnvSchema` (Zod) at boot; `loadWorkerEnv` calls `.parse` → **refuse to
start** on missing/malformed vars. Keys: `N8N_WEBHOOK_URL` (required), optional
`N8N_WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
`QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`.
🚫 never read `process.env.FOO` inline next to logic — funnel through
`loadWorkerEnv` once and thread the typed `WorkerEnv`.

## Conventions

- Signatures/precedence come from `supabase/migrations/0001_initial_schema.sql`
  (`processed_events`, `failed_webhooks_log`, `security_logs`) and design.md §5.
- Tests live beside the domain in `apps/api-workers/test/` (circuit-breaker +
  webhook) and MUST stay green after edits.
- Resilience/security invariants carry their convention id in a leading comment
  (e.g. `// WEBHOOKS-01 layer 3 — ...`), per CQ-02 (reason comments only).