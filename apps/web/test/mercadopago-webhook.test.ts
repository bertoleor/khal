import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Next runtime before importing the route module. vi.hoisted keeps the
// factory's dependency above the hoisted vi.mock call — a plain top-level
// const is a TDZ ReferenceError when the factory runs (2026-09-17 suite run).
const NextResponseJson = vi.hoisted(() =>
  vi.fn((body: unknown, init?: { status?: number }) => ({
    status: init?.status ?? 200,
    body,
  }))
);

vi.mock('next/server', () => ({
  NextResponse: { json: NextResponseJson },
  NextRequest: class {
    headers: Map<string, string>;
    body: unknown;
    nextUrl: { searchParams: URLSearchParams } | null;
    constructor(opts: { headers?: [string, string][]; body?: unknown; url?: string }) {
      this.headers = new Map(opts.headers ?? []);
      this.body = opts.body;
      this.nextUrl = opts.url ? { searchParams: new URL(opts.url).searchParams } : null;
    }
    json() {
      return Promise.resolve(this.body);
    }
  },
}));

// Mock the Mercado Pago / Supabase / notify dependencies.
const mercadopago = vi.hoisted(() => ({
  verifyMercadoPagoSignature: vi.fn(() => true),
  getMercadoPagoPayment: vi.fn(),
  readMercadoPagoEnv: vi.fn(() => ({
    accessToken: 'tk',
    webhookSecret: 'sec',
    appUrl: 'http://x',
  })),
}));

const notify = vi.hoisted(() => ({ notifyBookingConfirmed: vi.fn(async () => true) }));

const supabase = vi.hoisted(() => {
  const insertState = { data: [{ event_key: 'payment:123' }], error: null as unknown };
  const updates: { appointmentId?: string; count?: number } = {};
  const state = {
    deletedKeys: [] as string[],
    deleteError: null as unknown,
    confirmError: null as unknown,
  };
  return {
    _insertState: insertState,
    _updates: updates,
    _deleteState: state,
    createClient: vi.fn(() => ({
      from: vi.fn((_table: string) => ({
        upsert: () => ({
          select: async () => ({ ...insertState }),
        }),
        update: () => ({
          eq: () => ({
            eq: async () => {
              if (state.confirmError) {
                return { error: state.confirmError, count: null };
              }
              const out = { error: null as unknown, count: updates.count ?? 0 };
              return out;
            },
          }),
        }),
        delete: () => ({
          eq: async (_col: string, key: string) => {
            if (state.deleteError) {
              return { error: state.deleteError };
            }
            state.deletedKeys.push(key);
            return { error: null };
          },
        }),
      })),
    })),
  };
});

vi.mock('@/lib/mercadopago', () => mercadopago);
vi.mock('@/lib/notify', () => notify);
vi.mock('@supabase/supabase-js', () => supabase);

import { POST } from '@/app/api/webhooks/mercadopago/route';

const validUuid = '123e4567-e89b-12d3-a456-426614174000';

// Typed handle on the MOCKED NextRequest: at runtime this is the local class
// above, but tsc checks the test file against the REAL next/server types, so
// the ergonomic constructor call needs this cast (headers as tuple, body as
// plain object — not a RequestInfo/ReadableStream).
async function makeRequest(opts: { headers?: [string, string][]; body?: unknown; url?: string }) {
  const Ctor = (await import('next/server')).NextRequest as unknown as new (opts: {
    headers?: [string, string][];
    body?: unknown;
    url?: string;
  }) => { headers: Map<string, string>; body: unknown };
  return new Ctor(opts);
}

function auth(): [string, string][] {
  return [
    ['x-signature', 'ts=1,v1=abc'],
    ['x-request-id', 'req-1'],
  ];
}

