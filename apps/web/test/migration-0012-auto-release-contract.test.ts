import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [D2 — owner rule 2026-10-20, second half] Contract tests for migration 0012 —
 * auto-release of expired booking holds.
 *
 * Business rule: after 12h (D2, migration 0011) without a comprobante the
 * expired hold auto-releases. Live probe evidence (2026-10-22, Management API
 * against ref epykihchzlbbptrvvawg): pg_cron NOT installed yet, appointments
 * 0 rows, live enum appointment_status = (pendiente, confirmado, cancelado,
 * no_asistio).
 *
 * Design decision (pinned by these tests): released rows become
 * status='cancelado' + hold_released_at=now() — NO enum surgery. Postgres
 * cannot drop enum values (ALTER TYPE ADD VALUE is effectively irreversible),
 * so the D4 'liberada' state machine lands with the admin phase (F3/F4) where
 * its real consumers exist. The 0007 overlap probe already treats expired
 * pendiente holds as free for NEW bookings; this job makes the ROW STATE
 * honest for the panel.
 *
 * Mechanism: pg_cron job every 10 minutes calling a dedicated helper
 * function — reusable manually (service_role) and by the admin phase later.
 */
const repoRoot = resolve(__dirname, '../../..');
const migPath = resolve(repoRoot, 'supabase/migrations/0012_auto_release_expired_holds.sql');
const downPath = resolve(repoRoot, 'supabase/migrations/0012_auto_release_expired_holds.down.sql');

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

describe('migration 0012 — auto-release expired holds (owner rule D2)', () => {
  it('exists with a rollback file (DBA gate: migration without down.sql is blocked)', () => {
    expect(existsSync(migPath), '0012 sql missing').toBe(true);
    expect(existsSync(downPath), '0012 down.sql missing').toBe(true);
  });

  it('creates the helper function with the 0006 search_path discipline', () => {
    const mig = read(migPath);
    expect(mig).toContain('create or replace function public.release_expired_holds()');
    expect(mig).toMatch(/set search_path\s*=\s*public,\s*extensions/);
  });

  it('releases ONLY expired pendiente holds that were never released', () => {
    const mig = read(migPath);
    // Guard set: all three conditions must gate the UPDATE.
    expect(mig).toContain("status = 'pendiente'");
    expect(mig).toContain('hold_expires_at <= now()');
    expect(mig).toContain('hold_released_at is null');
    expect(mig).toContain('deleted_at is null');
  });

  it('marks released rows as cancelado + hold_released_at (no enum surgery)', () => {
    const mig = read(migPath);
    expect(mig).toContain("set status = 'cancelado'");
    expect(mig).toContain('hold_released_at = now()');
    // Postgres cannot drop enum values — adding 'liberada' now would be an
    // irreversible change; the D4 state machine lands with the admin phase.
    expect(mig).not.toMatch(/alter\s+type/i);
    expect(mig).not.toMatch(/add\s+value/i);
  });

  it('enables pg_cron idempotently and schedules the sweep every 10 minutes', () => {
    const mig = read(migPath);
    expect(mig).toContain('create extension if not exists pg_cron');
    expect(mig).toContain('cron.schedule');
    expect(mig).toContain("'khal-release-expired-holds'");
    expect(mig).toContain("'*/10 * * * *'");
    // The job must call the helper, not inline a second copy of the UPDATE.
    expect(mig).toContain('public.release_expired_holds()');
  });

  it('locks the helper down: revoke PUBLIC + anon + authenticated (Supabase default privileges), grant service_role', () => {
    const mig = read(migPath);
    // Live evidence 2026-10-22: revoking PUBLIC alone left anon+authenticated
    // with EXECUTE (Supabase ALTER DEFAULT PRIVILEGES on public functions).
    expect(mig).toMatch(
      /revoke all on function public\.release_expired_holds\(\) from public, anon, authenticated/
    );
    expect(mig).toMatch(
      /grant execute on function public\.release_expired_holds\(\) to service_role/
    );
  });

  it('records itself in supabase_migrations.schema_migrations (idempotent)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/insert into supabase_migrations\.schema_migrations/);
    expect(mig).toContain("'0012'");
    const guarded = /on conflict .*do nothing/.test(mig) || /if not exists/.test(mig);
    expect(guarded, 'history insert must be conflict-guarded').toBe(true);
  });

  it('down.sql unschedules and drops the helper — never resurrects expired holds', () => {
    const down = read(downPath);
    expect(down).toContain('cron.unschedule');
    expect(down).toContain("'khal-release-expired-holds'");
    expect(down).toMatch(/drop function if exists public\.release_expired_holds\(\)/);
    // DATA POLICY: every row the job flipped was genuinely expired by the D2
    // rule — the down must NOT set them back to pendiente (that would
    // re-freeze slots that must stay free).
    expect(down).not.toMatch(/set\s+status\s*=\s*'pendiente'/i);
    // Downs never rewrite the ledger (0006/0007/0011 convention).
    expect(down).not.toMatch(/insert into supabase_migrations/);
    expect(down).not.toMatch(/delete from supabase_migrations/);
  });
});
