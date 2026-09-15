# Tasks: sdd-smoke-demo (docs + formatReminderEsAR implementation)

## 1. Docs
- [x] 1.1 proposal.md (why/what/scope/rollback)
- [x] 1.2 design.md (decision + rejected alternatives)
- [x] 1.3 specs/recordatorio-reserva/spec.md (2 scenarios, RFC 2119)
- [x] 1.4 tasks.md (this file)

## 2. Verify (docs-only, no code)
- [x] 2.1 Chain check: `openspec.config.yaml` → proposal → spec → tasks → `DOCS/01-07` all resolvable
- [x] 2.2 Tone check: copy consistent with `DOCS/05-marketing-tono.md`

## 3. Implement (Strict TDD — formatReminderEsAR)
- [x] 3.1 RED: `packages/utils/test/reminder.test.ts` written first — 3 tests failed before impl (spec copy, slot interpolation, `REMINDER_LIVE_ROLE === "status"`)
- [x] 3.2 GREEN: `packages/utils/src/reminder.ts` (`formatReminderEsAR` + `REMINDER_LIVE_ROLE`) + export in `packages/utils/src/index.ts` — 3/3 pass
- [x] 3.3 Triangulation: second slot combo (Martín/10:00) + `not.toBe("alert")` edge — pass

## 4. Verify (implementation)
- [x] 4.1 Focused: `vitest run packages/utils/test/reminder.test.ts` → 3 passed
- [x] 4.2 Full: `pnpm test` → 15 files / 55 tests passed
- [x] 4.3 Typecheck: `pnpm typecheck` → 8/8 tasks successful
- [x] 4.4 `verify.md` with real exits (this change)
