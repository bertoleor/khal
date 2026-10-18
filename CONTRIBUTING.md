# Contributing — KHAL

> **Búsqueda:** keywords: `khal, contributing, pr checklist, gates, pnpm, turbo, monorepo, lint, typecheck, vitest, playwright, changesets, visual regression` · clasificación: `contribución` · estado: `canónico` · actualizado: 2026-10-17
> Parte de: [[README]] · Relacionados: [[ARCHITECTURE]], [[SECURITY]], [[CHANGELOG]], [[docs/DESIGN]], [[docs/06-estado-gates]]

KHAL is a pnpm + Turborepo monorepo (Next 15.5 / React 19 / TS strict / Tailwind v4 /
Supabase / zod, per `AGENTS.md`). The gates below are the repo's real commands — verified
against `package.json` and CI on 2026-10-17 (trail at the bottom).

## Getting set up

```bash
pnpm install
pnpm dev          # turbo run dev
```

`packageManager` is pinned to `pnpm@12.3.4` — use exactly that version (CI installs with
`pnpm install --frozen-lockfile` on Node 20). Copy `.env.example` to `.env.local`.
**Never commit env files.**

## The gates — run before every PR

| Command | What it is | Receipt 2026-10-17 |
|---|---|---|
| `pnpm lint` | `eslint . --max-warnings 0` | green |
| `pnpm typecheck` | `turbo run typecheck` | green (8/8 tasks) |
| `pnpm test` | `vitest run` (runs the packages' suites from the root) | runs; currently red on in-flight work — 21 passed / 9 failed (30 files), payment/a11y failures on the uncommitted main worktree — must be green before merge |
| `pnpm format:check` | `prettier --check .` (fix with `pnpm format`) | CI gate (blocking) |
| `pnpm e2e` | `playwright test` | CI E2E job |

CI (`.github/workflows/ci.yml`, Node 20, Turborepo remote cache via OIDC) runs
`turbo run lint --affected`, `turbo run typecheck --affected`, `pnpm format:check`,
`turbo run test --affected`, plus an E2E job that installs chromium, builds and runs
`pnpm e2e`. Everything must be green before merge.

## Pull requests

1. Branch from `main` (the default branch).
2. Fill in the PR template (`.github/PULL_REQUEST_TEMPLATE/pull_request_template.md`):
   description, change type, testing checklist, security checklist.
3. Check for existing issues first — bug/feature/security issue templates live under
   `.github/ISSUE_TEMPLATE/`.
4. `CODEOWNERS` routes review; Dependabot keeps dependencies fresh.

## Changesets

KHAL releases via [Changesets](https://github.com/changesets/changesets). For any
release-visible change:

```bash
pnpm changeset
```

Commit the generated `.changeset/*.md` alongside your code. On merge to `main`, the Release
workflow (`release.yml`) opens/updates a "Version Packages" PR and publishes with
`pnpm release`.

## Commits

Conventional Commits. The husky `pre-commit` hook runs gitleaks (secrets) + lint-staged
(format/lint on staged files).

## Testing

- **Unit:** `pnpm test` (vitest).
- **E2E:** `pnpm e2e` (Playwright; the CI job installs chromium and runs `pnpm build` first).
- Fixed a bug? Add a test that fails on the old code.

## Security

See `docs/SECURITY.md` (move to repo root pending per fleet convention). From `AGENTS.md`
(GGA review rules), a PR is rejected if it has: hardcoded secrets, `any` types or missing
types on exported functions, empty catch blocks, `console.log` in production code (use the
logger), inline `style=` or hardcoded hex (use Tailwind + `cn()`), `!important`, broken
es/en i18n parity, card data logged, webhooks without HMAC verification, or non-idempotent
charge paths.

## Verification trail

- 2026-10-17 — 20-devrel (kanban `t_893ccd3f`), run 1: `pnpm lint` (green), `pnpm
  typecheck` (turbo, green) and a `pnpm test` receipt of 196 passed / 2 failed. Run 1
  also claimed a `pnpm e2e:visual` visual-regression suite "verified against
  package.json" — that was wrong (no such script, no `playwright.visual.config.ts`, no
  `update-snapshots.yml`, no visual-regression CI job exist in this repo) and run 2
  removed it. Treat the re-verification below as the source of truth.
- 2026-10-17 — 20-devrel, run 2 re-verification: `pnpm lint` exit 0 (green); `pnpm
  typecheck` exit 0 (turbo, green — the local remote-cache warning is expected without
  `TURBO_TOKEN`); `pnpm test` exit 1 — 30 test files, 21 passed / 9 failed on the
  uncommitted in-flight work in `main` (payment/a11y suites; failures include test
  timeouts and `No intl context found`) — must be green before merge. Full test run took
  ~42 minutes on a heavily contended machine. `pnpm format:check` / `pnpm e2e` verified
  against `package.json` scripts and `ci.yml` (not executed locally). Hooks verified by
  reading `.husky/pre-commit` (gitleaks + lint-staged).
