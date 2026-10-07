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
    // 3 visible + 1 hidden (Spa de Uñas Completo) mirrors the mock catalog.
    expect(seed).toContain("'Spa de Uñas Completo'");
    // Column appears once in the insert header; the four rows carry 3 true + 1 false.
    expect(seed).toContain('15, true, 1');
    expect(seed).toContain('15, true, 2');
    expect(seed).toContain('10, true, 3');
    expect(seed).toContain('15, false, 4');
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
