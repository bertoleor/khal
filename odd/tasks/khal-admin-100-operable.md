> Parte de: [[INDICE-SISTEMA]] · Relacionados: [[docs/audits/rls-verify-khal-2026-10-07]], [[odd/tasks/khal-orn-170-schedule-gates]]

# ODD Feature — khal-admin-100-operable

> **Búsqueda:** keywords: `khal, admin, login, otp, servicios, tiptap, editor, fotos, storage, service-photos, 0010, soft-delete, deploy admin` · clasificación: `odd-feature` · estado: `open` · actualizado: 2026-10-16

## Objective
The admin app becomes 100% operable end-to-end: a real Supabase login (magic code OTP), a catalog manager with rich text editor (Tiptap), photo upload to Supabase Storage, client-side zod validation, search/sort, soft delete, live tests, live DB migration `0010` (storage bucket `service-photos` + policies), and a production deploy of the admin app (its own Vercel project) with the owner's staff account provisioned.

## Problem / Why
1. The admin login page is informational-only (no sign-in form; TODO comment ORN-80) and `auth.users` in the live DB is EMPTY — nobody can enter, so nothing in the panel is operable regardless of the UI.
2. The previous session's catalog code is broken and unverified: wrong column names (`duration_min` vs DB `duration_minutes`), a `'use client'` page with `async` server-only `getTranslations` (cannot compile), hard `delete` against a FK with `no cascade` (`appointments.service_id`), no `organization_id` on INSERT (NOT NULL violation), a deprecated `document.execCommand` editor, and a photo upload that alerts the URL instead of storing it.
3. No storage bucket exists (live `storage.buckets` = []), so photo upload could never work; no migration ever created one.
4. The admin app has never been deployed (prod `/admin` → 404; the single Vercel project builds `apps/web` only).

## Scope
- In: login page rewrite (client form, `signInWithOtp` + `verifyOtp`, browser supabase client), services actions rewritten against the real schema (TDD: RED contract tests first), Servicios page (server component + client manager: Tiptap description editor, photo upload→preview→`photo_path`, zod form validation, search/sort, visibility toggle, soft delete), migration `0010_service_photos_bucket.sql` (+ `.down.sql`) applied live via Management API, new Vercel project `khal-admin` deployed from `apps/admin`, staff user provisioned with `app_metadata {role, org_id}`, i18n keys es+en, ODD docs + gate evidence.
- Out: dark admin retheme (P2, documented), MercadoPago (decided out long ago), custom domain, admin e2e (playwright infra is web-only; contract tests only this cycle), clients/exceptions pages (still mock-backed; next cycle).

## Constraints
- Live DB ref `epykihchzlbbptrvvawg` — additive-only migration (bucket + policies + ledger row `0010`), atomic `begin..commit` via Management API `database/query`, PAT `SUPABASE_PAT_2` (never printed).
- `deleteService` MUST be soft (`deleted_at = now()`) — `appointments.service_id` FK has NO cascade; hard delete breaks referential history.
- RLS already grants `services_member_all` (org-scoped) — the app must carry the session JWT (`@supabase/ssr`) and include `organization_id` from `app_metadata.org_id` on INSERT.
- Editor: Tiptap (canon skill: never hand-craft what a maintained library ships). `immediatelyRender: false` for SSR.
- i18n parity test (G7) requires every new string in BOTH `messages/es.json` and `messages/en.json`.
- Tests: vitest node env, static/contract style per existing admin tests; TDD RED before GREEN; `pnpm test` at root.
- Build/deploy: admin app is a separate Next app; Vercel project `khal-admin` with Root Directory `apps/admin` (git integration, workspace deps resolve from repo root). Local build only with node ≤24 (fleet pin).
- Route: inline (delegate_task broken in this environment — 120 consecutive failures earlier this session; noted per Route-declaration).

## Tasks (stable IDs)
- [x] T1: RED — `apps/admin/test/services-actions.test.ts` (13 contract tests).
  - evidence: first run 13 failed | 0 passed (EXIT=1) against the broken pre-rewrite actions (duration_min, hard delete, no org_id, no zod, no MIME/size gates, FormData signatures).
- [x] T2: GREEN — `apps/admin/src/lib/actions/services.ts` rewritten for the real schema + `src/lib/schemas.ts` (serviceFormSchema, zod v3, superRefine mirroring the DB deposit CHECK).
  - evidence: `pnpm test apps/admin/test/services-actions.test.ts` → 13 passed (13); full repo suite 176/176 after T4.
