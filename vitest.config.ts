import { isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * [ORN-79] Per-app `@/` alias resolution for unit tests.
 *
 * Each khal app maps `@/*` to its own `./src/*` in its tsconfig. Vitest
 * aliases are global (they cannot vary per importing file), so a plugin
 * resolves `@/...` based on which app the importing file lives in.
 *
 * The final resolution is delegated to Vite's own resolver (`this.resolve`)
 * so that `import '@/x'` inside app code and `vi.mock('@/x')` inside tests
 * converge on the exact same normalized module id — otherwise vitest's mock
 * registry misses the module and the real implementation runs.
 */
export default defineConfig({
  // Modern automatic JSX runtime so .tsx components (authored for Next's automatic
  // runtime) compile under Vitest without a plugin and without importing React.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    // tests/unit = cross-app contract tests (design system, v2 tokens) —
    // they read sources of several apps at once, so they live at the root.
    include: [
      'packages/**/test/**/*.test.{ts,tsx}',
      'apps/**/test/**/*.test.{ts,tsx}',
      'tests/unit/**/*.test.{ts,tsx}',
      // Cwd-relative pattern so the per-package `vitest run` (turbo's test
      // task runs from the package dir) finds the package's own test/ dir —
      // the root-relative patterns above match nothing from a package cwd
      // (CI failure 2026-10-23: "No test files found" for @khal/db and
      // @khal/validations). From the root this pattern matches no file
      // (no root-level test/ dir), so the root suite is unchanged.
      'test/**/*.test.{ts,tsx}',
    ],
  },
  plugins: [
    {
      // enforce pre: resolve @/ per importing app BEFORE the global '@' alias
      // (added in merge with payment-a11y) rewrites it to apps/web only.
      enforce: 'pre',
      name: 'per-app-at-alias',
      async resolveId(source, importer) {
        if (!source.startsWith('@/')) return null;
        if (!importer) return null;
        const appsDir = fileURLToPath(new URL('./apps', import.meta.url));
        const rel = relative(appsDir, importer);
        if (rel.startsWith('..') || isAbsolute(rel)) return null;
        const appName = rel.split(sep)[0];
        // No fs existence probe on the computed `apps/<app>/src` root: when
        // the directory does not exist, the candidate path simply fails to
        // resolve below (this.resolve -> null -> fall through to the global
        // '@' alias). A dynamic existsSync on a computed path is exactly the
        // pattern security/detect-non-literal-fs-filename exists to catch;
        // the resolver already answers the question the probe asked.
        const candidate = join(appsDir, appName, 'src', source.slice(2));
        const resolved = await this.resolve(candidate, importer, { skipSelf: true });
        return resolved ? resolved.id : null;
      },
    },
  ],
});
