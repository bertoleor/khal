-- Khal — 0012 DOWN: reverts the auto-release sweeper.
--
-- Unschedules the pg_cron job and drops the helper function. The pg_cron
-- extension itself is LEFT ENABLED (other jobs may exist now or later;
-- dropping shared infrastructure from a feature rollback is out of scope).
--
-- DATA POLICY: rows already auto-released (status='cancelado' with
-- hold_released_at set) are NOT reverted. Every flipped row was genuinely
-- expired under the D2 rule; making one pendiente again would re-freeze a
-- slot that must stay bookable. Manual review only, with the pre-apply
-- backup captured on the fleet side 2026-10-22.
--
-- Downs never rewrite the ledger (0006/0007/0011 convention).

begin;

select cron.unschedule('khal-release-expired-holds');

drop function if exists public.release_expired_holds();

commit;
