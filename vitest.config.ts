import { existsSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
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
  test: {
    environment: 'node',
    include: ['packages/**/test/**/*.test.{ts,tsx}', 'apps/**/test/**/*.test.{ts,tsx}'],
  },
  plugins: [
    {
      name: 'per-app-at-alias',
      async resolveId(source, importer) {
        if (!source.startsWith('@/')) return null;
        if (!importer) return null;
        const appsDir = resolve(__dirname, 'apps');
        const rel = relative(appsDir, importer);
        if (rel.startsWith('..') || isAbsolute(rel)) return null;
        const appName = rel.split(sep)[0];
        const srcRoot = join(appsDir, appName, 'src');
        if (!existsSync(srcRoot)) return null;
        const candidate = join(srcRoot, source.slice(2));
        const resolved = await this.resolve(candidate, importer, { skipSelf: true });
        return resolved ? resolved.id : null;
      },
    },
  ],
});
