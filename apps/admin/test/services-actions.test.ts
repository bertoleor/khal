import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Contract tests for the catalog server actions (khal-admin-100-operable T1).
 *
 * The admin services actions MUST speak the real DB schema:
 *   - services columns are duration_minutes / buffer_minutes (NOT duration_min)
 *   - INSERT must carry organization_id (NOT NULL + RLS org scope)
 *   - delete is SOFT (deleted_at) — appointments.service_id FK has no cascade
 *   - every mutation validates input (zod) BEFORE touching Supabase
 *   - photo upload gates MIME (image/*) and size (<= 4MB)
 *
 * RED-first: this file is written against the broken pre-rewrite actions and
 * must FAIL before T2 (GREEN rewrite). Runtime: node (no DOM) — Supabase is
 * mocked via the per-app '@/…' alias plugin (see root vitest.config.ts).
 */

const ORG = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(async () => ({
    ok: true,
    ctx: { role: 'admin', userId: 'user-1', orgId: ORG },
  })),
}));
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import {
  bulkIncrease,
  createService,
  deleteService,
  fetchServices,
  toggleVisibility,
  updateService,
  uploadServicePhoto,
} from '@/lib/actions/services';
import { getSupabaseServerClient } from '@/lib/supabase/server';

type AnyRecord = Record<string, unknown>;

function makeClientMock(
  singleData: AnyRecord | null = null,
  listData: unknown[] = [{ id: '11111111-1111-4111-8111-111111111111', price_cents: 25000 }]
) {
  const ops: string[] = [];
  const calls = {
    insert: [] as { table: string; args: unknown[] }[],
    update: [] as { table: string; args: unknown[] }[],
    delete: [] as { table: string; args: unknown[] }[],
    upsert: [] as { table: string; args: unknown[] }[],
    select: [] as { table: string; args: unknown[] }[],
    is: [] as { table: string; args: unknown[] }[],
    storageUpload: [] as { bucket: string; args: unknown[] }[],
    getPublicUrl: [] as { bucket: string; args: unknown[] }[],
  };

  // Mirrors supabase-js: builders are thenable; awaiting a chain that never
  // called .single() resolves { data, error } with the list payload.
  const chain = (table: string) => {
    const b = {
      select: (...a: unknown[]) => (ops.push('select'), calls.select.push({ table, args: a }), b),
      insert: (...a: unknown[]) => (ops.push('insert'), calls.insert.push({ table, args: a }), b),
      update: (...a: unknown[]) => (ops.push('update'), calls.update.push({ table, args: a }), b),
      delete: (...a: unknown[]) => (ops.push('delete'), calls.delete.push({ table, args: a }), b),
      upsert: (...a: unknown[]) => (ops.push('upsert'), calls.upsert.push({ table, args: a }), b),
      eq: () => b,
      is: (...a: unknown[]) => (calls.is.push({ table, args: a }), b),
      in: () => b,
      order: () => b,
      limit: () => b,
      single: async () => ({ data: singleData, error: null }),
      then: (res: unknown, rej: unknown) =>
        Promise.resolve({ data: listData, error: null }).then(res as never, rej as never),
    };
    return b;
  };

  const client = {
    from: (table: string) => chain(table),
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File, opts: unknown) => {
          calls.storageUpload.push({ bucket, args: [path, file, opts] });
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => {
          calls.getPublicUrl.push({ bucket, args: [path] });
          return {
            data: {
              publicUrl: `https://epykihchzlbbptrvvawg.supabase.co/storage/v1/object/public/${bucket}/${path}`,
            },
          };
        },
      }),
    },
  };
  return { client, calls, ops };
}

const validInput = {
  name: 'Lifting de Pestañas',
  description: '<p>Set completo</p>',
  price_cents: 25000,
  currency_code: 'ARS',
  duration_minutes: 60,
  buffer_minutes: 15,
  is_visible: true,
  sort_order: 5,
  photo_path: null,
  deposit_mode: 'percentage' as const,
  deposit_fixed_cents: null,
  deposit_percentage_bp: 3000,
};

const seededRow = {
  id: '11111111-1111-4111-8111-111111111111',
  organization_id: ORG,
  ...validInput,
  description: '<p>Set completo</p>',
};

let mock: ReturnType<typeof makeClientMock>;

beforeEach(() => {
  mock = makeClientMock(seededRow as unknown as AnyRecord);
  vi.mocked(getSupabaseServerClient).mockReset();
  vi.mocked(getSupabaseServerClient).mockImplementation(async () => mock.client as never);
});

describe('fetchServices (T1·read path)', () => {
  it('filters soft-deleted rows out of the admin list', async () => {
    await fetchServices();
    expect(mock.calls.is.some((c) => c.table === 'services' && c.args[0] === 'deleted_at')).toBe(
      true
    );
  });
});

