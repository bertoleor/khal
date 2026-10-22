import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [D2 — owner rule 2026-10-20] Contract tests for migration 0011 —
 * booking hold TTL 15 minutes -> 12 hours.
 *
 * Business rule (owner, chat 2026-10-20, odd/tasks/khal-ux-skeletons-v2.md D2):
 * the slot stays HELD for 12 HOURS as "pendiente de confirmacion"
 * ("para que no haya malentendidos"); after 12h without a comprobante it
 * auto-releases. Current code evidence: 0007_create_booking_schedule_gates.sql:323
 * sets hold_expires_at = now() + interval '15 minutes' — the pre-D2 v1 window.
 *
 * The appointments table (0001:149-150) already carries hold_expires_at +
 * hold_released_at, and the overlap probe (0007) already treats an expired
 * pendiente hold as a free slot — so the TTL literal is the ONLY behavioral
 * change. Full-body function replacement, the same pattern as 0007.
 *
 * Why a file-contract test: the unit suite never touches the live DB
 * (E2E stubs Supabase), so the migration file itself is the test surface —
 * the established pattern of migration-0004/0006 contract tests.
 */
const repoRoot = resolve(__dirname, '../../..');
const migPath = resolve(repoRoot, 'supabase/migrations/0011_booking_hold_ttl_12h.sql');
const downPath = resolve(repoRoot, 'supabase/migrations/0011_booking_hold_ttl_12h.down.sql');
const prevPath = resolve(repoRoot, 'supabase/migrations/0007_create_booking_schedule_gates.sql');

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

describe('migration 0011 — booking hold TTL 15min -> 12h (owner rule D2)', () => {
  it('exists with a rollback file (DBA gate: migration without down.sql is blocked)', () => {
    expect(existsSync(migPath), '0011 sql missing').toBe(true);
    expect(existsSync(downPath), '0011 down.sql missing').toBe(true);
  });

  it('replaces the exact create_booking signature (full-body replacement, 0007 pattern)', () => {
    const mig = read(migPath);
    expect(mig).toContain('create or replace function public.create_booking(');
    expect(mig).toContain('uuid, text, text, text, date, integer, uuid, text');
  });

  it('holds the slot for 12 hours, never 15 minutes', () => {
    const mig = read(migPath);
    expect(mig).toContain("now() + interval '12 hours'");
    // The pre-D2 v1 window must be gone as a TTL assignment. Comments may
    // still cite the old literal as history (the 0006 contract test applies
    // the same comment-vs-behavior nuance).
    expect(mig).not.toMatch(/now\(\)\s*\+\s*interval '15 minutes'/);
  });

  it('keeps the 0006 search_path fix and the 0007 schedule gates (no regression)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/set search_path\s*=\s*public,\s*extensions/);
    expect(mig).toContain('provider_schedules');
    expect(mig).toContain('business_hours');
    expect(mig).toContain('calendar_exceptions');
    // Losing digest() re-breaks the 0006 P0 (phone/ip hashing).
    expect(mig).toContain('digest(');
  });

  it('preserves the ACL block (revoke from public + grant anon, authenticated, service_role)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/revoke all on function public\.create_booking/);
    expect(mig).toContain(
      'grant execute on function public.create_booking(uuid, text, text, text, date, integer, uuid, text) to anon, authenticated, service_role'
    );
  });

  it('down.sql restores the 15-minute TTL body that 0011 replaces', () => {
    const down = read(downPath);
    expect(down).toContain('create or replace function public.create_booking(');
    expect(down).toContain("interval '15 minutes'");
    // The down must NOT carry the new rule forward.
    expect(down).not.toContain("interval '12 hours'");
  });

  it('records itself in supabase_migrations.schema_migrations (0001-0010 convention)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/insert into supabase_migrations\.schema_migrations/);
    expect(mig).toContain("'0011'");
  });

  it('is idempotent (safe to re-run against a drifted database)', () => {
    const mig = read(migPath);
    // Either on conflict do nothing on the history insert, or not exists guard.
    const guarded = /on conflict .*do nothing/.test(mig) || /if not exists/.test(mig);
    expect(guarded, 'history insert must be conflict-guarded').toBe(true);
  });

  it('stays byte-anchored to the 0007 body outside the TTL change (no accidental drift)', () => {
    const mig = read(migPath);
    const prev = read(prevPath);
    // Same step markers must survive the copy: the D2 change touches ONLY
    // the TTL literal, the header and the ledger version.
    for (const marker of ['overlap', 'idempotency_key', 'phone_hash', 'deposit_mode']) {
      expect(mig).toContain(marker);
      expect(prev).toContain(marker);
    }
  });
});
