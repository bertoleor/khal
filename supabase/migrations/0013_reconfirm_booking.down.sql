-- Khal — 0013 DOWN: removes the manual re-confirm capability.
--
-- Rows the dueña already re-confirmed KEEP their confirmed state: this down
-- only drops the RPC, it never rewrites booking data (the same data policy
-- as 0012 down). Downs never rewrite the ledger (0006/0007/0011/0012
-- convention).

begin;

drop function if exists public.reconfirm_booking(uuid);

commit;
