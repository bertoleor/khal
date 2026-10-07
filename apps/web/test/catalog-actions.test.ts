import { serviceSchema, type Service } from '@khal/validations';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * [ORN-80] Unit tests for the catalog server actions — mock -> Supabase swap.
 *
 * TDD target: `getCatalog`/`getService` must read the `services` table through
 * the anon client (`is_visible` filter + `sort_order` ascending) instead of the
 * in-memory mock catalog. The mocked client is the trust boundary — no real
 * network. Env-missing follows the booking.ts fail-soft philosophy: empty
 * catalog / null service, never a throw.
 */

// DB rows shaped like supabase/seed.sql rows (snake_case columns, all of
// which serviceSchema must validate via safeParse — invalid rows are skipped
// defensively rather than thrown on).
function dbRow(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Lifting de Pestañas',
    description: 'Curvado y lifting de pestañas naturales.',
    price_cents: 4500000,
    currency_code: 'ARS',
    duration_minutes: 60,
    buffer_minutes: 15,
    is_visible: true,
    sort_order: 1,
    ...overrides,
  };
}

// Builds a fake supabase-js client whose .from('services') chain resolves the
// given rows (or error). Mirrors the PostgREST builder interface actually used
// by catalog.ts: .select().eq()... -> .order() (list) or .maybeSingle() (row).
// `.order(column, { ascending })` simulates PostgREST: it really re-sorts the
// rows, so a test that hands rows over in shuffled order proves the impl
// delegated ordering to the query instead of trusting input order.
function fakeClient(result: {
  data: Record<string, unknown>[] | null;
  error?: { message: string } | null;
}) {
  const outcome = { data: result.data, error: result.error ?? null };
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(async (column: string, opts?: { ascending?: boolean }) => {
      const rows = [...(result.data ?? [])];
      rows.sort((a, b) => {
        const delta = Number(a[column]) - Number(b[column]);
        return opts?.ascending === false ? -delta : delta;
      });
      return { data: rows, error: outcome.error };
    }),
    maybeSingle: vi.fn(async () => ({
      data: result.data === null ? null : (result.data[0] ?? null),
      error: outcome.error,
    })),
  };
  return { from: vi.fn(() => chain), chain };
}

const mockEnv = vi.hoisted(() => ({ url: null as string | null, anonKey: null as string | null }));
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/booking-client', () => ({
  readBookingSupabaseEnv: vi.fn(() =>
    mockEnv.url && mockEnv.anonKey ? { url: mockEnv.url, anonKey: mockEnv.anonKey } : null
  ),
  createBookingSupabaseClient: vi.fn(() => ({ from: mockFrom })),
}));

import { getCatalog, getService } from '@/lib/actions/catalog';