describe('MP webhook route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mercadopago.verifyMercadoPagoSignature.mockReturnValue(true);
    mercadopago.readMercadoPagoEnv.mockReturnValue({
      accessToken: 'tk',
      webhookSecret: 'sec',
      appUrl: 'http://x',
    });
    supabase._insertState.data = [{ event_key: 'payment:123' }];
    supabase._insertState.error = null;
    supabase._updates.count = 1;
    supabase._deleteState.deletedKeys = [];
    supabase._deleteState.deleteError = null;
    supabase._deleteState.confirmError = null;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://db';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
  });

  it('firma inválida → 401, antes que nada', async () => {
    mercadopago.verifyMercadoPagoSignature.mockReturnValue(false);
    const req = await makeRequest({
      headers: auth(),
      body: { action: 'payment.created', data: { id: 123 } },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
    expect(mercadopago.getMercadoPagoPayment).not.toHaveBeenCalled();
  });

  it('replay duplicado → ack, sin doble confirm (insert 0 filas)', async () => {
    supabase._insertState.data = [];
    mercadopago.getMercadoPagoPayment.mockResolvedValue({
      id: 123,
      status: 'approved',
      transaction_amount: 100,
      currency_id: 'ARS',
      external_reference: validUuid,
    });
    const req = await makeRequest({
      headers: auth(),
      body: { action: 'payment.approved', data: { id: 123 } },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true, duplicate: true });
    expect(notify.notifyBookingConfirmed).not.toHaveBeenCalled();
  });

  it('merchant_order sin data → ack inmediato', async () => {
    const req = await makeRequest({
      headers: auth(),
      body: { topic: 'merchant_order' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(mercadopago.verifyMercadoPagoSignature).not.toHaveBeenCalled();
  });

  it('payment no approved → ack sin confirmar', async () => {
    mercadopago.getMercadoPagoPayment.mockResolvedValue({
      id: 123,
      status: 'pending',
      transaction_amount: 100,
      currency_id: 'ARS',
      external_reference: validUuid,
    });
    const req = await makeRequest({
      headers: auth(),
      body: { action: 'payment.created', data: { id: 123 } },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true, status: 'pending' });
    expect(notify.notifyBookingConfirmed).not.toHaveBeenCalled();
  });

  it('firma inválida → 401 even with approved payment (502 no enmascara 401)', async () => {
    mercadopago.verifyMercadoPagoSignature.mockReturnValue(false);
    mercadopago.getMercadoPagoPayment.mockRejectedValue(new Error('down'));
    const req = await makeRequest({
      headers: auth(),
      body: { action: 'payment.approved', data: { id: 123 } },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it('MP delivery via query params (?data.id=&type=payment) → procesa igual', async () => {
    // MP manda la identidad del evento también como query params; los SDKs
    // oficiales leen req.query['data.id'] para validar la firma.
    mercadopago.getMercadoPagoPayment.mockResolvedValue({
      id: 123,
      status: 'approved',
      transaction_amount: 100,
      currency_id: 'ARS',
      external_reference: validUuid,
    });
    const req = await makeRequest({
      headers: auth(),
      body: { action: 'payment.updated', api_version: 'v1' }, // sin data.id en body
      url: 'https://x/api/webhooks/mercadopago?data.id=123&type=payment',
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mercadopago.getMercadoPagoPayment).toHaveBeenCalledWith('tk', '123');
    expect(mercadopago.verifyMercadoPagoSignature).toHaveBeenCalledWith(
      expect.objectContaining({ dataId: '123' })
    );
    expect(notify.notifyBookingConfirmed).toHaveBeenCalled();
  });

  it('claim ok pero confirm UPDATE falla → 500 + rollback del claim (no deja la reserva trancada)', async () => {
    mercadopago.getMercadoPagoPayment.mockResolvedValue({
      id: 123,
      status: 'approved',
      transaction_amount: 100,
      currency_id: 'ARS',
      external_reference: validUuid,
    });
    // UPDATE appointments falla → el claim debe liberarse para que el reintento
    // de MP no se deduplique y pueda correr el camino completo de nuevo.
    supabase._updates.count = undefined;
    supabase._deleteState.confirmError = { message: 'db down' };
    const req = await makeRequest({
      headers: auth(),
      body: { action: 'payment.approved', data: { id: 123 } },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(500);
    expect(supabase._deleteState.deletedKeys).toContain('payment.approved:123');
    expect(notify.notifyBookingConfirmed).not.toHaveBeenCalled();
  });

  it('rollback del claim falla → igual 500, sin crash (best-effort)', async () => {
    mercadopago.getMercadoPagoPayment.mockResolvedValue({
      id: 123,
      status: 'approved',
      transaction_amount: 100,
      currency_id: 'ARS',
      external_reference: validUuid,
    });
    supabase._updates.count = undefined;
    supabase._deleteState.confirmError = { message: 'db down' };
    supabase._deleteState.deleteError = { message: 'delete also down' };
    const req = await makeRequest({
      headers: auth(),
      body: { action: 'payment.approved', data: { id: 123 } },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(500);
    expect(notify.notifyBookingConfirmed).not.toHaveBeenCalled();
  });
});
