---
name: khal-context
description: >
  Use when working in the khal monorepo. Map of the pnpm/turbo repo — apps and
  packages, shared conventions (CQ, ARCH, MONEY, DB, SCH), lint/tsconfig rules,
  and the upfront decisions to anchor any change before touching code.
metadata:
  author: khal
  version: "0.1.0"
---

# Khal repo context

Khal = virtual appointment agenda for multi-owner nail/lash studios
(manicuras/lashistas). Next 15 App Router, React 19, TS strict +
`verbatimModuleSyntax`, pnpm 12 / turbo, vitest, Playwright, husky + lint-staged.

## Layout

- `apps/web` — public funnel (catalog → booking → payment). Depends on `@khal/db`,
  `@khal/utils`, `@khal/validations`. next-intl **3.26** (`next-intl/navigation`,
  `/server`, `/middleware`).
- `apps/admin` — backoffice (agenda, clientes, servicios, bloqueos). Depends on
  `@khal/utils`, `@khal/validations`. next-intl **4.14** (only `i18n/routing` +
  `createMiddleware`, no navigation helper).
- `apps/api-workers` — async dispatch primitives: circuit breaker, webhook HMAC,
  env validation. Pure library, zero UI.
- `packages/db` — availability engine (`@khal/db`); exports `./src/index.ts` raw TS.
- `packages/validations` — zod schemas + state machine (depends on `zod@^3.24`).
- `packages/utils` — pure helpers (money, dates, links, `cn`).
- `packages/types` — global aliases (`UUID`, `ISODateTime`, `CurrencyCode`, `Cents`).
- `packages/ui` — currently empty shell (`export {}`); do not build components here yet.

Package exports are raw `./src/index.ts` (`"exports": { ".": "./src/index.ts" }`)
— data flows as source, so keep `src` tree-shakeable and side-effect free.

## Stack binding rules (MUST)

- TS config root `tsconfig.base.json`: `strict`, `verbatimModuleSyntax: true` →
  **type-only imports must use `import type`** (enforced by eslint
  `consistent-type-imports`), `isolatedModules`, `moduleResolution: Bundler`.
  🚫 **never** import a type as a value.
- ESLint `--max-warnings 0`: `no-console` is **error**, `eqeqeq` always except
  `null` ignored, `no-explicit-any` error, unused-vars error (`argsIgnorePattern ^_`).
  No warning is acceptable in CI. 🚫 never `console.log`, `any`, or non-null
  assertion escapes.
- Everything after a build must be warning-free (**CQ-08 Zero Build Warnings**).
- Files must respect the strict complexity limit (**CQ-03**); split early.

## Upfront conventions to honor (must reference in code comments)

- **CQ-04 Zero Inline Hardcoding** — mocks are explicitly labeled `(CQ-04)` and
  gated to the unlinked slice; they are swapped for Supabase, never grown.
- **CQ-02 Zero Descriptive Comments** — no "what this does" prose; comments carry
  only invariants, convention ids, or the reason a non-obvious choice exists.
- **MONEY-01/02/03** — money is integer `price_cents` + `CurrencyCode`; deposit
  percent in basis points (50% = 5000); amount snapshot at creation.
- **ECOM-03** — business lifecycle is a strict enum, never booleans.
- **SCH-01/02/03** — availability is computed, not pre-generated.
- **DB-01..07** — UTC datetimes, RLS everywhere, soft delete, append-only audit.
- Business tz fixed: `America/Argentina/Buenos_Aires`. Store datetimes UTC; convert
  only at the edges. Default locale `es`, currency default `ARS`.

## Conventions reference (authoritative source)

`DOCS/AGENT CONSTITUTION.MD` and `openspec/changes/virtual-agenda/design.md` +
`openspec/config.yaml` (OpenSpec). The migration `supabase/migrations/*.sql` inlines
the DB/IDX/SLOG/WEBHOOKS conventions. Prefer these files over any summary here for
a conflicting detail.

## Commands

- `pnpm install` — heavy lockfile; prefer `pnpm --filter <pkg> ...` scoping.
- `pnpm typecheck` (turbo), `pnpm lint` (eslint, must be 0 warnings),
  `pnpm test` (vitest), `pnpm e2e` (Playwright), `pnpm format` (prettier).
- Per-package: `pnpm --filter @khal/utils test`.
- Rules live in `package.json` `lint-staged` + `eslint.config.mjs`.

## Import styling

- Workspace deps by scoped name: `import { computeAvailableSlots } from "@khal/db"`.
- Internal app imports use `@/` alias (`@/lib/actions/...`, `@/components/...`).
- Server-only data access is pure async (`"use server"` actions); reads in App Router
  are server components calling actions or mocks directly.