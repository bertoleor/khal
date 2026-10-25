import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [T-F2.5 — confirmación/estado screen] Contract tests for migration 0015 —
 * the clienta-facing booking status RPC.
 *
 * appointments has NO anon select policy (0001: "no anon; members read
 * org-scoped; writes via definer fn") — bookings are private by design. The
 * revisitable estado screen therefore needs a capability-token door: the
 * clienta holds the booking UUID (returned at booking time), and the RPC
 * returns ONLY public-safe status fields for it. No PII ever crosses this
 * door (no name, no phone, no email — the 0003 P0 family stays sealed).
 */
const repoRoot = resolve(__dirname, '../../..');
const migPath = resolve(repoRoot, 'supabase/migrations/0015_get_booking_status.sql');
const downPath = resolve(repoRoot, 'supabase/migrations/0015_get_booking_status.down.sql');

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

describe('migration 0015 — get_booking_status RPC (T-F2.5 estado door)', () => {
  it('exists with a rollback file (DBA gate)', () => {
    expect(existsSync(migPath), '0015 sql missing').toBe(true);
    expect(existsSync(downPath), '0015 down.sql missing').toBe(true);
  });

  it('is a SECURITY DEFINER with the 0006 search_path discipline', () => {
    const mig = read(migPath);
    expect(mig).toContain('security definer');
    expect(mig).toMatch(/set search_path\s*=\s*public,\s*extensions/);
  });

  it('returns ONLY public-safe status fields — zero PII', () => {
    const mig = read(migPath);
    expect(mig).toContain("'service_name'");
    expect(mig).toContain("'scheduled_at'");
    expect(mig).toContain("'hold_expires_at'");
    expect(mig).toContain("'status'");
    // The PII family (0003) must never cross this door.
    expect(mig).not.toMatch(/phone/i);
    expect(mig).not.toMatch(/client_name|'name'|"name"|p_name/i);
    expect(mig).not.toMatch(/email/i);
    expect(mig).not.toMatch(/ip_hash/i);
  });

  it('answers not_found for an unknown booking (never leaks existence)', () => {
    const mig = read(migPath);
    expect(mig).toContain("'not_found'");
    // Soft-deleted rows are invisible too.
    expect(mig).toContain('deleted_at is null');
  });

  it('ACL: anon-only capability door (revoke public+authenticated)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(
      /revoke all on function public\.get_booking_status\(uuid\) from public, authenticated/
    );
    expect(mig).toMatch(/grant execute on function public\.get_booking_status\(uuid\) to anon/);
  });

  it('records itself in supabase_migrations.schema_migrations (idempotent)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/insert into supabase_migrations\.schema_migrations/);
    expect(mig).toContain("'0015'");
    const guarded = /on conflict .*do nothing/.test(mig) || /if not exists/.test(mig);
    expect(guarded, 'history insert must be conflict-guarded').toBe(true);
  });

  it('down.sql drops the RPC; no data policy, no ledger writes', () => {
    const down = read(downPath);
    expect(down).toMatch(/drop function if exists public\.get_booking_status\(uuid\)/);
    expect(down).not.toMatch(/insert into supabase_migrations/);
    expect(down).not.toMatch(/delete from supabase_migrations/);
    expect(down).not.toMatch(/update\s+public\.appointments/i);
  });
});
