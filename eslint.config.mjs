import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import promise from 'eslint-plugin-promise';
import reactHooks from 'eslint-plugin-react-hooks';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/.worktrees/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/next-env.d.ts',
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
  // ---------------------------------------------------------------------------
  // FQ1 (docs/plans/plan-accion-2026-10-23-calidad-codigo.md): the six plugins
  // that were installed but never wired. Presets are "recommended" — not
  // "all" — so the signal stays strong and the noise low.
  // ---------------------------------------------------------------------------
  // security: OWASP-style insecure patterns (non-literal fs/regexp, unsafe
  // dynamic requires). Complements semgrep.yml (SAST) at the lint tier.
  security.configs.recommended,
  // sonarjs: bug-pattern heuristics (no-all-duplicated-branches, cognitive
  // complexity...) on top of js.recommended.
  sonarjs.configs.recommended,
  // jsx-a11y: DOM-level accessibility rules — complements the repo's a11y
  // contract tests (a11y-p2/p3) with the plugin's structural checks. The
  // installed version predates flat presets (configs.flat), so the v6
  // recommended rule set is hand-wired; the preset upgrade lands with the
  // FQ4 toolchain decision.
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/autocomplete-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-aria-hidden-on-focusable': 'error',
      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },
  // import: structural import rules MINUS import/no-unresolved — aliased
  // module resolution (@khal/*, @/*) is TypeScript's job, already gated by
  // `turbo run typecheck`; a resolver-less no-unresolved would false-positive
  // every aliased import in the monorepo. The installed version predates
  // flat presets, so the rule set is hand-picked (structural, resolver-free).
  {
    plugins: { import: importPlugin },
    rules: {
      'import/no-duplicates': 'error',
      'import/no-named-as-default': 'error',
      'import/no-named-as-default-member': 'error',
      'import/first': 'error',
      'import/export': 'error',
    },
  },
  // promise: structural async-flow hygiene. no-floating-promises stays
  // typescript-eslint's job.
  promise.configs['flat/recommended'],
  // unused-imports: autofixable dead-import cleanup. The vars/args policy
  // (the ^_ ignore pattern) MOVES here from @typescript-eslint/no-unused-vars
  // so the same finding is reported (and fixed) exactly once.
  {
    plugins: { 'unused-imports': unusedImports },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Trusted tooling zones (unit tests, e2e harness, CI scripts): fixture
  // code by definition — no user input, no secrets, dynamic paths and
  // localhost http are the DESIGN. The security/sonarjs patterns that make
  // sense for app code would fire 100+ false positives here:
  //   * non-literal fs/regexp: tests read computed fixture paths by design;
  //   * object-injection: record/map access with dynamic keys in fixtures;
  //   * clear-text protocols: the e2e stub is http://127.0.0.1 — TLS on
  //     loopback would be theater;
  //   * hardcoded-secret-signatures: HMAC fixtures need literal test keys;
  //   * super-linear-regex/nested-functions/complexity/parameterized-tests:
  //     contract-test style is deliberate — dense single-purpose specs;
  //   * no-os-command-from-path: server.mjs spawns the dev server on purpose.
  {
    files: ['**/test/**', '**/tests/**', '**/e2e/**', 'scripts/**'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'off',
      'sonarjs/no-clear-text-protocols': 'off',
      'sonarjs/super-linear-regex': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/prefer-specific-assertions': 'off',
      'sonarjs/parameterized-tests': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/hardcoded-secret-signatures': 'off',
      'sonarjs/no-os-command-from-path': 'off',
      'promise/always-return': 'off',
    },
  },
  // The domain-vocabulary package IS named type aliases — UUID, Cents and
  // friends carry semantics that raw primitives do not; sonarjs wants them
  // "inlined" which would delete the vocabulary on purpose.
  {
    files: ['packages/types/src/**'],
    rules: {
      'sonarjs/redundant-type-aliases': 'off',
    },
  },
  // TODO comments are tracked in the ODD feature documents; the repo treats
  // them as intentional work markers, not smells.
  {
    rules: {
      'sonarjs/todo-tag': 'off',
    },
  },
  // ---------------------------------------------------------------------------
  prettier,
  {
    rules: {
      'no-console': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  // CommonJS Node tooling (design-qa gate, snapshot tooling): legit require(),
  // console and process usage — CI scripts, never app code. Trusted tooling
  // also relaxes the security plugin's dynamic-fs/child-process patterns:
  // these scripts legitimately build paths from config and spawn tooling.
  {
    files: ['scripts/**/*.cjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'security/detect-child-process': 'off',
      'security/detect-non-literal-fs-filename': 'off',
    },
  }
);
