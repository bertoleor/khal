import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [KHAL-A3 / t_fd62d6ba] Contract tests for migration 0007 — business_hours
 * guard on create_booking.
 *
 * Audit evidence (auditoria-khal-2026-10-02.md §2-A3): migration 0003
 * validates overlap (step 8) and calendar_exceptions (step 9), but NEVER
 * checks business_hours. With an anonymous PostgREST grant, a booking at
 * 03:00 on Sunday sails through the only entrypoint the UI/proxy will use
 * after A2 swaps the mock availability for real data.
 *
 * Fix: a new step right before the calendar_exceptions probe rejects the
 * slot with code 'unavailable' when the org has no business_hours row that
 * covers [open_time, close_time) on the requested day_of_week in the org
 * timezone. Same surface as the existing calendar_exceptions path so the
 * UI keeps one "unavailable" rendering branch.
 *
 * Day-of-week convention: Postgres `extract(isodow from …)` returns 1..7
 * (Mon..Sun) while business_hours.day_of_week is 0..6 (Sun..Sat, matching
 * JS `Date#getUTCDay`). The migration MUST bridge the two — subtracting 1
 * modulo 7 — and document the convention.
 *
 * Timezone: business_hours uses the org's local wall-clock (same as
 * p_slot_start_minutes at step 3), so the comparison is local-to-local and
 * NOT a timestamptz overlap. We compute the slot's local time range and
 * check that [slot_start, slot_end) is fully contained in [open, close).
 */
const repoRoot = resolve(__dirname, '../../..');
const migPath = resolve(repoRoot, 'supabase/migrations/0007_business_hours_guard.sql');
const downPath = resolve(repoRoot, 'supabase/migrations/0007_business_hours_guard.down.sql');

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

describe('migration 0007 — business_hours guard on create_booking', () => {
  it('exists with a rollback file (DBA gate: migration without down.sql is blocked)', () => {
    expect(existsSync(migPath), '0007 sql missing').toBe(true);
    expect(existsSync(downPath), '0007 down.sql missing').toBe(true);
  });

  it('redefines create_booking with the exact 0003 signature (no new params)', () => {
    const mig = read(migPath);
    expect(mig).toContain('create or replace function public.create_booking(');
    // The 0003 signature (p_service_id uuid, p_name text, p_phone text,
    // p_email text, p_date date, p_slot_start_minutes integer,
    // p_idempotency_key uuid, p_client_ip text) must be preserved 1:1 — a
    // drift re-names args and PostgREST rejects callers that use named params.
    expect(mig).toMatch(/p_service_id\s+uuid/);
    expect(mig).toMatch(/p_name\s+text/);
    expect(mig).toMatch(/p_phone\s+text/);
    expect(mig).toMatch(/p_email\s+text/);
    expect(mig).toMatch(/p_date\s+date/);
    expect(mig).toMatch(/p_slot_start_minutes\s+integer/);
    expect(mig).toMatch(/p_idempotency_key\s+uuid\s+default\s+null/);
    expect(mig).toMatch(/p_client_ip\s+text\s+default\s+null/);
  });

  it('queries public.business_hours for the resolved organization', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/from\s+public\.business_hours/i);
    expect(mig).toMatch(/organization_id\s*=\s*v_org_id/);
  });

  it('bridges isodow (1..7 Mon..Sun) → business_hours.day_of_week (0..6 Sun..Sat)', () => {
    const mig = read(migPath);
    // Explicit isodow extract required — bare extract(dow …) uses a different
    // base than the schema comment in 0001 (day_of_week between 0 and 6,
    // seeded L-Sáb 09:00-18:00) and silently breaks Sunday bookings.
    expect(mig).toMatch(/extract\s*\(\s*isodow\s+from/i);
  });

  it('rejects out-of-hours slots with code unavailable (same surface as SCH-03)', () => {
    const mig = read(migPath);
    // The guard must return 'unavailable' so the UI keeps ONE rendering
    // branch for both calendar_exceptions and business_hours rejections.
    const unavailableHits = (mig.match(/'unavailable'/g) ?? []).length;
    expect(
      unavailableHits,
      'expected at least two unavailable returns (calendar_exceptions + business_hours)'
    ).toBeGreaterThanOrEqual(2);
  });

  it('scopes the check to rows for the resolved organization and soft-delete aware', () => {
    const mig = read(migPath);
    // 0001 declares deleted_at on business_hours; a deleted row must not
    // re-open or re-close the agenda.
    expect(mig).toMatch(/business_hours[\s\S]*?deleted_at\s+is\s+null/i);
  });

  it('contains the slot [start, start+duration+buffer) inside [open_time, close_time)', () => {
    const mig = read(migPath);
    // We must compare LOCAL times, not timestamptz, against the
    // business_hours time columns — otherwise DST and tz conversion leak.
    expect(mig).toMatch(/open_time/);
    expect(mig).toMatch(/close_time/);
  });

  it('down.sql restores the 0006 definition (former create_booking without this guard)', () => {
    const down = read(downPath);
    expect(down).toContain('create or replace function public.create_booking(');
    // Rollback must NOT keep the business_hours probe — the function body in
    // the down file is a verbatim copy of the pre-0007 body.
    expect(down).not.toMatch(/from\s+public\.business_hours/i);
  });

  it('records itself in supabase_migrations.schema_migrations (matches 0001-0006 convention)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/insert into supabase_migrations\.schema_migrations/);
    expect(mig).toContain("'0007'");
  });

  it('is idempotent (safe to re-run against a drifted database)', () => {
    const mig = read(migPath);
    const guarded = /on conflict .* do nothing/.test(mig) || /if not exists/.test(mig);
    expect(guarded, 'history insert must be conflict-guarded').toBe(true);
  });

  it('keeps search_path = public, extensions (pgcrypto resolution per 0006)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/set search_path\s*=\s*public,\s*extensions/);
  });

  it('documents the day-of-week convention in the migration header', () => {
    const mig = read(migPath);
    // The header must call out the 1..7 vs 0..6 bridge so the next reader
    // doesn't "simplify" the extract() and break Sunday bookings.
    expect(mig).toMatch(/isodow/i);
    expect(mig).toMatch(/day_of_week/i);
  });
});
