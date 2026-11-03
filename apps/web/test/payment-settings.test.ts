import { getPaymentSettings } from '@/lib/actions/settings';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * [KHAL-A1 / t_f3bec8b8] Payment settings: mock constant -> global_settings.
 *
 * Audit evidence (auditoria-khal-2026-10-02.md §2-A1): the booking flow's
 * payment step rendered `storePaymentSettings` from
 * apps/web/src/lib/mocks/settings.ts — hardcoded dummy alias/CVU/whatsapp a
 * production customer could copy and "pay". The live DB already carries the
 * settings in global_settings (seed 2026-09-28, keys payment_alias /
 * payment_cvu / payment_whatsapp_phone), so the fix swaps the source of
 * truth and adds the anon read surface (migration 0008) the storefront
 * needs — global_settings had only the member policy (migration 0001).
 *
 * Safe fallback contract: when the table has no (valid) settings the flow
 * must NOT render transfer details — an empty or garbage CVU must never be
 * copyable. getPaymentSettings returns null; the page passes ''; the
 * payment step hides the transfer/WhatsApp sections.
 */

// ---------------------------------------------------------------------------
// Unit tests — getPaymentSettings (booking-client mocked; no real network).
// ---------------------------------------------------------------------------

const mockEnv = vi.hoisted(() => ({ url: null as string | null, anonKey: null as string | null }));
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/booking-client', () => ({
  readBookingSupabaseEnv: vi.fn(() =>
    mockEnv.url && mockEnv.anonKey ? { url: mockEnv.url, anonKey: mockEnv.anonKey } : null
  ),
  createBookingSupabaseClient: vi.fn(() => ({ from: mockFrom })),
}));

// Rows shaped like supabase/seed.sql §6 (snake_case columns, jsonb `value`
// arrives from PostgREST as the parsed JSON string).
function settingRow(key: string, value: unknown): Record<string, unknown> {
  return { setting_key: key, value };
}

const SEED_ROWS = [
  settingRow('payment_alias', 'khal.estudio'),
  settingRow('payment_cvu', '0000003100000000000001'),
  settingRow('payment_whatsapp_phone', '5491100000000'),
];

// Fake supabase-js client for the query shape actually used by settings.ts:
// .from('global_settings').select(...).in(...).is(...) -> awaited result.
function fakeSettingsClient(result: {
  data: Record<string, unknown>[] | null;
  error?: { message: string } | null;
}) {
  const outcome = { data: result.data, error: result.error ?? null };
  const chain = {
    select: vi.fn(() => chain),
    in: vi.fn(() => chain),
    is: vi.fn(async () => ({ data: outcome.data, error: outcome.error })),
  };
  return { from: vi.fn(() => chain), chain };
}

