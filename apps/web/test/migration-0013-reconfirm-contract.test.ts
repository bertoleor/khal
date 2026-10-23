import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [D2 — owner rule 2026-10-20, third piece] Contract tests for migration 0013 —
 * manual re-confirm of a late comprobante.
 *
 * Business rule: after the 12h hold auto-released (0011 TTL + 0012 sweeper),
 * the dueña can re-confirm the booking manually if the comprobante arrived
 * late AND the slot is still free. This is the backend; the admin panel
 * button lands with F3 and calls this RPC with the dueña's panel session
 * (app_metadata role 'admin' — the same marker the 0001 RLS policies use).
 *
 * Authorization pattern from the repo itself: public.org_role() (0001:365)
 * and current_role()/authenticated grants (0002). Supabase default-privilege
 * lesson from 0012: new public-schema functions get EXECUTE for the API
 * roles, so anon is revoked explicitly.
 */
const repoRoot = resolve(__dirname, '../../..');
const migPath = resolve(repoRoot, 'supabase/migrations/0013_reconfirm_booking.sql');
const downPath = resolve(repoRoot, 'supabase/migrations/0013_reconfirm_booking.down.sql');

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

describe('migration 0013 — manual re-confirm of a late comprobante (D2)', () => {
  it('exists with a rollback file (DBA gate: migration without down.sql is blocked)', () => {
    expect(existsSync(migPath), '0013 sql missing').toBe(true);
    expect(existsSync(downPath), '0013 down.sql missing').toBe(true);
  });

  it('creates the RPC with the 0006 search_path discipline, returning jsonb', () => {
    const mig = read(migPath);
    expect(mig).toContain('create or replace function public.reconfirm_booking(');
    expect(mig).toContain('p_appointment_id uuid');
    expect(mig).toContain('returns jsonb');
    expect(mig).toMatch(/set search_path\s*=\s*public,\s*extensions/);
  });

  it('authorizes FIRST: org admin only, before the appointment is even loaded', () => {
    const mig = read(migPath);
    expect(mig).toContain("coalesce(public.org_role(), '') <> 'admin'");
    expect(mig).toContain("'forbidden'");
    // Gate-before-load order: an unauthorized caller must learn nothing, not
    // even whether an id exists.
    expect(mig.indexOf('forbidden')).toBeGreaterThan(-1);
    expect(mig.indexOf('forbidden')).toBeLessThan(mig.indexOf("'not_found'"));
  });

  it('re-confirms ONLY sweeper-released rows (cancelado with a release mark)', () => {
    const mig = read(migPath);
    expect(mig).toContain("v_app.status <> 'cancelado'");
    expect(mig).toContain('v_app.hold_released_at is null');
    expect(mig).toContain("'not_releasable'");
    // The guarded final UPDATE re-checks the same state (atomic race-safety
    // against double-taps and concurrent re-confirms).
    expect(mig).toContain("and status = 'cancelado'");
    expect(mig).toContain('hold_released_at is not null');
  });

  it('refuses past slots', () => {
    const mig = read(migPath);
    expect(mig).toContain('v_app.scheduled_at <= now()');
    expect(mig).toContain("'past'");
  });

  it('re-checks slot freedom with the EXACT 0007 step-8 overlap predicate', () => {
    const mig = read(migPath);
    expect(mig).toContain("status not in ('cancelado', 'no_asistio')");
    expect(mig).toContain("not (a.status = 'pendiente' and a.hold_expires_at <= now())");
    expect(mig).toContain('a.scheduled_at < v_app.ends_at');
    expect(mig).toContain('a.ends_at > v_app.scheduled_at');
    // The row being re-confirmed never blocks itself.
    expect(mig).toContain('a.id <> v_app.id');
    expect(mig).toContain("'slot_taken'");
  });

  it('effect: confirmado + confirmed_at, release mark kept as history', () => {
    const mig = read(migPath);
    expect(mig).toContain("set status = 'confirmado'");
    expect(mig).toContain('confirmed_at = now()');
    expect(mig).toMatch(/jsonb_build_object\('ok', true, 'code', 'ok', 'appointment_id'/);
    // The auto-release mark is never erased — it is the D2 audit trail.
    expect(mig).not.toMatch(/hold_released_at\s*=\s*null/);
  });

  it('ACL: authenticated only (in-function admin gate); anon revoked (0012 lesson)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(
      /revoke all on function public\.reconfirm_booking\(uuid\) from public, anon/
    );
    expect(mig).toMatch(
      /grant execute on function public\.reconfirm_booking\(uuid\) to authenticated/
    );
  });

  it('records itself in supabase_migrations.schema_migrations (idempotent)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/insert into supabase_migrations\.schema_migrations/);
    expect(mig).toContain("'0013'");
    const guarded = /on conflict .*do nothing/.test(mig) || /if not exists/.test(mig);
    expect(guarded, 'history insert must be conflict-guarded').toBe(true);
  });

  it('down.sql drops the RPC and never rewrites booking data', () => {
    const down = read(downPath);
    expect(down).toMatch(/drop function if exists public\.reconfirm_booking\(uuid\)/);
    // DATA POLICY: rows the dueña already re-confirmed keep their state — the
    // down removes the capability, never rewrites bookings (0012 policy).
    expect(down).not.toMatch(/update\s+public\.appointments/i);
    // Downs never rewrite the ledger (0006/0007/0011/0012 convention).
    expect(down).not.toMatch(/insert into supabase_migrations/);
    expect(down).not.toMatch(/delete from supabase_migrations/);
  });
});
