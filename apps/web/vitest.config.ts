import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components/button': path.resolve(__dirname, '../../packages/ui/src/components/button'),
      '@/components/cursor-trail': path.resolve(__dirname, '../../packages/ui/src/components/cursor-trail'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    transformMode: {
      web: [/\.[jt]sx$/],
    },
  },
});
