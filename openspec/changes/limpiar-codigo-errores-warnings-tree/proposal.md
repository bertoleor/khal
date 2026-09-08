# Proposal: limpiar-codigo-errores-warnings-tree

## Intent

Remove dead files, unused exports, and configuration inconsistencies to reduce technical debt and improve code maintainability. The exploration identified zero TypeScript errors and zero ESLint warnings, but several dead artifacts and missing directives that violate project conventions.

## Scope

### In Scope
- Remove empty `packages/ui/src/index.ts` barrel export (or scaffold minimal UI package)
- Remove unused types from `packages/types/src/index.ts` (UUID, ISODateTime, CurrencyCode, Cents)
- Delete dead `apps/admin/src/index.ts` file
- Track `DOCS/automations.md` in git (currently untracked)
- Add missing `"use server"` directive to `apps/web/src/lib/actions/catalog.ts`
- Improve `apps/web/src/config/env.ts` error handling with try/catch wrapper
- Standardize Spanish UI strings in admin app (evaluate i18n scope)

### Out of Scope
- Full admin i18n migration with next-intl (defer to separate change)
- Major refactoring of env validation or server actions
- Changes to packages/ui functionality (only barrel/export cleanup)
- Updates to test suite (current 33/33 tests remain passing)

## Capabilities

### New Capabilities
None. This is a cleanup change, not feature work.

### Modified Capabilities
None. No spec-level behavior changes.

## Approach

1. **Dead file cleanup**: Remove empty files that serve no purpose
2. **Export pruning**: Remove unused types from packages/types
3. **Configuration hygiene**: Add missing directives, improve error handling
4. **Git tracking**: Commit untracked documentation
5. **Admin i18n assessment**: Evaluate scope of Spanish string migration, potentially defer

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/ui/src/index.ts` | Removed | Empty barrel export |
| `packages/types/src/index.ts` | Modified | Remove 4 unused type exports |
| `apps/admin/src/index.ts` | Removed | Dead file with no purpose |
| `DOCS/automations.md` | Modified | Add to git tracking |
| `apps/web/src/lib/actions/catalog.ts` | Modified | Add `"use server"` directive |
| `apps/web/src/config/env.ts` | Modified | Improve error handling |
| `apps/admin/` components | Modified | Potential i18n migration (scope TBD) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Removing packages/ui breaks transpilePackages config | Low | Verify config doesn't require empty package; scaffold minimal index if needed |
| Admin i18n migration scope creep | Medium | Defer full migration, only assess and document |
| Missing "use server" directive causes runtime issues | Low | Add directive, verify server action behavior |
| Env validation changes break existing behavior | Low | Wrap in try/catch, preserve current error messages |

## Rollback Plan

1. **Git revert**: Single commit revert for all cleanup changes
2. **Package restoration**: Re-add empty packages/ui barrel if transpilePackages fails
3. **Type restoration**: Re-export removed types from packages/types if downstream dependencies discovered
4. **Directive removal**: Remove "use server" from catalog.ts if issues arise

## Dependencies

- None. All changes are internal cleanup.

## Success Criteria

- [ ] Zero empty barrel exports in packages
- [ ] All unused type exports removed
- [ ] Dead files eliminated from file tree
- [ ] DOCS/automations.md tracked in git
- [ ] Missing "use server" directive added
- [ ] Env validation error handling improved
- [ ] All existing tests still pass (33/33)
- [ ] No new TypeScript errors or ESLint warnings introduced

## Proposal question round

The following questions need user review to finalize scope and assumptions:

1. **Admin i18n scope**: Should we include the full admin i18n migration with next-intl in this change, or defer it as a separate medium-sized change? The exploration identified multiple hardcoded Spanish strings violating I18N-02.

2. **packages/ui handling**: Should we scaffold a minimal UI component (e.g., Button) to justify the package's existence, or remove it from `transpilePackages` entirely? The package is currently empty but listed in config.

3. **Dead types decision**: Should we remove the unused types (UUID, ISODateTime, CurrencyCode, Cents) from packages/types, or keep them for future use? They're exported but never imported anywhere.

4. **Error handling improvement**: For `apps/web/src/config/env.ts`, should we add a try/catch wrapper around `envSchema.parse(process.env)` to provide clearer error messages, or keep the current direct parse (which already throws on validation failure)?

5. **Scope boundaries**: Are there any other cleanup opportunities the exploration missed that should be included in this change?

**Assumptions pending user review:**
- Admin i18n migration will be deferred to keep this change focused on quick wins
- packages/ui will be scaffolded with minimal content rather than removed from config
- Dead types will be removed to reduce maintenance burden
- All changes must preserve existing test coverage and behavior