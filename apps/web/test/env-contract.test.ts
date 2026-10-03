import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [KHAL-A8] Env/boot contract tests — t_f7b55304.
 *
 * Audit finding (auditoria-khal-2026-10-02.md §2-A8): the env schema in
 * `apps/web/src/config/env.ts` declared NEXT_PUBLIC_TURNSTILE_SITE_KEY as
 * REQUIRED, but (a) zero modules imported config/env.ts, so the schema
 * never ran, and (b) no code consumed the site key. A lying contract:
 * required-but-dead. Resolved in conjunction with KHAL-A4 (t_28b371ff):
 * A4 wires the Turnstile widget (booking-form.tsx) and the server-side
 * verification (lib/security/turnstile.ts), pinned by its OWN test
 * (booking-antibot.test.ts). A8 makes the "required" contract REAL —
 * fail-fast at boot for the runtime contract, while `next build` must
 * never require runtime secrets. The complete A8 end-state
 * (required + wired) is the UNION of both branches; this file stays
 * green on THIS branch alone.
 *
 * Decided contract (cross-ref with 13-security's pinned test):
 *   - NEXT_PUBLIC_TURNSTILE_SITE_KEY: REQUIRED + consumed by the widget.
 *   - TURNSTILE_SECRET_KEY: OPTIONAL in the schema; optionality is paid
 *     at runtime as fail-closed DENIAL (no secret ⇒ createBooking
 *     rejects everything with captcha_failed).
 *   - The env schema executes at boot: instrumentation.ts imports it.
 *   - `next build` must not explode: instrumentation defers parsing to
 *     runtime (NEXT_PHASE=phase-production-build skips parse).
 *
 * Same static-contract pattern as a11y-p3-contract.test.ts.
 */
const repoRoot = resolve(__dirname, '../../..');

function read(appPath: string): string {
  return readFileSync(resolve(repoRoot, appPath), 'utf8');
}

describe('KHAL-A8 — env schema contract (required means required)', () => {
  const envSrc = () => read('apps/web/src/config/env.ts');

  it('NEXT_PUBLIC_TURNSTILE_SITE_KEY stays REQUIRED (widget consumer — A4)', () => {
    // A4 wires the widget in booking-form.tsx with data-sitekey; the site
    // key must not silently degrade to optional.
    expect(envSrc()).toMatch(/NEXT_PUBLIC_TURNSTILE_SITE_KEY: z\.string\(\)\.min\(1\)/);
  });

  it('TURNSTILE_SECRET_KEY stays OPTIONAL — runtime pays fail-closed, not boot (A4 contract)', () => {
    // Pinned by booking-antibot.test.ts; A4 decided this on purpose: a
    // parse-time explosion without the secret would kill the whole app.
    expect(envSrc()).toMatch(/TURNSTILE_SECRET_KEY: z\.string\(\)\.optional\(\)/);
  });

  it('SUPABASE_SERVICE_ROLE_KEY has a real consumer (mercadopago webhook)', () => {
    // The other required entry in the schema — grep-verified consumer.
    expect(read('apps/web/src/app/api/webhooks/mercadopago/route.ts')).toMatch(
      /SUPABASE_SERVICE_ROLE_KEY/
    );
  });

  it('.env.example declares every variable the env schema validates', () => {
    // Parity: each schema key (required AND optional) must appear in
    // .env.example, so deploys copy a complete contract. The examples
    // file is the deploy-facing source of truth.
    const schema = envSrc();
    const example = read('.env.example');
    const keys = [...schema.matchAll(/^\s{2}([A-Z][A-Z0-9_]+):/gm)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(3);
    for (const key of keys) {
      expect(example).toContain(key);
    }
  });

  it('.env.example does NOT declare schema-unknown variables', () => {
    // Parity both ways: an example entry the schema ignores is a
    // deploy-time lie of the opposite direction.
    const schema = envSrc();
    const example = read('.env.example');
    const exampleKeys = [...example.matchAll(/^([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]);
    for (const key of exampleKeys) {
      expect(schema).toContain(key);
    }
  });
});

describe('KHAL-A8 — the env schema actually runs at boot', () => {
  it('instrumentation.ts exists and imports the env module', () => {
    const instr = read('apps/web/src/instrumentation.ts');
    expect(instr).toMatch(/config\/env/);
  });

  it('instrumentation defers parsing during `next build` (no runtime secrets at build time)', () => {
    // CI builds without any env vars (ci.yml e2e job). If the schema
    // threw during `next build`, every PR would explode. Boot-time
    // fail-fast is for RUNTIME (dev server / production start), not for
    // the build phase.
    const instr = read('apps/web/src/instrumentation.ts');
    expect(instr).toMatch(/NEXT_PHASE/);
    expect(instr).toMatch(/phase-production-build/);
  });
});

describe('KHAL-A8 — public form sweep (contact/newsletter)', () => {
  // The audit asked to sweep other public forms. Verified: the ONLY
  // public <form> in apps/web is the booking form — no contact or
  // newsletter form exists. The Turnstile wiring for booking-form is
  // pinned by A4's own test (booking-antibot.test.ts, branch
  // khal/t_28b371ff-antibot). This is a REAL filesystem sweep, not a
  // hardcoded list: if a new public form ever lands, this pin breaks
  // and forces the Turnstile decision consciously.
  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full, out);
      } else if (/\.(tsx?|jsx?)$/.test(entry)) {
        out.push(full);
      }
    }
    return out;
  }

  it('booking-form is the only public <form> in apps/web', () => {
    const srcDir = resolve(repoRoot, 'apps/web/src');
    const forms = walk(srcDir)
      .filter((f) => readFileSync(f, 'utf8').includes('<form'))
      .map((f) => relative(repoRoot, f).replace(/\\/g, '/'));
    expect(forms).toEqual(['apps/web/src/components/booking/booking-form.tsx']);
  });
});
