-- ---------------------------------------------------------------------------
-- 17. processed_events.event_key — forward fix: NOT NULL + full unique index
-- (KHAL-F4 follow-up, kanban t_058bb58a)
-- ---------------------------------------------------------------------------
-- Context (live probe against prod, 2026-09-26/27):
--   Migration 0004 is already applied and registered in prod
--   (supabase_migrations.schema_migrations 0001..0004), so it is IMMUTABLE —
--   it cannot be edited. But as applied it left:
--     * event_key nullable
--     * a PARTIAL unique index:
--         unique index processed_events_event_key_key
--           on public.processed_events (event_key)
--           where event_key is not null
--   The MP webhook claims events with a bare `onConflict: 'event_key'`
--   (postgrest-js upsert). Postgres 42P10: a partial index CANNOT be inferred
--   as the arbiter for a bare ON CONFLICT (event_key) — every claim of an
--   approved payment fails with
--     ERROR 42P10: there is no unique or exclusion constraint matching the
--     ON CONFLICT specification
--   → HTTP 500 dedup_failed → Mercado Pago retries forever → no booking is
--   ever confirmed by the webhook.
--
-- Fix (forward-only, expand over 0004):
--   1. event_key SET NOT NULL — table is empty in prod (verified
--      n_live_tup = 0 / count(*) = 0), so this is an instant catalog change.
--      NOT NULL also makes a plain (non-partial) unique index valid.
--   2. DROP the partial index and CREATE a full unique index — a full unique
--      index IS inferable by bare ON CONFLICT (event_key), satisfying 42P10.
--
-- Rollback plan (documented, not automated): forward migration 0006 would
-- drop the full index, recreate the partial one and re-allow NULL. Not
-- needed: the column is only ever written by the webhook claim with a
-- non-null event_key.
--
-- Idempotency notes: guarded where cheap; this migration is expected to run
-- exactly once via supabase db push / the registered migrations table.

alter table public.processed_events
  alter column event_key set not null;

drop index public.processed_events_event_key_key;

create unique index processed_events_event_key_key
  on public.processed_events (event_key);