beforeEach(() => {
  vi.resetModules();
  mockEnv.url = 'https://khal.supabase.co';
  mockEnv.anonKey = 'anon-key';
  mockFrom.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getCatalog — typed Supabase read of public.services', () => {
  it('queries the services table with is_visible = true and sort_order ascending', async () => {
    const { chain } = fakeClient({ data: [dbRow({})] });
    mockFrom.mockImplementation(() => chain);

    await getCatalog();

    expect(mockFrom).toHaveBeenCalledWith('services');
    expect(chain.select).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('is_visible', true);
    expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });
  });

  it('returns visible DB rows sorted by sort_order (mocks-to-DB fidelity)', async () => {
    // Rows arrive out of order: the contract mirrors the mock catalog's 3 visible services.
    const rows = [
      dbRow({ id: '33333333-3333-4333-8333-333333333333', name: 'Diseño de Cejas', sort_order: 3 }),
      dbRow({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Lifting de Pestañas',
        sort_order: 1,
      }),
      dbRow({
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Esmaltado Semipermanente',
        sort_order: 2,
      }),
    ];
    const { chain } = fakeClient({ data: rows });
    mockFrom.mockImplementation(() => chain);

    const catalog = await getCatalog();

    expect(catalog.map((service: Service) => service.id)).toEqual([
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
    ]);
    // Every returned row satisfies serviceSchema (no throw on read).
    for (const service of catalog) {
      expect(serviceSchema.safeParse(service).success).toBe(true);
    }
  });

  it('defensively skips rows that fail serviceSchema validation instead of throwing', async () => {
    const rows = [
      dbRow({ id: 'not-a-uuid', name: 'Bad row' }),
      dbRow({
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Esmaltado Semipermanente',
        sort_order: 2,
      }),
    ];
    const { chain } = fakeClient({ data: rows });
    mockFrom.mockImplementation(() => chain);

    const catalog = await getCatalog();

    expect(catalog).toHaveLength(1);
    expect(catalog[0]!.name).toBe('Esmaltado Semipermanente');
  });

  it('accepts rows whose optional columns arrive as PostgREST nulls (SQL NULL -> optional field)', async () => {
    // Real production row shape: nullable columns (photo_path, deposit_*) come
    // back as null, and supabase-js adds columns outside Service (organization_id,
    // timestamps). Nulls must normalize before serviceSchema parse (zod
    // .optional() rejects null) and extra keys must strip (zod object strip).
    const row = dbRow({
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Diseño de Cejas',
      description: null,
      photo_path: null,
      deposit_mode: null,
      deposit_fixed_cents: null,
      deposit_percentage_bp: null,
      organization_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      created_at: '2026-09-28T00:00:00Z',
      updated_at: '2026-09-28T00:00:00Z',
      deleted_at: null,
      sort_order: 3,
    });
    const { chain } = fakeClient({ data: [row] });
    mockFrom.mockImplementation(() => chain);

    const catalog = await getCatalog();

    expect(catalog).toHaveLength(1);
    expect(catalog[0]!.name).toBe('Diseño de Cejas');
    expect('deposit_mode' in catalog[0]!).toBe(false);
    expect('description' in catalog[0]!).toBe(false);
    expect('organization_id' in catalog[0]!).toBe(false);
  });

  it('returns an empty array (never throws) when Supabase env is missing', async () => {
    mockEnv.url = null;
    mockEnv.anonKey = null;

    const catalog = await getCatalog();

    expect(catalog).toEqual([]);
    // Fail-soft like booking.ts: no client is even built.
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns an empty array on a PostgREST error instead of throwing', async () => {
    const { chain } = fakeClient({
      data: null,
      error: { message: 'relation "services" does not exist' },
    });
    mockFrom.mockImplementation(() => chain);

    const catalog = await getCatalog();

    expect(catalog).toEqual([]);
  });

  it('returns an empty array when the query resolves no rows', async () => {
    const { chain } = fakeClient({ data: [] });
    mockFrom.mockImplementation(() => chain);

    const catalog = await getCatalog();

    expect(catalog).toEqual([]);
  });
});

describe('getService — single visible service lookup', () => {
  it('returns the visible service row for a matching id', async () => {
    const row = dbRow({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Esmaltado Semipermanente',
      sort_order: 2,
    });
    const { chain } = fakeClient({ data: [row] });
    mockFrom.mockImplementation(() => chain);

    const service = await getService('22222222-2222-4222-8222-222222222222');

    expect(service).not.toBeNull();
    expect(service?.id).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('returns null for a hidden service id (RLS is_visible filter respected in code)', async () => {
    const { chain } = fakeClient({ data: [] }); // anon RLS hides the row
    mockFrom.mockImplementation(() => chain);

    const service = await getService('44444444-4444-4444-8444-444444444444');

    expect(service).toBeNull();
  });

  it('returns null for a missing id (no rows)', async () => {
    const { chain } = fakeClient({ data: [] });
    mockFrom.mockImplementation(() => chain);

    const service = await getService('99999999-9999-4999-8999-999999999999');

    expect(service).toBeNull();
  });

  it('returns null when the row fails serviceSchema validation (defensive, no throw)', async () => {
    const { chain } = fakeClient({
      data: [dbRow({ id: '22222222-2222-4222-8222-222222222222', price_cents: -1 })],
    });
    mockFrom.mockImplementation(() => chain);

    const service = await getService('22222222-2222-4222-8222-222222222222');

    expect(service).toBeNull();
  });

  it('returns null (never throws) when Supabase env is missing', async () => {
    mockEnv.url = null;
    mockEnv.anonKey = null;

    const service = await getService('11111111-1111-4111-8111-111111111111');

    expect(service).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns null on a PostgREST error instead of throwing', async () => {
    const { chain } = fakeClient({ data: null, error: { message: 'timeout' } });
    mockFrom.mockImplementation(() => chain);

    const service = await getService('11111111-1111-4111-8111-111111111111');

    expect(service).toBeNull();
  });
});
