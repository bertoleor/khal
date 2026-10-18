# Quality & Security Arsenal

The repo ships a layered quality pipeline. Each layer has one job and they compose:

| Layer | Tool | Trigger | Scope |
| --- | --- | --- | --- |
| Format + lint | ESLint 9 + Prettier | pre-commit (`husky` + `lint-staged`) + CI | whole repo, zero warnings allowed |
| Types | `tsc` via `turbo typecheck` | CI | all workspaces |
| Unit tests | Vitest (198+) | CI | all workspaces |
| E2E | Playwright (zero-dep Supabase stub on :3100) | CI | booking happy path |
| Visual regression | Playwright + baselines (`snapshots/`) | CI | home/servicio/reservar, Desktop+Mobile |
| Design QA | token ratchet (`scripts/design-qa`) | CI on `apps/**` paths | design tokens + WCAG contrast contracts |
| Dead code / deps | Knip (`pnpm knip`, config `knip.json`) | on demand | unused files, exports, dependencies |
| SAST | Semgrep (`semgrep.yml`) | push/PR to main | TS/JS/React/Next rulesets (blocking) + security-audit (report) |
| Secrets | gitleaks | pre-commit | whole repo |
| AI PR review | PR-Agent (`pr-agent.yml`) | every PR | `/describe` `/review` `/improve` + labels via NVIDIA OpenAI-compatible endpoint |
| Lint omnibus | MegaLinter (`megalinter.yml`) | manual dispatch | copy-paste, spell, markdown, yaml — duplicates of existing gates disabled |

## Running locally

```bash
pnpm knip                  # dead files/exports/deps report
pnpm biome:scan            # one-off Biome lint comparison scan (no config, no install)
ocr scan --path <dir>      # Alibaba OCR full-file AI audit (host-side CLI)
```

Notes:

- Knip ignores the MercadoPago dual-flow mock files — that code stays per product decision.
- `.semgrepignore` excludes test/e2e specs: loopback stubs are HTTP by design and SAST gates production code.
- PR-Agent reviews land as PR comments from the bot; severity-tagged. Model: `nvidia/nemotron-3-super-120b-a12b`, fallback `z-ai/glm-5.3-flash`.
