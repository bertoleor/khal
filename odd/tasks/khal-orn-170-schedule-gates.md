> Parte de: [[INDICE-SISTEMA]] · Relacionados: [[docs/API-GUIDE]], [[docs/audits/rls-verify-khal-2026-10-07]]

# ODD Feature — khal-orn-170-schedule-gates

> **Búsqueda:** keywords: `khal, orn-170, create_booking, business_hours, provider_schedules, schedule-gate, migration-0007, security-definer, unavailable` · clasificación: `odd-feature` · estado: `closed` · actualizado: 2026-10-16

## Objective
`create_booking` now rejects any slot whose full block does not fit the effective opening window: active `provider_schedules` rows override `business_hours` for the provider, `business_hours` is the org fallback, no window for the weekday means closed — closing audit finding H1 (P2, 2026-10-07).

## Problem / Why
Live audit 2026-10-07 (`docs/audits/rls-verify-khal-2026-10-07.md` §5 probe E, §6 H1): migration 0003 validated service/provider/slot-future/idempotency/blacklist/duplicate/overlap/calendar_exceptions but NEVER the opening window — an anonymous PostgREST call booked a 03:00 slot with `ok=true` while the org opens Mon-Sat 09:00-18:00. The RPC is the last server-side defense (frontend availability is read-only UX), so the gap had to close in the database.

## Scope
- In: migration `0007_create_booking_schedule_gates.sql` (+ `.down.sql`) adding the schedule-window gate as step 9b of `create_booking`; textual TDD contract in `apps/web/test/seed-contract.test.ts`; live apply + probe matrix; contract docs.
- Out: anon grants hardening (H2 — applied separately as 0009 from a loop branch); frontend schedule mock swap (CQ-04); action/i18n/E2E stub/specs (untouched — the reject reuses the existing `unavailable` code, D1).

## Constraints
- Production DB (ref `epykihchzlbbptrvvawg`) — probes may only INSERT test rows and DELETE exactly those rows by id.
- The replacement MUST keep `set search_path = public, extensions` (0006 P0 lesson: losing it re-breaks `digest()` with 42883).
- Gate semantics fixed by orchestrator decisions D1-D6 (ticket t_5d35e39c): reject code `unavailable`; provider_schedules→business_hours fallback; full-block fit `[slot, slot+duration+buffer)` inside `[open, close)` mirroring `computeAvailableSlots` (SCH-01/SCH-02); weekday `extract(dow from p_date)` (0=Sun..6=Sat); minute-of-day comparison `extract(epoch from <time>)/60` (never `::time` casts of the block end); gate placed between calendar_exceptions (9) and the client upsert (10).

## Tasks (stable IDs)
- [x] T1: RED — extend `apps/web/test/seed-contract.test.ts` with the 0007 textual contract (10 asserts) and capture the failing run.
  - evidence: `reports/tdd-red-0007-schedule-gates.log` (10 failed | 10 passed, EXIT=1)
- [x] T2: Write `supabase/migrations/0007_create_booking_schedule_gates.sql` + `.down.sql` (full-body `create or replace`, gate step 9b, search_path pinned, 0003 ACL block repeated, ledger insert `on conflict do nothing`).
- [x] T3: GREEN — same suite green, full repo suite green.
  - evidence: `reports/tdd-green-0007-schedule-gates.log` (20/20, EXIT=0); `pnpm test` 26 files / 149 tests passed; `pnpm run typecheck` 8/8 tasks.
- [x] T4: Apply to the live DB via Management API (atomic `begin..commit`).
  - evidence: apply response `[]`; ledger now `0001..0007` + `0009`; `pg_get_functiondef` renders `SET search_path TO 'public', 'extensions'` and contains the gate; grants anon/authenticated/service_role EXECUTE intact.
- [x] T5: Live probe matrix (D9) via PostgREST with the real anon JWT — all PASS, cleanup verified.
  - evidence: `reports/probes-live-0007-schedule-gates.log` (EXIT=0) — 03:00 → `unavailable` (H1 replay receipt), 10:00 → ok + idempotent replay same booking_id, Sunday → `unavailable`, 17:00 (ends 18:15) → `unavailable`, 16:45 (ends exactly 18:00) → ok, provider_schedules override 10:00-14:00 rejects 16:00 / accepts 11:00 then row deleted returning; final counts appointments/clients/provider_schedules = 0/0/0.
- [x] T6: Docs — `docs/API-GUIDE.md` §2 `unavailable` semantics extended; this ODD doc.
- [x] T7: Commit on main + push + `gentle-ai review assess` transition.
  - evidence: feature commit `a90a53a` on `origin/main` (this doc rides a follow-up docs commit); assess output in the task review handoff.

## Accumulated evidence
- 2026-10-16: expressions validated live BEFORE writing SQL — `extract(epoch from time '09:00')/60 = 540.0`, `extract(dow from date '2026-10-18') = 0` (numeric, PG 17.6).
- 2026-10-16: apply verified — ledger `0007` present; functiondef contains `provider_schedules`, `business_hours`, `extract(dow from p_date)`, `extract(epoch from`, `v_block_end`; `proconfig search_path=public, extensions`; len(def) 7108 → 9557.
- 2026-10-16: probe matrix all-PASS with exact cleanup (3 appointments + 3 clients deleted by id returning; baseline 0/0/0 restored).
- Prior art evaluated per orchestrator comment: branch `khal/t_fd62d6ba-business-hours-guard` commit `6b1e8dd` (business_hours-only guard, gate before calendar_exceptions, `::time` comparison) was NOT reusable as-is — reworked to the fixed D2/D4/D6 semantics instead; that branch's `0007_business_hours_guard.sql` was never applied to the live DB (ledger had no 0007 before this run).

## Accepted changes and rationale
- Provider-override semantics chosen over the branch's org-only guard: `provider_schedules` rows for the provider+weekday override `business_hours` (D2) — matches the admin model where a provider can have restricted days.
- Minute-of-day arithmetic (`extract(epoch from <time>)/60`) instead of `::time` casts: a `::time` cast of the block end wraps at 24:00 and mis-compares late blocks (D4).
- Gate AFTER calendar_exceptions (D6): both need the resolved provider/window; keeps the H1 fix adjacent to its sibling exclusion.
- Ledger row `0007` inserted alongside existing `0009` (applied earlier from a loop branch): versions are a registry, not a sequence; insert is idempotent.

## Next step
- None — feature closed. Follow-ups out of scope: H2 grants hardening reconciliation between main and the live DB (0009 exists in the DB, not in main).

## Progress
- 2026-10-16: full cycle RED→GREEN→apply→probes→cleanup→docs in one session (06-dba, ticket t_5d35e39c, Linear ORN-170). Commit on main + review assess pending at doc-write time — hashes appended in T7 evidence at commit time.
