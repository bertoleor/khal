import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Modern automatic JSX runtime so .tsx components (authored for Next's automatic
  // runtime) compile under Vitest without a plugin and without importing React.
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      // apps/web uses the `@/*` alias (its tsconfig paths) — expose it to Vitest so
      // webhook route tests can import `@/lib/mercadopago` / `@/lib/notify`.
      '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['packages/**/test/**/*.test.{ts,tsx}', 'apps/**/test/**/*.test.{ts,tsx}'],
  },
});
