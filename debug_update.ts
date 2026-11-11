
import { vi } from 'vitest';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Mock the modules
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(async () => ({
    ok: true,
    ctx: { role: 'admin', userId: 'user-1', orgId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' },
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase client
const ORG = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const seededRow = {
  id: '11111111-1111-4111-8111-111111111111',
  organization_id: ORG,
  name: 'Lifting de Pestañas',
  description: '<p>Set completo</p>',
  price_cents: 25000,
  currency_code: 'ARS',
  duration_minutes: 60,
  buffer_minutes: 15,
  is_visible: true,
  sort_order: 5,
  photo_path: null,
  deposit_mode: 'percentage',
  deposit_fixed_cents: null,
  deposit_percentage_bp: 3000,
};

function makeClientMock(singleData) {
  const ops = [];
  const calls = {
    insert: [], update: [], delete: [], upsert: [], select: [], is: [], storageUpload: [], getPublicUrl: [],
  };
  const chain = (table) => {
    const b = {
      select: (...a) => (ops.push('select'), calls.select.push({ table, args: a }), b),
      insert: (...a) => (ops.push('insert'), calls.insert.push({ table, args: a }), b),
      update: (...a) => (ops.push('update'), calls.update.push({ table, args: a }), b),
      delete: (...a) => (ops.push('delete'), calls.delete.push({ table, args: a }), b),
      upsert: (...a) => (ops.push('upsert'), calls.upsert.push({ table, args: a }), b),
      eq: () => b,
      is: (...a) => (calls.is.push({ table, args: a }), b),
      in: () => b,
      order: () => b,
      limit: () => b,
      single: async () => ({ data: singleData, error: null }),
      then: (res, rej) => Promise.resolve({ data: [singleData], error: null }).then(res, rej),
    };
    return b;
  };
  const client = {
    from: (table) => chain(table),
    storage: {
      from: (bucket) => ({
        upload: async (path, file, opts) => { calls.storageUpload.push({ bucket, args: [path, file, opts] }); return { data: { path }, error: null }; },
        getPublicUrl: (path) => { calls.getPublicUrl.push({ bucket, args: [path] }); return { data: { publicUrl: `https://example.com/storage/v1/object/public/${bucket}/${path}` }; },
      }),
    },
  };
  return { client, calls, ops };
}

const mock = makeClientMock(seededRow);
const { getSupabaseServerClient } = await import('@/lib/supabase/server');
vi.mocked(getSupabaseServerClient).mockImplementation(async () => mock.client as never);

// Now import and test updateService
const { updateService } = await import('@/lib/actions/services');

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
  deposit_mode: 'percentage',
  deposit_fixed_cents: null,
  deposit_percentage_bp: 3000,
};

console.log('Calling updateService...');
const res = await updateService(seededRow.id, { ...validInput, price_cents: 30000 });
console.log('Result:', JSON.stringify(res, null, 2));
console.log('Mock calls:', JSON.stringify(mock.calls.update, null, 2));
