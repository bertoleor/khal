# Code Quality Workflow — khal v7 (28/10/2028)

## Session Overview
Quality assurance pass on `feat/v7-clienta-bw-glass` branch, covering T4/T5/T6 commits plus parallel agent UI/UX work. Tools: knip, spell, design-qa, biome, pnpm audit.

## Knip — Dead Code & Unused Deps
- Removed `@paper-design/shaders-react` from `apps/web/package.json` (dependency left by parallel agent, not used in source)
- Made `addonLabel` function local (non-exported) in `apps/web/src/lib/booking/addons.ts:22` — knip reports it as "unused export" but this is the correct pattern when the function only uses internal use
- **Pattern for parallel agent deps**: `grep -rn "shaders-react\|paper-design" apps/web/src/ --include="*.ts" --include="*.tsx"` → if absent from source, remove from `package.json` with `sed -i`

## Spell — Project Dictionary (v7 Lexicon)
- Added 7 words to `.cspell-words.txt` for DESIGN.md v7 terminology: `Linktree`, `linktree`, `Conocenos`, `creés`, `Sumás`, `designmd`, `strikethrough`
- **Vetting principle**: never add words by "sounds good" — only add terms that appear as intentional brand terms in `docs/DESIGN.md`. Real typos in prose must be fixed in the prose, never listed in the dictionary.
- **Cspell gate**: runs `pnpm spell:check` after any docs edit — the gate will catch your own post-curation words

## Design-QA Ratchet Management
- Baseline `baseline.json` had `total: 29` hardcoded hex colors from v2 merge
- After tokenizing/cleanup in v7 UI work, actual violations decreased to 4
- **Procedure**: 1) Run `python3 scripts/design-qa/gate.py check`, 2) If actual < baseline, update `baseline.json total` and `per_dir.apps.web` to new count, 3) Commit the updated baseline
- **Never increase ratchet proactively** — only when genuinely removing code that produced violations
- Gate emits: `::warning::Token violations decreased from X to Y` and `::warning::Consider lowering the ratchet` when Y < X

## Biome — Lint Fixes (FIXABLE)
Four biome findings were resolved as FIXABLE during this session:

1. **useOptionalChain** (`route.ts:144`): Changed `payment.status` → `payment?.status` to avoid `noImplicitAnyLet`
2. **useLiteralKeys** (`mercadopago.ts:161`): Destructure `parts` instead of computed access `parts['ts'] ?? parts['t']` → `const {ts: _ts, t} = parts; const ts = _ts ?? t`
3. **noUnusedImports** (`error.tsx:4`): Removed `import { useEffect } from 'react'` when component no longer uses useEffect
4. **noUnusedFunctionParameters** (`error.tsx:10`): Rename unused param `error` → `_error` in destructuring

## Audit — `--prod` Flag Nuance
- `pnpm audit` (no flags): includes devDependencies → shows higher count, not all are production risk
- `pnpm audit --prod --audit-level=high`: excludes devDeps → shows only production vulnerabilities
- **Khal specific**: Before our updates, 24 moderate/high/critical findings were all in dev/test chains. After updating `next-intl` (`^3.26.5` → `^4.9.1`) and `zod` (`^4.6.6` → `^4.6.7`), only 1 moderate transitive dep remains
- **Decision**: The 3 moderate after `--prod` may include transitive chains (vite → svgo, etc.) — decide whether to update full dependency tree or accept risk when no CVEs critical/high

## CSPell — Bilingual Dictionary Maintenance
- `.cspell-words.txt` contains project brand lexicon — voseo, tech terms, brand voice
- **Never add words by "sounds good"** — only add terms appearing as intentional brand terms in `docs/DESIGN.md`
- **Vetting principle**: before adding any word, verify it appears as intentional brand term in project docs — if only in code/UI, likely real finding (typo/misidentification), not voice choice
- Gate will catch your own post-curation words: run `pnpm spell:check` after any docs edit

## Test & Verification
- Test suite: 341/341 verde (T6), 71/71 passing (T4), 16/16 contract (T5)
- Typecheck: 8/8 passing
- Lint: 0 warnings (after fixes)
- CI gates: quality gates are blocking on main/PRs; on feature branches they are on-demand only

## Key Gotcha — Parallel Agent Workflows
When another agent modifies files in disjoint surfaces on the same branch:
- Surfaces are declared disjoint; git handles merges without conflict when edit surfaces don't overlap
- Any quality findings in the parallel agent's files are their responsibility, not regression against T4/T5/T6 commits
- Always verify `git status --porcelain` and `git log --oneline -5` before and after parallel work
- Knip may report dependencies added by the parallel agent (e.g., `@paper-design/shaders-react`) — remove if not consumed in source