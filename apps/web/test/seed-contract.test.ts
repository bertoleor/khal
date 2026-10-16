import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [ORN-80] Contract tests for the production seed (supabase/seed.sql).
 *
 * The seed is a plain SQL file (no build step), so the test asserts its textual
 * contract against the live schema rules defined in 0001/0002/0003:
 *   - idempotency: every INSERT is conflict-guarded (on conflict do nothing/update)
 *   - completeness: seeds organizations, providers, provider_services, services,
 *     business_hours and global_settings — the entities `create_booking` and the
 *     web catalog require to return anything other than 'invalid'.
 *   - fidelity: the four service rows mirror the mock catalog UUIDs and payload
 *     (apps/web/src/lib/mocks/services.ts) so the swap from mocks to DB reads
 *     keeps every URL and RPC call pointed at the same service ids.
 *   - schema conformance: deposit_mode values are real enum members; check
 *     constraints on deposit columns are satisfiable; business_hours uses
 *     day_of_week 0..6 and open < close.
 */
const repoRoot = resolve(__dirname, '../../..');
const seedPath = resolve(repoRoot, 'supabase/seed.sql');
const schemaPath = resolve(repoRoot, 'supabase/migrations/0001_initial_schema.sql');
const rpcPath = resolve(repoRoot, 'supabase/migrations/0003_create_booking_rpc.sql');
const migration0007Path = resolve(
  repoRoot,
  'supabase/migrations/0007_create_booking_schedule_gates.sql'
);
const migration0007DownPath = resolve(
  repoRoot,
  'supabase/migrations/0007_create_booking_schedule_gates.down.sql'
);

function readIfExists(p: string): string | null {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

// UUIDs of the mock catalog — the seed must reuse them verbatim.
const MOCK_SERVICE_IDS = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
];