beforeEach(() => {
  vi.resetModules();
  mockEnv.url = 'https://khal.supabase.co';
  mockEnv.anonKey = 'anon-key';
  mockFrom.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getPaymentSettings — typed Supabase read of public.global_settings', () => {
  it('reads the three payment keys with a soft-delete-aware filter', async () => {
    const { chain } = fakeSettingsClient({ data: [...SEED_ROWS] });
    mockFrom.mockImplementation(() => chain);

    await getPaymentSettings();

    expect(mockFrom).toHaveBeenCalledWith('global_settings');
    expect(chain.select).toHaveBeenCalledWith('setting_key, value');
    expect(chain.in).toHaveBeenCalledWith('setting_key', [
      'payment_alias',
      'payment_cvu',
      'payment_whatsapp_phone',
    ]);
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
  });

  it('maps setting_key rows to the PaymentSettings shape (seed fidelity)', async () => {
    const { chain } = fakeSettingsClient({ data: [...SEED_ROWS] });
    mockFrom.mockImplementation(() => chain);

    const settings = await getPaymentSettings();

    expect(settings).toEqual({
      alias: 'khal.estudio',
      cvu: '0000003100000000000001',
      whatsappPhone: '5491100000000',
    });
  });

  it('returns null when the table is empty (safe fallback, never dummy data)', async () => {
    const { chain } = fakeSettingsClient({ data: [] });
    mockFrom.mockImplementation(() => chain);

    expect(await getPaymentSettings()).toBeNull();
  });

  it('returns null when a payment key is missing from the table', async () => {
    // Only alias + cvu seeded: whatsapp key absent -> all-or-nothing null,
    // never a partial payment card (a store missing its WhatsApp number is
    // misconfigured, not "half configured").
    const { chain } = fakeSettingsClient({
      data: [SEED_ROWS[0], SEED_ROWS[1]],
    });
    mockFrom.mockImplementation(() => chain);

    expect(await getPaymentSettings()).toBeNull();
  });

  it('returns null when a value arrives as SQL/jsonb null (delete-if-null before safeParse)', async () => {
    const { chain } = fakeSettingsClient({
      data: [SEED_ROWS[0], settingRow('payment_cvu', null), SEED_ROWS[2]],
    });
    mockFrom.mockImplementation(() => chain);

    expect(await getPaymentSettings()).toBeNull();
  });

  it('returns null when the CVU is not 22 digits (invalid data never reaches the customer)', async () => {
    const { chain } = fakeSettingsClient({
      data: [SEED_ROWS[0], settingRow('payment_cvu', '1234'), SEED_ROWS[2]],
    });
    mockFrom.mockImplementation(() => chain);

    expect(await getPaymentSettings()).toBeNull();
  });

  it('returns null when a value is not a string (jsonb object/number)', async () => {
    const { chain } = fakeSettingsClient({
      data: [settingRow('payment_alias', { alias: 'nested' }), SEED_ROWS[1], SEED_ROWS[2]],
    });
    mockFrom.mockImplementation(() => chain);

    expect(await getPaymentSettings()).toBeNull();
  });

  it('returns null (never throws) when Supabase env is missing — no client built', async () => {
    mockEnv.url = null;
    mockEnv.anonKey = null;

    expect(await getPaymentSettings()).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns null on a PostgREST error instead of throwing', async () => {
    const { chain } = fakeSettingsClient({
      data: null,
      error: { message: 'permission denied for table global_settings' },
    });
    mockFrom.mockImplementation(() => chain);

    expect(await getPaymentSettings()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Contract tests — migration 0008 (anon read surface for payment settings).
// ---------------------------------------------------------------------------

const repoRoot = resolve(__dirname, '../../..');
const migPath = resolve(
  repoRoot,
  'supabase/migrations/0008_global_settings_payment_anon_select.sql'
);
const downPath = resolve(
  repoRoot,
  'supabase/migrations/0008_global_settings_payment_anon_select.down.sql'
);

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

describe('migration 0008 — global_settings anon read surface (KHAL-A1)', () => {
  it('exists with a rollback file (DBA gate: migration without down.sql is blocked)', () => {
    expect(existsSync(migPath), '0008 sql missing').toBe(true);
    expect(existsSync(downPath), '0008 down.sql missing').toBe(true);
  });

  it('grants anon SELECT via a dedicated policy on global_settings', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/create policy global_settings_anon_select on public\.global_settings/);
    expect(mig).toMatch(/for\s+select/);
  });

  it('scopes the policy to the three storefront payment keys only', () => {
    const mig = read(migPath);
    expect(mig).toContain(
      "setting_key in ('payment_alias', 'payment_cvu', 'payment_whatsapp_phone')"
    );
    // No blanket grant: the policy must never degrade to `using (true)`.
    expect(mig).not.toContain('using (true)');
    // Read-only surface: no anon write path may be opened by this migration.
    expect(mig).not.toMatch(/for\s+insert/i);
    expect(mig).not.toMatch(/for\s+update/i);
    expect(mig).not.toMatch(/for\s+delete/i);
  });

  it('is soft-delete aware (deleted rows must not re-surface payment data)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/deleted_at\s+is\s+null/);
  });

  it('is idempotent (drop policy if exists before create)', () => {
    const mig = read(migPath);
    expect(mig).toMatch(/drop policy if exists global_settings_anon_select/);
  });

  it("records itself in supabase_migrations.schema_migrations ('0008', conflict-guarded)", () => {
    const mig = read(migPath);
    expect(mig).toMatch(/insert into supabase_migrations\.schema_migrations/);
    expect(mig).toContain("'0008'");
    expect(mig).toMatch(/on conflict \(version\) do nothing/);
  });

  it('down.sql drops only the anon policy — member policy and ledger stay intact', () => {
    const down = read(downPath);
    expect(down).toMatch(/drop policy if exists global_settings_anon_select/);
    // Rollback must not DROP or CREATE policies other than the anon one: the
    // comment block may *mention* member_all ("does NOT touch") but no DDL
    // statement may target it.
    const ddlStatements =
      down
        .replace(/--[^\n]*/g, '') // strip comment lines
        .match(/^\s*(drop|create|alter|grant|revoke|delete)\b[^;]*;/gim) ?? [];
    const memberTouched = ddlStatements.some((stmt) => stmt.includes('global_settings_member_all'));
    expect(memberTouched, 'member policy must not be altered by the rollback').toBe(false);
    // …nor delete schema_migrations rows (CLI ledger contract, cf. 0006 down).
    expect(down).not.toMatch(/delete from supabase_migrations/);
  });
});

// ---------------------------------------------------------------------------
// Static contracts — the booking flow must keep the swap and the safe
// fallback (the regression A1 was filed against is a UI-visible one).
// ---------------------------------------------------------------------------

const PAGE_PATH = 'apps/web/src/app/[locale]/servicios/[id]/reservar/page.tsx';
const STEP_PATH = 'apps/web/src/components/payment/payment-step.tsx';

function readApp(appPath: string): string {
  return readFileSync(resolve(repoRoot, appPath), 'utf8');
}

/** Recursively collect .ts/.tsx files under apps/web/src. */
function collectSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      collectSources(full, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('[KHAL-A1] booking flow — payment settings source of truth', () => {
  it('reservar page no longer imports the mock settings (A1 acceptance)', () => {
    const page = readApp(PAGE_PATH);
    expect(page).not.toContain('mocks/settings');
  });

  it('reservar page sources payment settings from the settings action', () => {
    const page = readApp(PAGE_PATH);
    expect(page).toContain('@/lib/actions/settings');
    expect(page).toMatch(/getPaymentSettings\(\)/);
  });

  it('no source file under apps/web/src imports mocks/settings', () => {
    const srcRoot = resolve(repoRoot, 'apps/web/src');
    const offenders = collectSources(srcRoot).filter((file) => {
      const content = readFileSync(file, 'utf8');
      return /from\s+'[^']*mocks\/settings'/.test(content);
    });
    expect(
      offenders.map((file) => file.slice(repoRoot.length + 1)),
      'mocks/settings must not be imported anywhere in apps/web/src'
    ).toEqual([]);
  });

  it('payment step never renders a copyable empty payment value (CopyRow guards blank)', () => {
    const step = readApp(STEP_PATH);
    // CopyRow returns null for an empty value — a blank CVU row with a
    // working "copy" button is exactly the A1 failure mode.
    expect(step).toMatch(/if \(value\.length === 0\)\s*\{\s*return null;/);
  });

  it('payment step gates the whole transfer section on real settings (safe fallback)', () => {
    const step = readApp(STEP_PATH);
    expect(step).toContain('hasTransferDetails');
    expect(step).toMatch(/\{hasTransferDetails \? \(/);
    // v7 recibo (S9): the gated copy rows live inside the glass card, right
    // under the reserved title — the rows never render without real
    // settings, and the title always does.
    expect(step).toContain("t('reservedTitle')");
    expect(step).toMatch(/\{hasTransferDetails \? \(\s*<>\s*<CopyRow/);
  });

  it('payment step hides the WhatsApp CTA without a real phone number', () => {
    const step = readApp(STEP_PATH);
    // wa.me/<empty> is a broken link; the receipt CTA must not render.
    expect(step).toMatch(/payment\.whatsappPhone\.length > 0 \? \(/);
  });
});
