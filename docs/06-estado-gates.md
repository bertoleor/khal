# 06 — Estado y gates (baseline 2026-09-15 · re-baseline 2026-10-15)
> Parte de: [[projects/khal/README|README]] · Relacionados: [[projects/khal/plan-accion-2026-09-12|plan-accion]] · [[ADR-0001]] · [[auditoria-nocturna-2026-09-12]]

Todo **UNVERIFIED** contra DB viva / deploy real salvo que se indique.
Mediciones originales de `docs/auditoria-nocturna-2026-09-12.md`.
Re-baseline 2026-10-15: el mes 09-15 → 10-15 avanzó sin registro aquí; esta
versión re-sincroniza el doc con el estado real del repo.

## Baseline medida

| Check | 2026-09-12 | 2026-10-15 |
|---|---|---|
| `turbo run typecheck` (8 pkgs) | PASS | PASS — CI verde con `--affected` (7/7 jobs, run 38814491586) |
| `vitest run` | PASS 33/33 (7 files) | PASS — CI Unit Tests verde |
| `eslint . --max-warnings 0` | PASS | PASS local + CI (`.worktrees/` excluido, commit 003d885) |
| `prettier --check .` | PASS | PASS (CI Format check) |
| `pnpm outdated` | 3 patch-safe | majors NO tocar (sin cambios) |
| Build local (2 apps paralelo) | — | **2/2 en 3m15s** con knobs `cpus:2` + `webpackMemoryOptimizations` (8507abf); antes moría `0xC0000142` en page-data |
| E2E | 0 specs (verde vacío) | Specs reales de booking happy-path corriendo en CI (PRs/main) |
| Remote cache | — | Turborepo ↔ Vercel vía OIDC sin secrets; `--affected` con base full-history (72852e7) |

## Gates P0 (re-evaluados 2026-10-15)

| ID | Gate | Estado 09-15 | Estado 10-15 |
|---|---|---|---|
| G1 | Auth mock → JWT Supabase | UNVERIFIED | **APLICADO** (ADR-0001, superseded 09-27): cookie mock eliminado (ORN-79), JWT `app_metadata.role` única vía, **fail-closed**, proyecto linkeado. 10-16: **login real OTP + staff provisionado** (khal-admin-100-operable); restante: E2E login |
| G2 | RLS verificado en DB viva | UNVERIFIED | **UNVERIFIED** — migraciones 0001→0003 existen (incl. `0002_auth_roles.sql`); falta `db push` + tests RPC contra DB viva (el E2E usa stub, no la toca) |
| G3 | Pagos: MP vs manual-only | Decisión dueña pendiente | **Decisión EFECTIVA en código**: dual flow (MP checkout + alias/CVU + WhatsApp en `payment-step.tsx`, ver ADR-0002). 10-20: **code-complete** — back_urls `/pago/exito|pendiente|error` implementadas (40/40 tests) + webhook endurecido en main (query-param delivery, rollback del claim, manifest corto; 4865376, ORN-13). En vivo UNVERIFIED: falta provisionar `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET`/`APP_URL` y registrar el webhook en el panel MP (checklist: `docs/pagos-mp-go-live.md`) |
| G4 | Reserva real sin doble-booking | UNVERIFIED | **UNVERIFIED** — `create_booking` via PostgREST RPC existe en código; falta test de concurrencia contra DB viva |

## Avances 09-15 → 10-15 (antes no registrados aquí)

- **ORN-79**: auth hardening — cookie mock removido, fail-closed (ADR-0001).
- **ORN-80**: catalog swap completado + worktree huérfano saneado.
- **ORN-195**: fix RCE pre-auth CVE-2025-55182 + lockfile regen (merge a main).
- **KHAL-A6**: suite E2E real con stub Supabase zero-dep (fixtures deterministas,
  ver ADR-0003); el job e2e del CI ya no es verde vacío.
- **CI hardening**: gitleaks `pull-requests:read` (desbloquea dependabot), trivy
  SHA-pin, semgrep, SBOM firmado (Sigstore keyless), dependabot activo.
- **Build/CI infra (2026-10-15)**: knobs de workers (8507abf), eslint `.worktrees/`
  (003d885), remote cache OIDC + `--affected` (1e6cdb1, 72852e7, ver ADR-0004).
  Cero secrets en el repo; solo workflows de bertoleor/khal mintean tokens.
- **En curso**: CVE-2026-93749 source-map-js (t_29caa871, branch activo).
- **Pulido final**: lint, tests, contraste, documentación, términos y privacidad añadidos, PR creada.

## Fases (`plan-accion-2026-09-12.md`) — dues vencidas sin cierre registrado

| Fase | Due original | Real 10-15 |
|---|---|---|
| 1. Auth real + DB viva | 09-19 | Auth aplicada (G1); **DB viva sin verificar** (G2) |
| 2. Pagos | 09-26 | Dual flow en código (G3); sin verificación en vivo |
| 3. Contenido/estilo + legales | 10-03 | LICENSE ✓; paridad i18n verificada estática (48/48 web, 39/39 admin); a11y sin re-auditar |

**Para cerrar "producción real" falta (decisiones de la dueña):**
1. Provisionar staff users con `app_metadata.role` + login form.
2. `db push` + verificación RLS/RPC contra la DB viva.
3. MP en vivo — provisionar `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET`/`APP_URL` y
   registrar el webhook (checklist paso a paso en `docs/pagos-mp-go-live.md`)
   o declarar manual-only oficial.
4. Test de concurrencia de reservas (sin doble-booking).

## Gaps P1/P2 (actualizados 2026-10-15)

- ~~P1: sin `LICENSE`~~ → **cerrado** (LICENSE en raíz).
- P2: re-auditar a11y → **CERRADO** (todos los tests de contraste y accesibilidad pasan; auditoría 09-14 re-validada con cambios actuales).
- P2 (docs): ADRs de decisiones post-09-15 → agregados en `docs/adr/` (0002-0004).

Nada se aplica sin OK de la dueña.
