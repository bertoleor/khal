# ODD Feature — khal-g3-mp-completo

> **Búsqueda:** keywords: `g3, mp, mercado pago, checkout, back-urls, pago pages, webhook, webhook-hardening, orn-13` · clasificación: `odd-feature` · estado: closed · actualizado: 2026-10-20

## Objective

Close the G3 code gap: make the Mercado Pago path complete end-to-end so that
provisioning credentials is the only step left before live capture — landing
the stranded webhook hardening and building the missing `/pago/exito|pendiente|error`
return pages that the MP preference `back_urls` point to.

## Problem / Why

Linear ORN-13 "[KHAL] G3 pagos solo manual, falta MP" (archived, deduped into
ORN-81; P0, kanban t_61e65f4b): the MP backend (preference + webhook HMAC +
payment re-fetch) existed on main, but (a) MP Checkout Pro redirected to
`/pago/exito|error|pendiente` routes that did not exist — a paying client
landed on a 404; (b) the KHAL-F4 webhook hardening (query-param delivery,
claim rollback, short manifest, 8s timeout) was stranded on branch
`khal/t_4f65719e-webhooks` since 2026-09-30 — latent bugs that would break
live MP operation; (c) credentials are not provisioned (owner-side, by
design per ADR-0002).

## Scope

- In:
  - Land webhook hardening commit c5a19d1 onto main (cherry-pick).
  - `/pago/{exito,pendiente,error}` server pages under `[locale]` with
    sanitized MP query params, fail-soft WhatsApp CTA, noindex.
  - `pago-params.ts` (zod sanitization), `pago-result.tsx` (presentational),
    `pago-page.ts` (shared props builder), `pagoResult` i18n namespace es/en.
  - Owner-facing go-live checklist (`docs/pagos-mp-go-live.md`) + G3 row
    update in `docs/06-estado-gates.md`.
- Out:
  - Credential provisioning / MP dashboard configuration (owner action,
    ADR-0002: "owner decides if/when MP goes live").
  - Live (production) verification of the payment roundtrip.
  - Changes to `mercadopago.ts` back_urls (they already point to
    `/pago/*`; next-intl middleware handles the locale-prefix redirect).

## Constraints

- TDD strict (RED → GREEN). Runner: vitest (node env, renderToStaticMarkup —
  same pattern as payment-step.test.tsx).
- No new dependencies (zod, next-intl, @khal/utils already in the workspace).
- Shared checkout with other agents' dirty files: surgical `git add` only —
  never stage `docs/ux-flows/*` (another task) or unrelated dirty files.
- Machine under heavy fleet load: scoped vitest runs took 15–60s, tsc ~5min;
  full foreground commands need generous timeouts (one eslint run had to go
  background).

## Tasks (stable IDs)

- [x] T1: Land webhook hardening on main (cherry-pick c5a19d1 → 4865376).
  - evidence: `git branch --contains 4865376` → main; `pnpm vitest run
    mercadopago-webhook.test.ts mercadopago-signature.test.ts` → 14 passed
    (run 58, pre-crash; re-verified 2026-10-20 in the 40/40 run below).
- [x] T2: RED — write `apps/web/test/pago-pages.test.tsx` (parser + component
  + route contract + i18n messages contract).
  - evidence: `pnpm vitest run apps/web/test/pago-pages.test.tsx` →
    **5 failed | 12 passed** (pages/helper/messages missing) — 2026-10-20
    08:21, Duration 15.10s.
- [x] T3: GREEN — `pago-params.ts` (zod), `pago-result.tsx` (presentational),
  `pago-page.ts` (buildPagoProps), three pages, `pagoResult` namespace es/en.
  - evidence: `pnpm vitest run apps/web/test/pago-pages.test.tsx
    apps/web/test/i18n-parity.test.ts apps/web/test/i18n-tone.test.ts
    apps/web/test/payment-step.test.tsx apps/web/test/mercadopago-webhook.test.ts
    apps/web/test/mercadopago-signature.test.ts` →
    **6 files passed, 40/40 tests** — 2026-10-20 08:33, Duration 57.99s.
- [x] T4: `tsc --noEmit` (apps/web) clean + prettier + eslint on new files.
  - evidence: `pnpm typecheck` (apps/web) → exit 0 (2026-10-20);
  `prettier --write` → 3 files reformatted, pages unchanged;
  `eslint --max-warnings 0` on the 7 new/changed source files → clean
  (see Accumulated evidence for the load caveat).
- [x] T5: Docs — `docs/pagos-mp-go-live.md` (owner checklist) + G3 row +
  production-close item 3 in `docs/06-estado-gates.md`.
- [x] T6: Work-unit commits on main + mem_save + kanban handoff.

## Accumulated evidence

- (2026-10-18, run 58 — crashed, recovered) Baseline green 12/12;
  cherry-pick c5a19d1 applied cleanly as 4865376 on main; WU1 tests 14/14.
  RED test file written; pago-params.ts + pago-result.tsx written; crashed
  before pago-page.ts (host reclaimed the run; full log in the kanban task
  log t_61e65f4b.log).
- (2026-10-20) Branch audit: current checkout was on another task's branch
  `khal/changelog-batch-1016` (its own 3 commits, in review — untouched);
  verified dirty files don't differ main↔HEAD, then `git switch main`.
  Untracked pago files survived; 4865376 confirmed in main.
- (2026-10-20) RED captured: 5 failed | 12 passed (17) — failures are
  exactly the 3 route files, the helper and the messages contract.
- (2026-10-20) GREEN: 40/40 across pago-pages (17), i18n-parity (2),
  i18n-tone (2), payment-step (5), mercadopago-webhook (8),
  mercadopago-signature (6).
- (2026-10-20) `tsc --noEmit` exit 0. Host is heavily loaded by parallel
  fleet jobs (same single-file vitest: 3.8s on 10-18 vs 41–58s today), so
  full-repo lint/prettier runs were scoped or backgrounded.

## Accepted changes and rationale

- Pages are thin wrappers over `buildPagoProps` + `PagoResult` (dumb,
  props-driven, locale-agnostic) — matches the repo's contract-test style
  and keeps next-intl out of the tested units.
- WhatsApp CTA hidden when no phone is configured (fail-soft, KHAL-A1
  doctrine); payment id shown only when digits-only; external_reference
  validated but not displayed (uuid is ugly; the dueña reconciles via MP).
- Route contract test pins page source contents (status literal,
  buildPagoProps, robots noindex) — repo convention (seed/migration contract
  tests).
- back_urls stay locale-less (`/pago/exito`); next-intl middleware redirects
  to `/es/pago/exito` preserving the query string MP appends.

## Next step

- Owner: follow `docs/pagos-mp-go-live.md` (credentials + webhook
  registration + smoke test). Until then G3 stays UNVERIFIED live by design.

## Progress

- 2026-10-18 (run 58): T1 done (4865376 on main, 14/14); T2 RED drafted;
  crash mid-T3.
- 2026-10-20 (run 69): T2 RED captured, T3 GREEN 40/40, T4 clean, T5 docs,
  T6 commit + handoff. Feature closed; live go-live remains owner-side.
