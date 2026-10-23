import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [D3 — owner rule 2026-10-20] Contract tests for migration 0014 —
 * external_work booking flag (data path).
 *
 * Business rule: the reservar form asks "¿venís con trabajo de otro lugar?"
 * (D3) and the flag must PERSIST so it can surface in the approval queue and
 * the clienta ficha (F3). A checkbox without persistence would be dishonest
 * UI, so the data path lands first; the form checkbox lands with the reservar
 * v2 UI unit.
 *
 * Postgres overload hazard (why the drop line is contract): CREATE OR REPLACE
 * with a DIFFERENT parameter list creates a NEW overload — the old 8-arg
 * create_booking would keep serving PostgREST. The migration must leave
 * exactly ONE create_booking: the 9-arg body, old signature dropped.
 *
 * Everything else is preserved verbatim from the 0011 body: 12h TTL (D2),
 * 0007 schedule gates, 0006 search_path fix, ACL.
 */
const repoRoot = resolve(__dirname, '../../..');
const migPath = resolve(repoRoot, 'supabase/migrations/0014_booking_external_work.sql');
const downPath = resolve(repoRoot, 'supabase/migrations/0014_booking_external_work.down.sql');

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

const OLD_SIGNATURE = 'uuid, text, text, text, date, integer, uuid, text';
const NEW_SIGNATURE = 'uuid, text, text, text, date, integer, uuid, text, boolean';

describe('migration 0014 — external_work booking flag (D3 data path)', () => {
  it('exists with a rollback file (DBA gate: migration without down.sql is blocked)', () => {
    expect(existsSync(migPath), '0014 sql missing').toBe(true);
    expect(existsSync(downPath), '0014 down.sql missing').toBe(true);
  });

  it('adds the external_work column idempotently (additive, default false)', () => {
    const mig = read(migPath);
    expect(mig).toContain('alter table public.appointments');
    expect(mig).toMatch(/add column if not exists external_work boolean not null default false/);
  });

  it('extends create_booking with p_external_work (default false keeps old callers valid)', () => {
    const mig = read(migPath);
    expect(mig).toContain('p_external_work');
    expect(mig).toContain('boolean default false');
  });

  it('persists the flag on insert (column list + values)', () => {
    const mig = read(migPath);
    // Column list gains external_work right after ip_hash...
    expect(mig).toMatch(/ip_hash,\s*\n\s*external_work/);
    // ...and the values gain p_external_work after the ip_hash case.
    expect(mig).toMatch(/end,\s*\n\s*p_external_work/);
  });

  it('OVERLOAD SAFETY: drops the old 8-arg create_booking (exactly one function survives)', () => {
    const mig = read(migPath);
    expect(mig).toContain(`drop function if exists public.create_booking(${OLD_SIGNATURE})`);
    // The new body itself carries the 9-arg signature.
    expect(mig).toContain(NEW_SIGNATURE);
  });

  it('keeps the 0011 rule intact: 12h TTL, gates, search_path, ACL (no regression)', () => {
    const mig = read(migPath);
    expect(mig).toContain("now() + interval '12 hours'");
    expect(mig).not.toMatch(/now\(\)\s*\+\s*interval '15 minutes'/);
    expect(mig).toContain('provider_schedules');
    expect(mig).toContain('business_hours');
    expect(mig).toContain('calendar_exceptions');
    expect(mig).toContain('digest(');
    expect(mig).toMatch(/set search_path\s*=\s*public,\s*extensions/);
    expect(mig).toMatch(
      new RegExp(
        `grant execute on function public\\.create_booking\\(${NEW_SIGNATURE.replace(/, /g, ', ')}\\) to anon, authenticated, service_role`
      )
    );
  });

  it('records itself in supabase_migrations.schema_migrations (idempotent)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/insert into supabase_migrations\.schema_migrations/);
    expect(mig).toContain("'0014'");
    const guarded = /on conflict .*do nothing/.test(mig) || /if not exists/.test(mig);
    expect(guarded, 'history insert must be conflict-guarded').toBe(true);
  });

  it('down.sql restores the 0011 body, drops the 9-arg overload and the column', () => {
    const down = read(downPath);
    // The 8-arg 0011 body comes back (with the 12h TTL)...
    expect(down).toContain('create or replace function public.create_booking(');
    expect(down).toContain("now() + interval '12 hours'");
    expect(down).not.toContain('p_external_work');
    // ...the 9-arg overload is removed so only one function remains...
    expect(down).toContain(`drop function if exists public.create_booking(${NEW_SIGNATURE})`);
    // ...and the column is dropped (DATA POLICY: only the NEW flag is lost —
    // bookings keep every other field; the down of a new feature cannot
    // preserve data that did not exist before it).
    expect(down).toMatch(/drop column if exists external_work/);
    // Downs never rewrite the ledger (0006/0007/0011/0012 convention).
    expect(down).not.toMatch(/insert into supabase_migrations/);
    expect(down).not.toMatch(/delete from supabase_migrations/);
  });
});