- [x] T3: Login real — `src/lib/supabase/browser.ts` (createBrowserClient) + login page + `login-form.tsx` (OTP `shouldCreateUser:false` + verifyOtp + password path) + i18n es/en + `login-contract.test.ts`.
  - evidence: login-contract 7/7 after assertion refinement; middleware untouched (shell check).
- [x] T4: Servicios page — server shell (requireAuth + redirect + fetchServices) + `ServiceManager` client (Tiptap editor, PhotoUploader, search/sort, bulk +10%, soft delete, toggle, inline zod errors) + i18n es/en (paridad G7 verde).
  - evidence: full suite 176/176; admin typecheck green after fix (as const en remotePatterns; ToolbarButton active opcional); a11y C2 retargeted a service-manager.tsx; P2 ring contract retargeted con classNames inline completos.
- [x] T5: Tiptap install — @tiptap/{react,starter-kit,pm,extension-underline}@^2.26.1 (registry verificado: peer react ^19 OK; resuelto a 2.27.3) vía edición manual de package.json + `pnpm install` (lockfile actualizado).
- [x] T6: Migration `0010` aplicada a la DB viva via Management API (atomic) + contrato test 6/6.
  - evidence: apply response `[]`; live: bucket service-photos (public, file_size_limit 4194304) + 4 policies (SELECT anon+authenticated / INSERT+UPDATE+DELETE authenticated+org_role admin,manager) + ledger 0010. RED→GREEN del contrato capturado (9 failed → 14 passed).
- [x] T7: Deploy admin — Vercel project `khal-admin` (prj_HFlKB1RifT1klbPqRpIwhWWw4JaM, team ornellas-projects-c7276f45) creado + linked desde apps/admin; git conectado (github.com/bertoleor/khal); env vars NEXT_PUBLIC_SUPABASE_URL/_ANON_KEY en Production+Preview (valores limpios, sin comillas — el primer pull de env las envolvía y se detectó a tiempo).
  - evidence: `vercel env ls` 4/4 filas; deploy en curso al cierre de esta edición.
- [x] T8: Staff user provisionado via GoTrue admin API (service_role del Management api-keys?reveal=true, nunca impreso).
  - evidence: auth.users = bertoletti3011@gmail.com, confirmed=true, app_metadata {role: admin, org_id: aaaaaaaa-…}; verificado por query directo. Sin password — acceso por código OTP al email de la dueña.
- [ ] T9: Gate + close — suite 176/176 ✓, eslint 0 warnings ✓, typecheck 8/8 ✓; falta: build/deploy verificado en vivo + commits + push + docs (flujo-admin).

## Accumulated evidence
- 2026-10-16 live probes: `auth.users` = [] (pre-provision); `storage.buckets` = [] (pre-0010); migrations ledger `0001..0007 + 0009`; services 4 visible / 0 deleted / 0 with photos; prod `/admin`+`/login` = 404 (admin nunca deployado); Management API `database/query` funciona con `{"query": ...}` (PAT `SUPABASE_PAT_2`).
- 2026-10-16: RLS posture confirmada en 0001 — `services_member_all for all using (organization_id = public.org_id())`, anon insert bloqueado (auditoría ORN-168 probe #7: 401 42501).
- Git author (owner identity): `bertoletti3011@gmail.com`.
- **Colisión de flota en vivo**: otro worker del fleet commiteó el hardening 0009 + su revert (bedac38, f2da737) sobre el mismo checkout mientras este rewrite corría; su revert "restauró" service-list.tsx + mocks/services.ts que este feature había retirado como dead code (firmas viejas). Re-retirados con git rm; el commit de este feature documenta la intención para evitar un tercer vaivén. 0009 también convergió al repo — 0010 queda en secuencia.
- Broken pre-T4 servicios page preservado como evidencia en `E:/Hermes/.archive/khal-broken-servicios-page-pre-T4-2026-10-16.tsx` (nunca commiteado; mv según regla de no-rm de la casa).
- `pnpm lint` = LINT_OK, `pnpm typecheck` = 8/8 (tras el rewrite; background job 1300s por lint lento del host, no por errores).

## Accepted changes and rationale
- OTP magic-code login (no password provisioning through chat — credentials never transit the conversation; the owner receives a code in her own inbox).
- Soft delete for services matches the schema's `deleted_at` design and the appointments FK.
- Migration numbered `0010` (not 0008): ledger is a registry — `0009` already exists in the live DB from a loop branch; avoid future collision.
- Tiptap over hand-rolled `contentEditable`/`execCommand` per frontend-component-canon (execCommand is deprecated).

## Next step
- T1 RED tests.
