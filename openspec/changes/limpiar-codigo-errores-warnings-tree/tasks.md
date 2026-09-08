# Tasks: limpiar-codigo-errores-warnings-tree

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650–750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Cleanup: dead files, directives, dedup, env error handling, ui scaffold | PR 1 | ~120 lines. No dependencies. Foundation for everything else. |
| 2 | Security: requireAuth, cookie flags, Zod validation on actions | PR 2 | ~140 lines. Depends on PR 1 (env error handling). Auth is single swap point for Supabase. |
| 3 | i18n setup + server components | PR 3 | ~280 lines. Depends on PR 2 (actions return structured errors). Mirrors web's proven next-intl pattern. |
| 4 | i18n client components | PR 4 | ~120 lines. Depends on PR 3 (provider + messages must exist). Four "use client" components. |
| 5 | Error boundaries + SQL prep docs | PR 5 | ~130 lines. Independent of i18n. Can be merged last. |

## Phase 1: Cleanup ✅

- [x] 1.1 Delete `apps/admin/src/index.ts` (empty dead file, no imports found)
- [x] 1.2 Remove unused type exports (UUID, ISODateTime, CurrencyCode, Cents) from `packages/types/src/index.ts` — keep only exports that are actually imported
- [x] 1.3 Add `"use server"` as first line in `apps/web/src/lib/actions/catalog.ts`
- [x] 1.4 Create `packages/utils/src/dates.ts` with `toIsoDate(date: Date): string` implementation (extract from `apps/web/src/app/[locale]/servicios/[id]/reservar/page.tsx`)
- [x] 1.5 Add `export * from "./dates"` to `packages/utils/src/index.ts`
- [x] 1.6 Update `apps/web/src/app/[locale]/servicios/[id]/reservar/page.tsx` — remove local `toIsoDate`, import from `@khal/utils`
- [x] 1.7 Wrap `envSchema.parse()` in try/catch in `apps/web/src/config/env.ts` — error message names missing vars, includes expected format
- [x] 1.8 Scaffold minimal Button component in `packages/ui/src/index.ts` to justify package existence

**Additional PR1 tasks completed**:
- [x] Remove `@khal/ui` from `apps/web/next.config.ts` transpilePackages
- [x] Add `DOCS/automations.md` to git tracking
- [x] Clean up `packages/ui/tsconfig.json` (removed jsx config)

**Verification**: ✅ pnpm test: 33/33. ✅ pnpm lint: 0 warnings. ✅ pnpm typecheck: 8/8 packages. ✅ pnpm build: 2/2 apps.

## Phase 2: Security Hardening

- [ ] 2.1 Add `AuthContext` type and `requireAuth()` helper to `apps/admin/src/lib/auth.ts` — reads `khal_role` cookie via `cookies()`, returns `{ userId, role }` or throws; structurally ready for Supabase JWT swap
- [ ] 2.2 Add cookie security flags to `apps/admin/src/app/login/page.tsx` — `httpOnly: true`, `secure: NODE_ENV === 'production'`, `sameSite: 'lax'`, `maxAge: 86400`
- [ ] 2.3 Refactor `apps/admin/src/lib/actions/appointments.ts` — add `requireAuth()` call, Zod validation via `appointmentStatusSchema` for `to` field, structured `ActionResult` return type, try/catch with `{ success: false, error }` shape
- [ ] 2.4 Refactor `apps/admin/src/lib/actions/services.ts` — add `requireAuth()` call, Zod validation for `ids` (array of UUIDs), structured `ActionResult` return type, try/catch
- [ ] 2.5 Refactor `apps/admin/src/lib/actions/clients.ts` — add `requireAuth()` call, validate `id` is UUID string, structured `ActionResult` return type, try/catch
- [ ] 2.6 Refactor `apps/admin/src/lib/actions/exceptions.ts` — add `requireAuth()` call, structured `ActionResult` return type, try/catch (Zod already present via `calendarExceptionInputSchema`)

**Verification**: Run `npx turbo typecheck` — no errors. Manually verify `requireAuth()` reads cookies. Check that unauthenticated calls to actions would throw.

## Phase 3: i18n Setup + Server Components

