import { defineConfig } from 'vitest/config';
import path from 'path';

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
    // Path aliases for @/ imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './apps/web/src'),
        '@/components/button': path.resolve(__dirname, './packages/ui/src/components/button'),
        '@/components/cursor-trail': path.resolve(__dirname, './packages/ui/src/components/cursor-trail'),
      },
    },
  },
});
