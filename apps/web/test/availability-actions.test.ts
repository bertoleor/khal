import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * [KHAL A2 / t_715635aa] Unit tests for the availability server module —
 * mocks/schedule -> get_availability RPC swap.
 *
 * TDD target: the reservar page must offer slots computed by the
 * `get_availability` SECURITY DEFINER RPC (migration 0010), not the
 * fictional mocks/schedule fixtures. The mocked supabase-js client is the
 * trust boundary — no real network.
 *
 * Fail-soft mirrors catalog.ts/booking.ts: missing env -> all days closed
 * (never throws, local dev must render); RPC error or invalid payload ->
 * that day is closed (fail-closed, no sensitive logging).
 */

const mockEnv = vi.hoisted(() => ({ url: null as string | null, anonKey: null as string | null }));
const mockRpc = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/booking-client', () => ({
  readBookingSupabaseEnv: vi.fn(() =>
    mockEnv.url && mockEnv.anonKey ? { url: mockEnv.url, anonKey: mockEnv.anonKey } : null
  ),
  createBookingSupabaseClient: vi.fn(() => ({ rpc: mockRpc })),
}));

import { availabilitySchema, getAvailability } from '@/lib/actions/availability';

const SERVICE_ID = '11111111-1111-4111-8111-111111111111';

/** Valid RPC jsonb payload (0010 contract). */
function rpcPayload(overrides: Record<string, unknown> = {}) {
  return {
    date: '2026-10-12',
    closed: false,
    slots: ['09:00', '09:15', '10:30'],
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetModules();
  mockEnv.url = 'https://khal.supabase.co';
  mockEnv.anonKey = 'anon-key';
  mockRpc.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('availabilitySchema — RPC jsonb contract (zod v3)', () => {
  it('parses a valid payload', () => {
    const parsed = availabilitySchema.safeParse(rpcPayload());
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.slots).toEqual(['09:00', '09:15', '10:30']);
    }
  });

  it('rejects a payload missing required fields', () => {
    expect(availabilitySchema.safeParse({ date: '2026-10-12' }).success).toBe(false);
    expect(availabilitySchema.safeParse({ closed: false, slots: [] }).success).toBe(false);
  });

  it('rejects wrong types: closed as string, slots as object, bad slot format', () => {
    expect(availabilitySchema.safeParse(rpcPayload({ closed: 'no' })).success).toBe(false);
    expect(availabilitySchema.safeParse(rpcPayload({ slots: { '0': '09:00' } })).success).toBe(
      false
    );
    // Slots must be HH:MM strings — create_booking parses them into minutes.
    expect(availabilitySchema.safeParse(rpcPayload({ slots: ['9:00'] })).success).toBe(false);
    expect(availabilitySchema.safeParse(rpcPayload({ slots: ['09:00', '25:99'] })).success).toBe(
      false
    );
  });

  it('rejects a malformed date string', () => {
    expect(availabilitySchema.safeParse(rpcPayload({ date: '12/10/2026' })).success).toBe(false);
  });
});

describe('getAvailability — RPC -> AvailabilityDay mapper', () => {
  it('calls the get_availability RPC with p_service_id and p_date', async () => {
    mockRpc.mockResolvedValue({ data: rpcPayload(), error: null });

    await getAvailability(SERVICE_ID, '2026-10-12');

    expect(mockRpc).toHaveBeenCalledWith('get_availability', {
      p_service_id: SERVICE_ID,
      p_date: '2026-10-12',
    });
  });

  it('maps a valid RPC payload to an open day with slots', async () => {
    mockRpc.mockResolvedValue({ data: rpcPayload(), error: null });

    const day = await getAvailability(SERVICE_ID, '2026-10-12');

    expect(day).toEqual({
      date: '2026-10-12',
      closed: false,
      slots: ['09:00', '09:15', '10:30'],
    });
  });

  it('maps a closed day payload (empty slots)', async () => {
    mockRpc.mockResolvedValue({
      data: rpcPayload({ closed: true, slots: [] }),
      error: null,
    });

    const day = await getAvailability(SERVICE_ID, '2026-10-12');

    expect(day).toEqual({ date: '2026-10-12', closed: true, slots: [] });
  });

  it('returns a closed day (never throws) when Supabase env is missing', async () => {
    mockEnv.url = null;
    mockEnv.anonKey = null;

    const day = await getAvailability(SERVICE_ID, '2026-10-12');

    expect(day).toEqual({ date: '2026-10-12', closed: true, slots: [] });
    // Fail-soft like catalog.ts: no client is even built.
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns a closed day on a PostgREST/RPC error (fail-closed)', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'function public.get_availability does not exist' },
    });

    const day = await getAvailability(SERVICE_ID, '2026-10-12');

    expect(day).toEqual({ date: '2026-10-12', closed: true, slots: [] });
  });

  it('returns a closed day when the payload fails schema validation (defensive)', async () => {
    mockRpc.mockResolvedValue({ data: { date: '2026-10-12', closed: 'nope' }, error: null });

    const day = await getAvailability(SERVICE_ID, '2026-10-12');

    expect(day).toEqual({ date: '2026-10-12', closed: true, slots: [] });
  });

  it('returns a closed day when the RPC resolves null data', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const day = await getAvailability(SERVICE_ID, '2026-10-12');

    expect(day).toEqual({ date: '2026-10-12', closed: true, slots: [] });
  });
});