- [ ] 3.1 Add `next-intl` dependency to `apps/admin/package.json` — match web's version
- [ ] 3.2 Wrap `next.config.ts` in admin with `createNextIntlPlugin()` — mirror web's `apps/web/next.config.ts` pattern, add `@khal/ui` to transpilePackages
- [ ] 3.3 Create `apps/admin/src/i18n/routing.ts` — `defineRouting({ locales: ["es"], defaultLocale: "es" })`
- [ ] 3.4 Create `apps/admin/src/i18n/request.ts` — `getRequestConfig` loading `../../messages/${locale}.json`
- [ ] 3.5 Create `apps/admin/src/i18n/navigation.ts` — `createNavigation(routing)` exporting Link, redirect, usePathname, useRouter, getPathname
- [ ] 3.6 Create `apps/admin/messages/es.json` — all admin strings from design's Translation Key Structure (nav, auth, appointments, services, clients, exceptions, errors, notFound)
- [ ] 3.7 Modify `apps/admin/src/app/layout.tsx` — wrap children with `NextIntlClientProvider`, set `locale="es"`
- [ ] 3.8 Modify `apps/admin/src/app/admin/layout.tsx` — replace hardcoded nav strings ("Agenda", "Clientes", "Servicios", "Bloqueos") with `getTranslations("nav")`
- [ ] 3.9 Modify `apps/admin/src/app/admin/page.tsx` — replace "Agenda de hoy" with `getTranslations("appointments")`
- [ ] 3.10 Modify `apps/admin/src/app/admin/servicios/page.tsx` — replace "Servicios" heading + description with `getTranslations("services")`
- [ ] 3.11 Modify `apps/admin/src/app/admin/clientes/page.tsx` — replace "Clientes" heading with `getTranslations("clients")`
- [ ] 3.12 Modify `apps/admin/src/app/admin/bloqueos/page.tsx` — replace heading + description with `getTranslations("exceptions")`

**Verification**: Run `npx turbo build` — admin builds with next-intl. Check `apps/admin/messages/es.json` exists and is valid JSON.

## Phase 4: i18n Client Components

- [x] 4.1 Modify `apps/admin/src/components/admin/appointment-list.tsx` — replace `ACTION_LABEL` map + hardcoded strings with `useTranslations("appointments")` hook
- [x] 4.2 Modify `apps/admin/src/components/admin/service-list.tsx` — replace "Ocultar"/"Mostrar"/"Subir 10%" with `useTranslations("services")` hook
- [x] 4.3 Modify `apps/admin/src/components/admin/client-list.tsx` — replace "No hay clientas"/"Bloquear"/"Quitar de lista negra" with `useTranslations("clients")` hook
- [x] 4.4 Modify `apps/admin/src/components/admin/exceptions-list.tsx` — replace `TYPE_LABEL` map + form labels + "Bloquear día" with `useTranslations("exceptions")` hook

**Verification**: Run `npx turbo build` — all admin pages build. Manually check that no hardcoded Spanish strings remain in admin components (grep for common words).

## Phase 5: Error Boundaries + SQL Prep

- [ ] 5.1 Create `apps/admin/src/app/error.tsx` — error boundary with styled UI, "Try Again" button using `reset()`, log error to console, no stack traces shown
- [ ] 5.2 Create `apps/admin/src/app/not-found.tsx` — 404 page with "Página no encontrada" message + link to `/admin`
- [ ] 5.3 Create `apps/web/src/app/[locale]/error.tsx` — error boundary with styled UI, "Try Again" button, log error to console
- [ ] 5.4 Create `apps/web/src/app/[locale]/not-found.tsx` — 404 page with message + link to home (`/${locale}`)
- [ ] 5.5 Create `DOCS/supabase-migration.md` — migration guide covering: schema creation, RLS policies (SELECT/INSERT/UPDATE/DELETE with auth.uid()), auth mapping (cookie→Supabase Auth, mock role→JWT claim, requireAuth→supabase.auth.getUser), env vars (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET), seed data patterns

**Verification**: Run `npx turbo build` — both apps build with error/not-found pages. Navigate to invalid URL to verify 404 renders. Trigger error to verify boundary catches it. Review DOCS/supabase-migration.md for completeness.

## Dependency Graph

```
Phase 1 (Cleanup) ──→ Phase 2 (Security) ──→ Phase 3 (i18n Setup) ──→ Phase 4 (i18n Client)
                                                                            ↑
                                                            Phase 5 (Errors + SQL) ──┘
```

Phase 5 is independent of Phases 3-4 and can be merged in any order after Phase 2.