describe('createService (T1·write path)', () => {
  it('inserts with the real schema columns AND organization_id from the session claims', async () => {
    const res: AnyRecord = (await createService(validInput)) as AnyRecord;
    expect(res?.ok).toBe(true);
    expect(mock.calls.insert).toHaveLength(1);
    const payload = mock.calls.insert[0].args[0] as AnyRecord;
    expect(payload.organization_id).toBe(ORG);
    expect(payload.duration_minutes).toBe(60);
    expect(payload.buffer_minutes).toBe(15);
    expect(payload.name).toBe('Lifting de Pestañas');
  });

  it('rejects an empty name BEFORE touching Supabase (zod gate)', async () => {
    const res: AnyRecord = (await createService({ ...validInput, name: '   ' })) as AnyRecord;
    expect(res?.ok).toBe(false);
    expect(mock.calls.insert).toHaveLength(0);
  });

  it('rejects a non-integer price BEFORE touching Supabase', async () => {
    const res: AnyRecord = (await createService({
      ...validInput,
      price_cents: 2500.5,
    })) as AnyRecord;
    expect(res?.ok).toBe(false);
    expect(mock.calls.insert).toHaveLength(0);
  });

  it('rejects deposit_mode=fixed without deposit_fixed_cents (mirrors the DB CHECK)', async () => {
    const res: AnyRecord = (await createService({
      ...validInput,
      deposit_mode: 'fixed',
      deposit_fixed_cents: null,
    })) as AnyRecord;
    expect(res?.ok).toBe(false);
    expect(mock.calls.insert).toHaveLength(0);
  });
});

describe('updateService (T1·write path)', () => {
  it('updates with schema columns and never rewrites organization_id', async () => {
    const res: AnyRecord = (await updateService(seededRow.id, {
      ...validInput,
      price_cents: 30000,
    })) as AnyRecord;
    expect(res?.ok).toBe(true);
    expect(mock.calls.update).toHaveLength(1);
    const payload = mock.calls.update[0].args[0] as AnyRecord;
    expect(payload.price_cents).toBe(30000);
    expect(payload.duration_minutes).toBe(60);
    expect('organization_id' in payload).toBe(false);
  });

  it('rejects invalid duration without an UPDATE call', async () => {
    const res: AnyRecord = (await updateService(seededRow.id, {
      ...validInput,
      duration_minutes: 0,
    })) as AnyRecord;
    expect(res?.ok).toBe(false);
    expect(mock.calls.update).toHaveLength(0);
  });
});

describe('deleteService (T1·soft delete — FK appointments.service_id has NO cascade)', () => {
  it('sets deleted_at and NEVER issues a hard delete', async () => {
    const res: AnyRecord = (await deleteService(seededRow.id)) as AnyRecord;
    expect(res?.ok).toBe(true);
    expect(mock.calls.delete).toHaveLength(0);
    expect(mock.calls.update).toHaveLength(1);
    const payload = mock.calls.update[0].args[0] as AnyRecord;
    expect(typeof payload.deleted_at).toBe('string');
  });
});

describe('toggleVisibility (T1·no read-then-flip race)', () => {
  it('issues exactly ONE update with the desired state and never pre-reads (race-free: first op is update)', async () => {
    const res: AnyRecord = (await toggleVisibility(seededRow.id, false)) as AnyRecord;
    expect(res?.ok).toBe(true);
    expect(mock.calls.update).toHaveLength(1);
    expect(mock.ops[0]).toBe('update');
    const payload = mock.calls.update[0].args[0] as AnyRecord;
    expect(payload.is_visible).toBe(false);
  });
});

describe('uploadServicePhoto (T1·gates)', () => {
  it('rejects a non-image MIME type before uploading', async () => {
    const pdf = new File(['%PDF-1.4 fake'], 'attack.pdf', { type: 'application/pdf' });
    const res: AnyRecord = (await uploadServicePhoto(pdf)) as AnyRecord;
    expect(res?.ok).toBe(false);
    expect(mock.calls.storageUpload).toHaveLength(0);
  });

  it('rejects files over 4MB before uploading', async () => {
    const big = new File(['x'.repeat(5 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
    const res: AnyRecord = (await uploadServicePhoto(big)) as AnyRecord;
    expect(res?.ok).toBe(false);
    expect(mock.calls.storageUpload).toHaveLength(0);
  });

  it('accepts a valid image and returns the bucket public URL', async () => {
    const img = new File(['fakepng'], 'look.png', { type: 'image/png' });
    const res: AnyRecord = (await uploadServicePhoto(img)) as AnyRecord;
    expect(res?.ok).toBe(true);
    expect(mock.calls.storageUpload).toHaveLength(1);
    const url = (res?.data as AnyRecord)?.url ?? res?.url ?? '';
    expect(String(url)).toContain('/storage/v1/object/public/service-photos/');
  });
});

describe('bulkIncrease (T1·math)', () => {
  it('upserts +10% (1000 bp) on the fetched prices', async () => {
    const res: AnyRecord = (await bulkIncrease(
      ['11111111-1111-4111-8111-111111111111'],
      1000
    )) as AnyRecord;
    expect(res?.ok).toBe(true);
    expect(mock.calls.upsert).toHaveLength(1);
    const rows = mock.calls.upsert[0].args[0] as AnyRecord[];
    expect(rows[0]).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      price_cents: seededRow.price_cents + Math.round(seededRow.price_cents * 0.1),
    });
  });
});
