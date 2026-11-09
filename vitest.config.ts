import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['apps/**/test/**/*.test.{ts,tsx}', 'packages/**/test/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    // Transform JSX for tests
    transformMode: {
      web: [/\.[jt]sx$/],
    },
  },
});
