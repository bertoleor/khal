import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/next-env.d.ts',
      // Sibling git worktrees (agent tooling, gitignored): each one is a full
      // checkout of another branch and lints as if it were project source.
      // Scanning them makes `pnpm lint` fail on other cards' in-flight files.
      '.worktrees/**',
    ],
  },
  js.configs.recommended,
  // Node tooling scripts (E2E stub server, config files): bare Node globals
  // (process, console, URL, Buffer, fetch, setTimeout, AbortSignal) are not
  // in js.configs.recommended's browser-ish default environment.
  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        AbortSignal: 'readonly',
      },
    },
  },
  ...tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  prettier,
  {
    rules: {
      'no-console': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  }
);
