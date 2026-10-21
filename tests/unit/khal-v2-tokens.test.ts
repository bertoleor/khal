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
 * Static source contracts follow the repo's established pattern
 * (a11y-p2-contract.test.ts, dep-audit.test.ts).
 */
const root = resolve(__dirname, '../..');

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
  it.each(RADIUS_TOKENS)('web globals.css pins %s 2px', (token) => {
    expect(css('web')).toMatch(new RegExp(`${token.replace(':', '\\s*:\\s*')}2px`));
  });

  it.each(RADIUS_TOKENS)('admin globals.css pins %s 2px', (token) => {
    expect(css('admin')).toMatch(new RegExp(`${token.replace(':', '\\s*:\\s*')}2px`));
  });

  it('rounded-full utility joins the 2px cap in both apps (no pill boxes)', () => {
    for (const app of ['web', 'admin'] as const) {
      expect(css(app)).toMatch(/@utility rounded-full[\s\S]{0,80}border-radius:\s*2px/);
    }
  });
});

describe('khal v2 tokens — wordmark font (TAN Nightingale, licensed)', () => {
  it('both apps self-host the woff2 and declare @font-face with serif fallback', () => {
    for (const app of ['web', 'admin'] as const) {
      const s = css(app);
      expect(s).toMatch(/@font-face[\s\S]*?font-family:\s*'TAN Nightingale'/);
      expect(s).toMatch(/--font-wordmark:\s*'TAN Nightingale',\s*'Bodoni MT',\s*Georgia,\s*serif/);
      expect(s).toMatch(/font-display:\s*swap/);
      expect(
        existsSync(resolve(root, `apps/${app}/public/fonts/TAN-NIGHTINGALE-Regular.woff2`))
      ).toBe(true);
    }
  });
});

describe('khal v2 tokens — D12/D13 theme modes', () => {
  it('dark is the default palette in :root for both apps', () => {
    for (const app of ['web', 'admin'] as const) {
      const s = css(app);
      expect(s).toMatch(/:root\s*\{[\s\S]*?--background:\s*#000000/);
      expect(s).toMatch(/:root\s*\{[\s\S]*?--accent:\s*#34d399/);
    }
  });

  it('light mode overrides exist with its own single accent (emerald-700 AA)', () => {
    for (const app of ['web', 'admin'] as const) {
      const s = css(app);
      expect(s).toMatch(/html\.light\s*\{[\s\S]*?--background:\s*#f6f4f1/);
      expect(s).toMatch(/html\.light\s*\{[\s\S]*?--accent:\s*#047857/);
    }
  });

  it('class-based dark/light variants are wired for next-themes', () => {
    for (const app of ['web', 'admin'] as const) {
      expect(css(app)).toMatch(/@custom-variant dark/);
      expect(css(app)).toMatch(/@custom-variant light/);
    }
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
