import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [KHAL A2 / t_715635aa] Contract tests for migration 0010 — the
 * `get_availability` SECURITY DEFINER RPC.
 *
 * The reservar page used to offer slots from mocks/schedule (hardcoded
 * Mon-Sat 09:00-18:00, fictional blocked periods), so the UI advertised
 * slots the real `create_booking` RPC (0003) rejects — a double-booking
 * UX break — and ignored calendar_exceptions loaded by the admin.
 *
 * 0010 introduces get_availability(p_service_id, p_date) -> jsonb
 * {date, closed, slots}: the FULLY COMPUTED offerable start times, mirroring
 * 0003's admission logic so the UI can never offer a slot the RPC rejects.
 *
 * This guard asserts the security-critical bits of the SQL (same style as
 * migration-0006-contract.test.ts): SECURITY DEFINER, search_path pinning
 * (public + extensions per the 0006 digest() lesson), anon-only grants,
 * and the schema_migrations ledger row with a down.sql companion.
 */
const repoRoot = resolve(__dirname, '../../..');
const migPath = resolve(repoRoot, 'supabase/migrations/0010_get_availability_rpc.sql');
const downPath = resolve(repoRoot, 'supabase/migrations/0010_get_availability_rpc.down.sql');

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

describe('migration 0010 — get_availability SECURITY DEFINER RPC', () => {
  it('exists with a rollback file (DBA gate: migration without down.sql is blocked)', () => {
    expect(existsSync(migPath), '0010 sql missing').toBe(true);
    expect(existsSync(downPath), '0010 down.sql missing').toBe(true);
  });

  it('declares get_availability(uuid, date) returning jsonb', () => {
    const mig = read(migPath);
    expect(mig).toContain('create or replace function public.get_availability(');
    expect(mig).toMatch(/p_service_id\s+uuid/);
    expect(mig).toMatch(/p_date\s+date/);
    expect(mig).toContain('returns jsonb');
  });

  it('is SECURITY DEFINER with search_path pinned to public, extensions', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/security definer/);
    // 0006 lesson: pgcrypto (and any helper) resolves via the extensions
    // schema on hosted Supabase; bare `= public` broke digest() (42883).
    expect(mig).toMatch(/set search_path\s*=\s*public,\s*extensions/);
  });

  it('grants EXECUTE to anon ONLY (revoked from public, authenticated, service_role)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/revoke all on function public\.get_availability\([^)]*\) from public/);
    // anon-only: the read endpoint is the unauthenticated storefront.
    expect(mig).toMatch(/grant execute on function public\.get_availability\([^)]*\) to anon/);
    // No trio grant may survive (0003 granted anon, authenticated,
    // service_role; availability is anon-only by design).
    expect(mig).not.toMatch(/to anon,\s*authenticated,\s*service_role/);
  });

  it('mirrors 0003 admission logic: visibility, single active provider, statuses, exceptions', () => {
    const mig = read(migPath);
    // Service admission: visible + not soft-deleted.
    expect(mig).toMatch(/s\.is_visible/);
    expect(mig).toMatch(/s\.deleted_at is null/);
    // Single active provider resolution (0003 step 2).
    expect(mig).toMatch(/provider_services/);
    expect(mig).toMatch(/p\.is_active/);
    expect(mig).toMatch(/p\.deleted_at is null/);
    expect(mig).toMatch(/v_offering_count\s*<>\s*1/);
    // Overlap probe: same status filter + hold expiry as 0003 step 8.
    expect(mig).toMatch(/status not in \('cancelado', 'no_asistio'\)/);
    expect(mig).toMatch(/a\.status = 'pendiente' and a\.hold_expires_at <= now\(\)/);
    // Calendar exceptions: org-scoped or provider-scoped, deleted_at null (0003 step 9).
    expect(mig).toMatch(/calendar_exceptions/);
    expect(mig).toMatch(/ce\.provider_id is null or ce\.provider_id = v_provider_id/);
    expect(mig).toMatch(/ce\.deleted_at is null/);
  });

  it('computes slots from business_hours windows with the 0003 buffer semantics', () => {
    const mig = read(migPath);
    // business_hours window per weekday (day_of_week 0..6 Sun..Sat).
    expect(mig).toMatch(/business_hours/);
    expect(mig).toMatch(/extract\(isodow/);
    expect(mig).toMatch(/% 7/);
    // Occupied window includes the service buffer, exactly like 0003:
    // interval '1 minute' * (duration_minutes + buffer_minutes).
    expect(mig).toMatch(/duration_minutes\s*\+\s*v?_?service/);
    expect(mig).toMatch(/buffer_minutes/);
  });

  it('returns jsonb {date, closed, slots} shape', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/'closed'/);
    expect(mig).toMatch(/'slots'/);
    expect(mig).toMatch(/'date'/);
  });

  it('records itself in supabase_migrations.schema_migrations (ledger convention)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/insert into supabase_migrations\.schema_migrations/);
    expect(mig).toContain("'0010'");
    // Idempotent history insert (matches 0006 convention).
    expect(mig).toMatch(/on conflict \(version\) do nothing/);
  });

  it('down.sql drops the function (and does not delete the ledger row)', () => {
    const down = read(downPath);
    expect(down).toMatch(/drop function if exists public\.get_availability\(/);
    // 0006 down convention: the CLI history ledger is never mutated by hand.
    expect(down).not.toMatch(/delete from supabase_migrations/);
  });
});