describe('supabase/seed.sql — production seed contract', () => {
  it('exists', () => {
    expect(readIfExists(seedPath)).not.toBeNull();
  });

  it('inserts into every table the booking flow requires', () => {
    const seed = readIfExists(seedPath) ?? '';
    for (const table of [
      'public.organizations',
      'public.providers',
      'public.provider_services',
      'public.services',
      'public.business_hours',
      'public.global_settings',
    ]) {
      expect(seed, `missing insert for ${table}`).toContain(`insert into ${table}`);
    }
  });

  it('is idempotent: every insert statement carries a conflict guard', () => {
    const seed = readIfExists(seedPath) ?? '';
    const inserts = seed.match(/insert into public\.\w+/g) ?? [];
    expect(inserts.length).toBeGreaterThanOrEqual(6);
    const guards = (seed.match(/on conflict/g) ?? []).length;
    expect(guards).toBeGreaterThanOrEqual(inserts.length);
  });

  it('seeds exactly the four mock service ids with matching visibility', () => {
    const seed = readIfExists(seedPath) ?? '';
    for (const id of MOCK_SERVICE_IDS) {
      expect(seed).toContain(id);
    }
    // 4 visible services — the 100% lash catalog (2026-10-15) mirrors the
    // mock catalog: Lifting, Clásicas, Híbridas and Volumen Ruso all visible.
    expect(seed).toContain("'Volumen Ruso'");
    // Column appears once in the insert header; the four rows carry 4 true.
    expect(seed).toContain('15, true, 1');
    expect(seed).toContain('15, true, 2');
    expect(seed).toContain('15, true, 3');
    expect(seed).toContain('15, true, 4');
  });

  it('only uses deposit_mode values from the enum', () => {
    const seed = readIfExists(seedPath) ?? '';
    const schema = readIfExists(schemaPath) ?? '';
    const enumMatch = schema.match(/create type deposit_mode as enum \(([^)]+)\)/);
    expect(enumMatch).not.toBeNull();
    const members = (enumMatch![1] ?? '').split(',').map((m) => m.trim().replace(/'/g, ''));
    expect(members.length).toBeGreaterThan(0);
    const used = seed.match(/'full'|'fixed'|'percentage'/g) ?? [];
    for (const value of used) {
      expect(members).toContain(value.replace(/'/g, ''));
    }
  });

  it('keeps provider_services rows unique per (provider_id, service_id)', () => {
    const seed = readIfExists(seedPath) ?? '';
    expect(seed).toContain('on conflict (provider_id, service_id)');
  });

  it('seeds business_hours with day_of_week 1..6 (Sunday closed, mirrors the mock schedule)', () => {
    const seed = readIfExists(seedPath) ?? '';
    // The mock closes on Sunday (weekday 0) and opens 09:00-18:00 otherwise.
    expect(seed).toMatch(/09:00/);
    expect(seed).toMatch(/18:00/);
    expect(seed).not.toMatch(/day_of_week[^,]*,\s*0\b/);
    // business_hours has NO unique constraint on (organization_id, day_of_week)
    // (verified against the live DB: only the id pkey exists), so the conflict
    // target must be the deterministic id pkey — one stable UUID per weekday —
    // and the (organization_id, day_of_week) target is a runtime 42P10 error.
    expect(seed).not.toContain('on conflict (organization_id, day_of_week)');
    const bhBlock = seed.slice(
      seed.indexOf('insert into public.business_hours'),
      seed.indexOf('insert into public.global_settings')
    );
    expect(bhBlock).toContain('on conflict (id) do nothing');
    expect(bhBlock).toContain('id, organization_id, day_of_week');
  });

  it('seeds store payment settings into global_settings (payment alias/cvu/whatsapp)', () => {
    const seed = readIfExists(seedPath) ?? '';
    expect(seed).toContain('global_settings');
    expect(seed).toContain('payment_alias');
    expect(seed).toContain('payment_cvu');
    expect(seed).toContain('payment_whatsapp_phone');
  });

  it('references providers and services by stable UUIDs (no gen_random_uuid for seeded rows)', () => {
    const seed = readIfExists(seedPath) ?? '';
    expect(seed).toContain('11111111-1111-4111-8111-111111111111');
    // A stable org id keeps business_hours FK and global_settings FK deterministic.
    expect(seed).toMatch(/values \('aaaaaaaa-/);
  });

  it('does not grant anon write access beyond what 0001/0003 already established', () => {
    const seed = readIfExists(seedPath) ?? '';
    const rpc = readIfExists(rpcPath) ?? '';
    const seedGrants = seed.match(/^\s*(grant|revoke)/gim) ?? [];
    expect(seedGrants.length).toBe(0);
    // The RPC grant set is the only anon surface; it must remain the same.
    expect(rpc).toContain(
      'grant execute on function public.create_booking(uuid, text, text, text, date, integer, uuid, text) to anon, authenticated, service_role'
    );
  });
});

/**
 * [ORN-170] Contract tests for migration 0007 — schedule-window gate on
 * create_booking (audit 2026-10-07 finding H1: a 03:00 booking went through
 * because 0003 never checked business_hours / provider_schedules).
 *
 * Textual TDD without a local DB: the migration is a plain SQL file, so the
 * contract pins the decisions D1-D6 fixed by the orchestrator:
 *   - reject code is the EXISTING 'unavailable' (no new contract surface, D1)
 *   - provider_schedules (active rows for the provider + weekday) override
 *     business_hours; business_hours is the org fallback; none = closed (D2)
 *   - the whole block [slot, slot + duration + buffer) must fit inside ONE
 *     window row — mirrors computeAvailableSlots (SCH-01/02), zero UI
 *     regression (D3)
 *   - weekday from extract(dow from p_date) (0=Sun..6=Sat) and minute-of-day
 *     comparisons via extract(epoch from <time>)/60 — never ::time casts of
 *     the block end (D4)
 *   - search_path pinned to public, extensions (lesson P0 of 0006), gate
 *     placed between calendar_exceptions and the client upsert (D5/D6)
 */
describe('migration 0007 — create_booking schedule-window gate (ORN-170)', () => {
  it('exists with its rollback', () => {
    expect(
      readIfExists(migration0007Path),
      '0007_create_booking_schedule_gates.sql missing'
    ).not.toBeNull();
    expect(
      readIfExists(migration0007DownPath),
      '0007_create_booking_schedule_gates.down.sql missing'
    ).not.toBeNull();
  });

  it('replaces create_booking with the search_path pinned (lesson P0 of 0006)', () => {
    const mig = readIfExists(migration0007Path) ?? '';
    expect(mig).toContain('create or replace function public.create_booking(');
    expect(mig).toContain('set search_path = public, extensions');
  });

  it('gates on provider_schedules overriding business_hours (D2)', () => {
    const mig = readIfExists(migration0007Path) ?? '';
    expect(mig).toContain('public.provider_schedules');
    expect(mig).toContain('public.business_hours');
    // Provider override only counts for ACTIVE, non-deleted rows.
    expect(mig).toContain('ps.is_active');
    expect(mig).toContain('ps.deleted_at is null');
  });

  it('computes weekday from the wall-clock date and compares minute-of-day (D4)', () => {
    const mig = readIfExists(migration0007Path) ?? '';
    expect(mig).toContain('extract(dow from p_date)');
    expect(mig).toContain('extract(epoch from');
    // Never cast the block end to ::time — it wraps at 24:00. (\b so the
    // legit p_date::timestamp of 0003 step 3 is not a false positive.)
    expect(mig).not.toMatch(/::time\b/);
  });

  it('requires the FULL block (duration + buffer) inside one window row (D3)', () => {
    const mig = readIfExists(migration0007Path) ?? '';
    expect(mig).toContain('v_service_row.duration_minutes + v_service_row.buffer_minutes');
  });

  it('rejects out-of-window slots with the existing unavailable code (D1)', () => {
    const mig = readIfExists(migration0007Path) ?? '';
    expect(mig).toContain("'unavailable'");
  });

  it('places the gate between calendar_exceptions (9) and the client upsert (10) (D6)', () => {
    const mig = readIfExists(migration0007Path) ?? '';
    const iCalex = mig.indexOf('public.calendar_exceptions');
    const iGate = mig.indexOf('public.provider_schedules');
    const iUpsert = mig.indexOf('insert into public.clients');
    expect(iCalex).toBeGreaterThan(-1);
    expect(iGate).toBeGreaterThan(-1);
    expect(iUpsert).toBeGreaterThan(-1);
    expect(iCalex).toBeLessThan(iGate);
    expect(iGate).toBeLessThan(iUpsert);
  });

  it('registers itself in the supabase_migrations ledger (0006 convention)', () => {
    const mig = readIfExists(migration0007Path) ?? '';
    expect(mig).toMatch(/insert into supabase_migrations\.schema_migrations/);
    expect(mig).toContain("values ('0007')");
  });

  it('keeps the anon execute grant block of 0003 (self-documenting ACL)', () => {
    const mig = readIfExists(migration0007Path) ?? '';
    expect(mig).toContain(
      'grant execute on function public.create_booking(uuid, text, text, text, date, integer, uuid, text) to anon, authenticated, service_role'
    );
  });

  it('down restores the pre-gate body with the search_path fix kept (D5)', () => {
    const down = readIfExists(migration0007DownPath) ?? '';
    expect(down).toContain('create or replace function public.create_booking(');
    expect(down).toContain('set search_path = public, extensions');
    // The restored body keeps the calendar_exceptions step but drops the gate.
    expect(down).toContain('public.calendar_exceptions');
    expect(down).not.toContain('public.provider_schedules');
    expect(down).not.toContain('public.business_hours');
  });
});
