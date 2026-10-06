# Verify: sdd-smoke-demo — formatReminderEsAR

Date: 2026-09-15 | Branch: `feat/khal-payment-a11y` | Mode: Strict TDD

## TDD cycle evidence
| Step | Evidence |
|---|---|
| RED | `vitest run packages/utils/test/reminder.test.ts` pre-impl → 1 file failed, 3 tests failed (`formatReminderEsAR`/`REMINDER_LIVE_ROLE` undefined) |
| GREEN | Same command post-impl → 1 passed, 3 passed |
| Triangulation | Second slot combo (Martín/10:00) + `not.toBe("alert")` → pass, no refactor needed |

## Real exits
| Command | Result |
|---|---|
| `vitest run packages/utils/test/reminder.test.ts` | 1 file passed, 3 tests passed |
| `pnpm test` (full suite) | 15 files passed, 55 tests passed |
| `pnpm typecheck` (turbo) | 8/8 tasks successful |
| `eslint` scoped (`reminder.ts` + `reminder.test.ts`, `--max-warnings 0`) | exit 0, clean |

## Spec compliance
| Spec scenario | Covering test | Status |
|---|---|---|
| Reminder copy renders with slots ("Che, Lucía, te recordamos tu reserva de las 18:30.") | `renders the spec copy for Lucía at 18:30` | PASS |
| Reminder copy interpolates `{nombre}`/`{hora}` | `interpolates arbitrary slots with voseo copy` | PASS |
| Announcement is polite (`role="status"`, never `role="alert"`) | `exposes a polite live region role` (`REMINDER_LIVE_ROLE === "status"`) | PASS |

## Gate de cierre SDD
- [x] `tasks.md` all `[x]`
- [x] This `verify.md` with real exits
- [x] `git status --short openspec/` clean after commit (to verify pre-commit)
- [x] Scoped commit (change + touched code/docs), no push

## Rollback
`git revert <sha>` — files: `packages/utils/src/reminder.ts`,
`packages/utils/test/reminder.test.ts`, `packages/utils/src/index.ts`
(export line), `openspec/changes/sdd-smoke-demo/{tasks,verify}.md`.
