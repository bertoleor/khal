import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * khal v2 token system — static contract (khal-ux-skeletons-v2, D11/D12/D13).
 *
 * The v2 redesign (docs/DESIGN.md addendum 2026-10-20) sets three global
 * disciplines that must survive future edits:
 *   D11  border-radius ≤ 2px — enforced at the Tailwind theme level so every
 *        rounded-* utility (incl. rounded-full) resolves to the 2px cap.
 *   D12  dark is the DEFAULT mode; light exists via the typographic toggle
 *        (persisted, system preference on first visit) — one accent per mode.
 *   Wordmark: TAN Nightingale (licensed), self-hosted, wordmark ONLY.
 *
 * RE-ANCHORED (FQ2 unit A, parent-authorized): the v2 token blocks that
 * used to be duplicated in BOTH apps' globals.css were extracted into ONE
 * shared source — packages/ui/src/tokens.css — imported by both apps.
 * The token assertions below now pin that shared file directly, which
 * STRENGTHENS the test's intent: a token can drift in exactly one place
 * instead of two. Each app's globals.css is still pinned for what genuinely
 * belongs to the app: the shared-source import wiring, the app-specific
 * dark --foreground (D12 web #ffffff vs D13 admin #fafafa) and the
 * per-app self-hosted woff2.
 *
 * Static source contracts follow the repo's established pattern
 * (a11y-p2-contract.test.ts, dep-audit.test.ts).
 */
const root = resolve(__dirname, '../..');

function tokens(): string {
  return readFileSync(resolve(root, 'packages/ui/src/tokens.css'), 'utf8');
}

function css(app: 'web' | 'admin'): string {
  return readFileSync(resolve(root, `apps/${app}/src/app/globals.css`), 'utf8');
}

const RADIUS_TOKENS = [
  '--radius:',
  '--radius-xs:',
  '--radius-sm:',
  '--radius-md:',
  '--radius-lg:',
  '--radius-xl:',
  '--radius-2xl:',
  '--radius-3xl:',
  '--radius-4xl:',
];

describe('khal v2 tokens — D11 radius discipline', () => {
  it.each(RADIUS_TOKENS)('shared tokens.css pins %s 2px', (token) => {
    expect(tokens()).toMatch(new RegExp(`${token.replace(':', '\\s*:\\s*')}2px`));
  });

  it('rounded-full utility joins the 2px cap (no pill boxes)', () => {
    expect(tokens()).toMatch(/@utility rounded-full[\s\S]{0,80}border-radius:\s*2px/);
  });

  it('both apps import the single shared token source', () => {
    for (const app of ['web', 'admin'] as const) {
      expect(css(app)).toMatch(/@import\s+'[^']*packages\/ui\/src\/tokens\.css'/);
    }
  });
});

describe('khal v2 tokens — wordmark font (TAN Nightingale, licensed)', () => {
  it('the shared source declares @font-face with the serif fallback stack', () => {
    const s = tokens();
    expect(s).toMatch(/@font-face[\s\S]*?font-family:\s*'TAN Nightingale'/);
    expect(s).toMatch(/--font-wordmark:\s*'TAN Nightingale',\s*'Bodoni MT',\s*Georgia,\s*serif/);
    expect(s).toMatch(/font-display:\s*swap/);
  });

  it('both apps self-host the woff2', () => {
    for (const app of ['web', 'admin'] as const) {
      expect(
        existsSync(resolve(root, `apps/${app}/public/fonts/TAN-NIGHTINGALE-Regular.woff2`))
      ).toBe(true);
    }
  });
});

describe('khal v2 tokens — D12/D13 theme modes', () => {
  it('dark is the default palette in :root (shared source)', () => {
    const s = tokens();
    expect(s).toMatch(/:root\s*\{[\s\S]*?--background:\s*#000000/);
    expect(s).toMatch(/:root\s*\{[\s\S]*?--accent:\s*#34d399/);
  });

  it('light mode overrides exist with their own single accent (emerald-700 AA)', () => {
    const s = tokens();
    expect(s).toMatch(/html\.light\s*\{[\s\S]*?--background:\s*#f6f4f1/);
    expect(s).toMatch(/html\.light\s*\{[\s\S]*?--accent:\s*#047857/);
    expect(s).toMatch(/html\.light\s*\{[\s\S]*?--foreground:\s*#101014/);
  });

  it('each app pins its own dark --foreground (web #ffffff, admin #fafafa)', () => {
    expect(css('web')).toMatch(/:root\s*\{[\s\S]*?--foreground:\s*#ffffff/);
    expect(css('web')).not.toMatch(/--foreground:\s*#fafafa/);
    expect(css('admin')).toMatch(/:root\s*\{[\s\S]*?--foreground:\s*#fafafa/);
    expect(css('admin')).not.toMatch(/--foreground:\s*#ffffff/);
  });

  it('class-based dark/light variants are wired for next-themes', () => {
    expect(tokens()).toMatch(/@custom-variant dark/);
    expect(tokens()).toMatch(/@custom-variant light/);
  });

  it('typographic toggle exists in both apps (no box, lucide icon, next-themes)', () => {
    for (const app of ['web', 'admin'] as const) {
      const dir = app === 'web' ? 'shared' : 'admin';
      const p = resolve(root, `apps/${app}/src/components/${dir}/theme-toggle.tsx`);
      expect(existsSync(p)).toBe(true);
      const s = readFileSync(p, 'utf8');
      expect(s).toContain("from 'next-themes'");
      expect(s).toMatch(/from 'lucide-react'/);
      expect(s).toContain('Cambiar modo claro/oscuro');
      // D9/D11: typographic — no border/bg box classes on the toggle.
      expect(s).not.toMatch(/border-\d|border-white|border-black|bg-emerald|bg-white|bg-zinc/);
    }
  });
});
