-- Khal — 0015 DOWN: removes the estado door. No data is touched — the RPC
-- only ever read public-safe fields; the appointments rows are untouched.
-- Downs never rewrite the ledger (0006/0007/0011-0014 convention).

begin;

drop function if exists public.get_booking_status(uuid);

commit;
