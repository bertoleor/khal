-- ---------------------------------------------------------------------------
-- 16. processed_events.event_key — webhook idempotency by MP event (KHAL-F4)
-- ---------------------------------------------------------------------------
-- MP sends numeric payment ids (e.g. "1234567890") as the webhook data.id.
-- The original processed_events PK is `event_id uuid`, which those ids cannot
-- satisfy. This migration adds a text `event_key` column with its own unique
-- constraint, so the webhook can dedupe MP retries on the real event identity
-- instead of a synthetic uuid. `event_id` gets a default generator so inserts
-- that only supply `event_key` still satisfy the (now secondary) PK.
alter table public.processed_events
  alter column event_id set default gen_random_uuid();

alter table public.processed_events
  add column event_key text;

-- Unique so `insert ... on conflict (event_key) do nothing` is the dedupe gate.
create unique index processed_events_event_key_key
  on public.processed_events (event_key)
  where event_key is not null;