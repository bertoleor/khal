# Biome Migration — replace eslint+prettier as khal's lint/format engine

Objective: khal lints/formats 15-25x faster with 500+ rules and finds real issues eslint misses (26 found in the 2026-10-18 comparison scan: 13 a11y, 2 security, 4 suspicious, 4 complexity, 2 correctness), while keeping every existing green gate green.
Branch: `khal/biome-migration` (work-unit commits on feature branch; merge is the owner's call).
Delivery strategy: single-pr. Test runner: `pnpm test` (vitest) + `pnpm e2e` + CI.

## Specs

- S1: `biome.json` at repo root via `npx @biomejs/biome migrate eslint --write` + `migrate prettier --write`, keeping current rule behavior (no new failures on first run — new rules enabled in S3, not before).
- S2: Scripts swap: `lint` → `biome check . --max-diagnostics=200`, `format`/`format:check` → `biome format --write`/`biome format`. Keep the old scripts as `lint:eslint`, `format:prettier` during the transition commit, removed in the final one.
- S3: Enable the 26 findings from the comparison scan one category at a time; fix or explicitly suppress each with `// biome-ignore` + reason. Do NOT bulk-suppress.
- S4: lint-staged `.lintstagedrc.json` → `["biome check --write --no-errors-on-unmatched"]` for the code globs; pre-commit stays gitleaks first.
- S5: CI `Lint & Typecheck` job: `pnpm lint` runs biome; `pnpm format:check` → `biome format` check. Typecheck job unchanged (tsc stays).
- S6: The 6 unreferenced eslint-plugins (import/jsx-a11y/promise/security/sonarjs/unused-imports) get REMOVED from package.json (they were never in the flat config — knip finding); biome's own a11y/import rules cover that surface.
- S7: All gates green at the end: unit 198+, e2e happy path, visual regression (screenshots unchanged — biome must not alter source behavior), design-qa (reads components, eslint-independent — verify it still passes), release, semgrep, pr-agent.

## Tasks

| ID | Spec | Route | Status |
|---|---|---|---|
| T1 | S1-S2 | inline | todo |
| T2 | S3 | inline | todo |
| T3 | S4-S5 | inline | todo |
| T4 | S6 | inline | todo |
| T5 | S7 verification | inline (verifier: high-risk tooling change) | todo |

## Log

- L1 (2026-10-18, user): "si biome es mejor deberiamos programar una migracion" — decision after seeing the comparison scan evidence (26 eslint-missed findings, 1.1s vs ~40s).
- L2 (2026-10-18, orchestrator): Comparison evidence: biome lint found 13 a11y (useHeadingContent), 2 security (noDangerouslySetInnerHtml in service-manager.tsx:655 + web layout.tsx:61 — Tiptap editor, verify sanitization when addressing), 4 suspicious (noShadowRestrictedNames), 4 complexity, 2 correctness (useExhaustiveDependencies error.tsx), 1 style (useImportType). 104 files checked in 1138ms.
- L3 (2026-10-18, orchestrator): Created as scheduled migration; NOT authorized for immediate implementation — the green gates (design-qa ratchet, 198 tests, visual baselines) depend on the current tooling and this task must not run unattended mid-sprint.
