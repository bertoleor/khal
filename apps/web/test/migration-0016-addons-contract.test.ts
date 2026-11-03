import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [S6 — "¿Sumás algo más?" / S10 — 4-state estado] Contract tests for
 * migration 0016 — booking add-ons.
 *
 * Owner rule S6 (2026-10-26, odd/tasks/v7-clienta-bw-glass.md): the reservar
 * flow gains a curated, cart-free add-on module (Perfilado de cejas
 * +$18.000, Kit de higiene +$5.000 con servicio). The data path lands FIRST
 * (the 0014 doctrine): appointments.addons jsonb + a p_addons parameter on
 * create_booking, with the default keeping every existing caller valid.
 *
 * S10 rides along on get_booking_status: the 4-state estado screen must tell
 * an auto-released hold (0012 marks status='cancelado' + hold_released_at)
 * apart from a real cancellation, and must render the service WITH its
 * add-ons ("Lifting + perfilado") — so the RPC also returns hold_released_at,
 * duration_minutes and addons. The zero-PII contract of 0015 is unchanged.
 */
const repoRoot = resolve(__dirname, '../../..');
const migPath = resolve(repoRoot, 'supabase/migrations/0016_booking_addons.sql');
const downPath = resolve(repoRoot, 'supabase/migrations/0016_booking_addons.down.sql');

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

describe('migration 0016 — booking add-ons (S6) + status v2 (S10)', () => {
  it('exists with a rollback file (DBA gate)', () => {
    expect(existsSync(migPath), '0016 sql missing').toBe(true);
    expect(existsSync(downPath), '0016 down.sql missing').toBe(true);
  });

  it('adds the addons column additively and idempotently', () => {
    const mig = read(migPath);
    expect(mig).toMatch(
      /alter\s+table\s+public\.appointments\s+add\s+column\s+if\s+not\s+exists\s+addons\s+jsonb/i
    );
  });

  it('create_booking gains p_addons jsonb DEFAULT NULL (existing callers stay valid)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/p_addons\s+jsonb\s+default\s+null/i);
    // SECURITY DEFINER + the 0006 search_path discipline (unchanged from 0014).
    expect(mig).toContain('security definer');
    expect(mig).toMatch(/set search_path\s*=\s*public,\s*extensions/);
  });

  it('stores ONLY a well-formed jsonb array (anything else collapses to NULL)', () => {
    const mig = read(migPath);
    expect(mig).toContain("jsonb_typeof(p_addons) = 'array'");
    // And the INSERT persists the guarded value, not the raw parameter.
    expect(mig).toMatch(/external_work,\s*\n\s*addons\s*\n\s*\)/);
    expect(mig).toContain('p_external_work,');
    expect(mig).toContain('v_addons');
  });

  it('overload safety: drops the 9-arg body, ACL re-issued on the 10-arg signature', () => {
    const mig = read(migPath);
    expect(mig).toMatch(
      /drop function if exists public\.create_booking\(uuid, text, text, text, date, integer, uuid, text, boolean\);/
    );
    expect(mig).toMatch(
      /revoke all on function public\.create_booking\(uuid, text, text, text, date, integer, uuid, text, boolean, jsonb\) from public/
    );
    expect(mig).toMatch(
      /grant execute on function public\.create_booking\(uuid, text, text, text, date, integer, uuid, text, boolean, jsonb\) to anon, authenticated, service_role/
    );
  });

  it('get_booking_status v2 returns the S10 fields (hold_released_at, duration_minutes, addons)', () => {
    const mig = read(migPath);
    const statusRpc = mig.slice(
      mig.indexOf('create or replace function public.get_booking_status')
    );
    expect(statusRpc.length).toBeGreaterThan(0);
    expect(statusRpc).toContain("'hold_released_at'");
    expect(statusRpc).toContain("'duration_minutes'");
    expect(statusRpc).toContain("'addons'");
    // The 0015 contract still holds on the status door.
    expect(statusRpc).toContain("'status'");
    expect(statusRpc).toContain("'service_name'");
    expect(statusRpc).toContain("'not_found'");
    expect(statusRpc).toContain('deleted_at is null');
  });

  it('status door stays ZERO-PII (nothing from the 0003 P0 family crosses)', () => {
    const mig = read(migPath);
    const statusRpc = mig.slice(
      mig.indexOf('create or replace function public.get_booking_status')
    );
    expect(statusRpc).not.toMatch(/phone/i);
    expect(statusRpc).not.toMatch(/email/i);
    expect(statusRpc).not.toMatch(/ip_hash/i);
    expect(statusRpc).not.toMatch(/client_name|'name'/i);
    expect(statusRpc).toMatch(
      /revoke all on function public\.get_booking_status\(uuid\) from public, authenticated/
    );
    expect(statusRpc).toMatch(
      /grant execute on function public\.get_booking_status\(uuid\) to anon/
    );
  });

  it('records itself in supabase_migrations.schema_migrations (idempotent)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/insert into supabase_migrations\.schema_migrations/);
    expect(mig).toContain("'0016'");
    const guarded = /on conflict .*do nothing/.test(mig) || /if not exists/.test(mig);
    expect(guarded, 'history insert must be conflict-guarded').toBe(true);
  });

  it('down.sql restores the 0014 9-arg body + 0015 status shape and drops the column', () => {
    const down = read(downPath);
    // create_booking: back to the 9-arg external_work signature, no p_addons.
    expect(down).toMatch(/p_external_work\s+boolean\s+default\s+false/);
    expect(down).not.toMatch(/p_addons/);
    expect(down).toMatch(
      /drop function if exists public\.create_booking\(uuid, text, text, text, date, integer, uuid, text, boolean, jsonb\);/
    );
    // get_booking_status: the 0015 shape again (no S10 fields).
    const statusRpc = down.slice(
      down.indexOf('create or replace function public.get_booking_status')
    );
    expect(statusRpc.length).toBeGreaterThan(0);
    expect(statusRpc).not.toContain("'hold_released_at'");
    expect(statusRpc).not.toContain("'duration_minutes'");
    expect(statusRpc).not.toContain("'addons'");
    // The column goes away.
    expect(down).toMatch(/drop column if exists addons/i);
  });

  it('down.sql never rewrites the ledger (0006 convention)', () => {
    const down = read(downPath);
    expect(down).not.toMatch(/insert into supabase_migrations/);
    expect(down).not.toMatch(/delete from supabase_migrations/);
  });
});
