import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Login contract (khal-admin-100-operable T3) — static source asserts.
 *
 * The admin login must be a REAL Supabase sign-in (the ORN-80 TODO): OTP
 * magic code with shouldCreateUser:false (strangers cannot mint accounts),
 * verifyOtp type 'email', optional password path, and NO legacy mock-cookie
 * or deprecated execCommand anywhere near the flow.
 */

const SRC = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf-8');

describe('login real (T3 contract)', () => {
  it('the login page renders the real form component (not an informational notice)', () => {
    const page = SRC('app', 'login', 'page.tsx');
    expect(page).toContain('<LoginForm />');
    expect(page).not.toContain("t('notice')");
    // The old unfinished-work marker is gone (a TODO block line, not prose):
    expect(page).not.toMatch(/^\s*\/\/\s*TODO/m);
  });

  it('OTP flow: signInWithOtp with shouldCreateUser:false', () => {
    const form = SRC('components', 'admin', 'login-form.tsx');
    expect(form).toContain('signInWithOtp');
    expect(form).toContain('shouldCreateUser: false');
    expect(form).toContain("type: 'email'");
    expect(form).toContain('verifyOtp');
  });

  it('password path exists for staff that set one', () => {
    const form = SRC('components', 'admin', 'login-form.tsx');
    expect(form).toContain('signInWithPassword');
  });

  it('browser client uses @supabase/ssr createBrowserClient (cookies for middleware/actions)', () => {
    const browser = SRC('lib', 'supabase', 'browser.ts');
    expect(browser).toContain('createBrowserClient');
  });

  it('errors surface via role="alert" and never leak raw provider messages as the only UI', () => {
    const form = SRC('components', 'admin', 'login-form.tsx');
    expect(form).toContain('role="alert"');
    expect(form).toContain('errors.generic');
  });

  it('no deprecated execCommand in the login flow (cookie-mock auth denial is covered by auth.test.ts)', () => {
    const form = SRC('components', 'admin', 'login-form.tsx');
    expect(form).not.toContain('execCommand');
    const auth = SRC('lib', 'auth.ts');
    // requireAuth never READS a role cookie — only verified JWT claims
    // (dynamic proof lives in auth.test.ts: bare khal_role cookie -> deny).
    expect(auth).not.toMatch(/cookies?\([^)]*khal_role/);
  });

  it('requireAuth resolves orgId from the app_metadata claim (org-scoped inserts)', () => {
    const auth = SRC('lib', 'auth.ts');
    expect(auth).toContain('orgId');
    expect(auth).toContain('org_id');
  });
});
