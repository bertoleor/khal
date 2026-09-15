import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Modern automatic JSX runtime so .tsx components (authored for Next's automatic
  // runtime) compile under Vitest without a plugin and without importing React.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['packages/**/test/**/*.test.{ts,tsx}', 'apps/**/test/**/*.test.{ts,tsx}'],
  },
});
