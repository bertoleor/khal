import { getRole, requireAuth } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * [ORN-79] Unit tests for the admin auth layer (mock -> Supabase JWT).
 *
 * TDD target: `requireAuth` must resolve the caller's role from the verified
 * session's JWT `app_metadata.role` claim. The client-settable `khal_role`
 * cookie mock must NOT grant admin anywhere once Supabase env is configured.
 *
 * These tests mock `@supabase/ssr` at module level: `auth.getUser()` is the
 * trust boundary — its response decides the outcome. No real network.
 */

const mockGetUser = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

// NOTE: no `next/headers` mock needed — after ORN-79 `requireAuth` never reads
// cookies (the mock fallback is gone) and `server.ts` is mocked above, so the
// real module (which imports `next/headers`) never loads in this test.

function userWith(appMetadata: Record<string, unknown> | undefined) {
  return { data: { user: { id: 'user-1', app_metadata: appMetadata } }, error: null };
}

beforeEach(() => {
  vi.resetModules();
  mockGetUser.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requireAuth — JWT app_metadata.role (happy + deny paths)', () => {
  it('grants admin when the verified session carries app_metadata.role = admin', async () => {
    mockGetUser.mockResolvedValueOnce(userWith({ role: 'admin' }));
    const res = await requireAuth();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.ctx.role).toBe('admin');
      expect(res.ctx.userId).toBe('user-1');
    }
  });

  it('grants manager when the verified session carries app_metadata.role = manager', async () => {
    mockGetUser.mockResolvedValueOnce(userWith({ role: 'manager' }));
    const res = await requireAuth();
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.ctx.role).toBe('manager');
  });

  it('denies a logged-in user whose claim is missing (deny by default)', async () => {
    mockGetUser.mockResolvedValueOnce(userWith(undefined));
    const res = await requireAuth();
    expect(res.ok).toBe(false);
  });

  it('denies a logged-in user whose claim is an arbitrary string', async () => {
    mockGetUser.mockResolvedValueOnce(userWith({ role: 'superuser' }));
    const res = await requireAuth();
    expect(res.ok).toBe(false);
  });

  it('denies when user_metadata carries role=admin but app_metadata does not (user-editable claim is not trusted)', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-2', app_metadata: {}, user_metadata: { role: 'admin' } } },
      error: null,
    });
    const res = await requireAuth();
    expect(res.ok).toBe(false);
  });

  it('denies when auth.getUser() returns an error', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'bad jwt' } });
    const res = await requireAuth();
    expect(res.ok).toBe(false);
  });

  it('denies when auth.getUser() throws (network/infra) — no mock-cookie escape hatch', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('network down'));
    const res = await requireAuth();
    expect(res.ok).toBe(false);
  });
});

describe('requireAuth — mock khal_role cookie must NOT authenticate', () => {
  it('rejects a request whose only "credential" is a khal_role cookie (no session -> getUser denies)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'no session' } });
    const res = await requireAuth();
    expect(res.ok).toBe(false);
  });
});

describe('getRole — Edge middleware variant', () => {
  function requestWith(cookies: Record<string, string>): NextRequest {
    return {
      cookies: {
        getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
        get: (name: string) => {
          const value = cookies[name];
          return value === undefined ? undefined : { name, value };
        },
      },
    } as unknown as NextRequest;
  }

  it('treats a bare khal_role cookie as anon (no Supabase session cookies)', () => {
    const role = getRole(requestWith({ khal_role: 'admin' }));
    expect(role).toBe('anon');
  });

  it('returns anon when Supabase session cookies exist but role is unresolved in Edge', () => {
    const role = getRole(requestWith({ 'sb-xyz-auth-token': 'x' }));
    expect(role).toBe('anon');
  });
});
