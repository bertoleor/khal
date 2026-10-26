import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [Hero hydration — found 2026-10-23, pre-existing since F0/F1] Theme-
 * dependent render derives its output (Sun/Moon icon) from next-themes
 * `resolvedTheme`. On the server that value is undefined (renders dark); on
 * the client the first render already knows the system/stored theme — the
 * SSR HTML and the hydration render disagree and React 19 throws.
 *
 * The next-themes documented pattern pins the fix: render the SSR default
 * (dark) until mounted, then apply the real theme — every theme-derived
 * output must pass through the mounted gate. The root layout must also carry
 * suppressHydrationWarning on <html> (next-themes requirement: its inline
 * script patches the class attribute before hydration).
 *
 * v7 (T2): FlowGradientHero is retired with the animated fondo (S1 — the
 * home is a linktree now), so the hero case went with it; the contract
 * keeps guarding the surviving theme-dependent surface (ThemeToggle), the
 * useHydrated hook itself and the layout wiring.
 */
const read = (rel: string) => readFileSync(join(__dirname, '..', rel), 'utf-8');

describe('theme-dependent render is hydration-safe (toggle + wiring)', () => {
  it('ThemeToggle gates the Sun/Moon icon behind useHydrated', () => {
    const src = read('src/components/shared/theme-toggle.tsx');
    expect(src).toContain("import { useHydrated } from '@/lib/use-hydrated'");
    expect(src).toMatch(/isDark\s*=\s*!mounted\s*\|\|\s*resolvedTheme\s*!==\s*'light'/);
  });

  it('the gate is the React 19 canonical useSyncExternalStore hook (no setState-in-effect)', () => {
    const src = read('src/lib/use-hydrated.ts');
    expect(src).toContain('useSyncExternalStore');
    // The repo lint (react-hooks/set-state-in-effect) rejects the classic
    // setState-on-mount pattern — the hook must not use it.
    expect(src).not.toMatch(/setMounted/);
    expect(src).not.toMatch(/useEffect/);
  });

  it('root layout carries suppressHydrationWarning on <html> (next-themes class patch)', () => {
    const src = read('src/app/[locale]/layout.tsx');
    expect(src).toMatch(/<html[^>]*suppressHydrationWarning/);
  });
});
