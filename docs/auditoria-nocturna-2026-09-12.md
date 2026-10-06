# Auditoría nocturna KHAL — 2026-09-12 (SIN notificación, todo UNVERIFIED)
> Parte de: [[projects/khal/README|README]] · Relacionados: [[INDICE-AUDITS]] · [[projects/khal/plan-accion-2026-09-12|plan-accion-2026-09-12]] · [[06-estado-gates]]

Branch `main`, ahead of `origin/main` by 5 commits + uncommitted work.
Nada borrado. Todo lo afirmado es UNVERIFIED (sin proyecto Supabase vivo ni deploy comprobado).

## 1. Baseline (medido)

| Check | Resultado |
|---|---|
| `turbo run typecheck` (8 pkgs) | PASS |
| `vitest run` | PASS 33/33 (7 files) |
| `eslint . --max-warnings 0` | PASS |
| `prettier --check .` (final) | **PASS** — all files clean |
| `pnpm outdated` | 3 patch-safe pendientes (`@types/node`, `lint-staged`, `typescript-eslint`); majors NO tocar (eslint 10, TS 7, vitest 5) |

## 2. Auditor general

- Arquitectura sana: monorepo pnpm+Turbo, contratos claros (availability computada,
  money en cents, Zod en borde, HMAC + idempotencia en webhooks, circuit breaker).
- Deuda real: capa de datos mock (admin + web usan `mocks/` en memoria),
  sin Supabase vivo, sin `create_booking` RPC (FOR UPDATE + overlap + idempotencia).
- Skills: 33 en `.agent/skills/` (khal-*, supabase-*, nextjs-16, react-19, etc.) — cubierto, nada SAFE faltante por instalar.

## 3. Por rol

- **09-product**: flujo catálogo → reserva → seña manual → WhatsApp definido; falta captura online. Sin README/CHANGELOG (creados ahora).
- **10-uiux / design**: Tailwind v4, next-intl es/en, error/not-found boundaries; header/slot-picker con `aria-`; falta auditoría a11y completa.
- **19-writer**: faltaban README, CHANGELOG, ADR (creados: `README.md`, `CHANGELOG.md`, `docs/ADR-0001-auth-provisoria.md`).
- **21-content**: mensajes es/en existen en web y admin; falta revisión de tono es-AR.
- **18-i18n**: next-intl en ambas apps, rutas `[locale]`; sin test de paridad de claves.
- **15-a11y**: `eslint-plugin-jsx-a11y` en PASS, aria parcial; sin test keyboard/contraste.
- **23-legal**: `SECURITY.md` existe; **sin `LICENSE`** (gap).
- **Pagos**: transferencia manual (alias/CBU + comprobante WhatsApp). Sin MP/Stripe. Gate BLOQUEANTE.
- **Auth**: mock cookie `khal_role` (ver ADR-0001). Gate BLOQUEANTE.
- **RLS/deploy**: policies en migración, sin DB viva ni URL verificada. Gate BLOQUEANTE.

## 4. Gaps triaje

| ID | Gap | Sev | Camino |
|---|---|---|---|
| G1 | Auth mock → JWT Supabase claims | P0 | `requireAuth` + claims + E2E login |
| G2 | RLS sin verificar en DB viva | P0 | linkear proyecto + `db push` + tests RPC |
| G3 | Sin captura online (solo manual) | P0 | decidir MP vs manual; webhook HMAC ya listo |
| G4 | Mocks en memoria (doble reserva, blacklist) | P0 | RPC `create_booking` (overlap + idempotencia) |
| G5 | Sin `LICENSE` | P1 | elegir licencia y agregar |
| G6 | Patch-safe deps pendientes (3) | P2 | `pnpm update` acotado + CI verde |
| G7 | Paridad i18n es/en sin test | P2 | test de claves |
| G8 | a11y completa (keyboard/contraste) | P2 | auditoría 15-a11y dedicada |

## 5. Kanban dry-run (sin escribir en ningún board)

- **Blocked (P0)**: G1 auth JWT · G2 RLS viva · G3 pagos online · G4 RPC booking.
- **Ready (P1)**: G5 LICENSE.
- **Backlog (P2)**: G6 deps patch · G7 i18n keys test · G8 a11y audit.
- **Done (hoy)**: baseline · prettier pass · README/CHANGELOG/ADR-0001 · este reporte.

## 6. Auto-recovery log

- Prettier: formato total PASS. Causa raíz del error en 2 `globals.css`:
  `.prettierrc.json` apuntaba `tailwindConfig` a un archivo inexistente
  (proyecto Tailwind v4 sin config). Fix: línea eliminada + `--write` en los
  2 CSS. `pnpm-lock.yaml` revertido (ruido de 1847 líneas, sin cambio
  semántico). 1 intento, sin retry necesario. Nada roto, nada borrado.
- Stack menor: NO aplicado esta noche para no dejar el árbol inestable con el
  diff de formato encima; queda como G6 acotado y seguro.
