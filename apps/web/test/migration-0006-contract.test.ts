import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [ORN-80] Contract tests for migration 0006 — fix create_booking search_path.
 *
 * Deployed evidence (live DB, 2026-09-28): pgcrypto installs to schema
 * `extensions` on hosted Supabase (pg_extension.extnamespace = 'extensions'),
 * while 0003 declared `set search_path = public` on create_booking. The
 * `digest()` call at RPC step 3 therefore fails with 42883
 * "function digest(text, unknown) does not exist" — every booking attempt that
 * passes service/provider validation crashes instead of returning jsonb.
 * Invalid-service calls exit at step 1 and hide the bug.
 *
 * The fix adds `extensions` to the function's search_path. Security stays
 * intact: on hosted Supabase, CREATE in `public` is revoked from
 * anon/authenticated, so no untrusted role can shadow `digest`.
 */
const repoRoot = resolve(__dirname, '../../..');
const migPath = resolve(repoRoot, 'supabase/migrations/0006_fix_create_booking_search_path.sql');
const downPath = resolve(
  repoRoot,
  'supabase/migrations/0006_fix_create_booking_search_path.down.sql'
);

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

describe('migration 0006 — create_booking search_path fix', () => {
  it('exists with a rollback file (DBA gate: migration without down.sql is blocked)', () => {
    expect(existsSync(migPath), '0006 sql missing').toBe(true);
    expect(existsSync(downPath), '0006 down.sql missing').toBe(true);
  });

  it('alters the exact create_booking signature declared in 0003', () => {
    const mig = read(migPath);
    expect(mig).toContain('alter function public.create_booking(');
    expect(mig).toContain('uuid, text, text, text, date, integer, uuid, text');
  });

  it('sets search_path to public, extensions (pgcrypto lives in extensions schema)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/set search_path\s*=\s*public,\s*extensions/);
    // Never the bare `= public` form that broke digest() resolution.
    expect(mig).not.toMatch(/search_path\s*=\s*public\s*;?\s*$/m);
  });

  it('down.sql restores the original search_path = public', () => {
    const down = read(downPath);
    expect(down).toContain('alter function public.create_booking(');
    // The ALTER itself must restore the bare public path (comments may explain
    // the extensions schema without re-adding it to the search_path).
    const alter = down.match(/alter function[^;]+;/s);
    expect(alter).not.toBeNull();
    expect(alter![0]).toMatch(/set search_path\s*=\s*public\s*;/);
    expect(alter![0]).not.toContain('extensions');
  });

  it('records itself in supabase_migrations.schema_migrations (matches 0001-0005 convention)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/insert into supabase_migrations\.schema_migrations/);
    expect(mig).toContain("'0006'");
  });

  it('is idempotent (safe to re-run against a drifted database)', () => {
    const mig = read(migPath);
    // Either on conflict do nothing on the history insert, or not exists guard.
    const guarded = /on conflict .* do nothing/.test(mig) || /if not exists/.test(mig);
    expect(guarded, 'history insert must be conflict-guarded').toBe(true);
  });
});
