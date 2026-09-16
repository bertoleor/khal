# 06 — Estado y gates (baseline 2026-09-15)

Todo **UNVERIFIED** contra DB viva / deploy real salvo que se indique.
Mediciones de `DOCS/auditoria-nocturna-2026-09-12.md`; correcciones de la
auditoría a11y/tono 2026-09-14 y del reporte de producto.

## Baseline medida (2026-09-12)

| Check | Resultado |
|---|---|
| `turbo run typecheck` (8 pkgs) | PASS |
| `vitest run` | PASS 33/33 (7 files) |
| `eslint . --max-warnings 0` | PASS |
| `prettier --check .` | PASS |
| `pnpm outdated` | 3 patch-safe (`@types/node`, `lint-staged`, `typescript-eslint`); majors NO tocar |

Verificado 2026-09-14 (estático, no corrida viva): paridad i18n sin drift
(48/48 web, 39/39 admin); skip-link ya existe en `Header` web; voseo 100%
coherente.

## Gates bloqueantes P0 (todos UNVERIFIED)

| ID | Gate | Salida |
|---|---|---|
| G1 | Auth mock → JWT Supabase (`app_metadata.role`) | Aplicar ADR-0001 sobre Auth real; quitar fallback cookie; E2E login |
| G2 | RLS sin verificar | Linkear proyecto + `db push` migraciones 0001-0003 + tests RPC |
| G3 | Pagos: MP vs manual-only | **Decisión de la dueña.** Si MP: provisionar `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET` + crear `/pago/exito|error|pendiente` + webhook en vivo. Si manual: blanquear transferencia+WhatsApp como flujo oficial |
| G4 | Mocks en memoria | Reserva real vía RPC `create_booking`; booking concurrente sin doble-reserva |

## Gaps P1/P2

- **P1:** sin `LICENSE`; agregar.
- **P2:** 3 deps patch-safe; `aria-current` nav admin; `aria-live` en región
  `status`; 4 pares de color FAIL AA; `¡Hola!` con apertura; duplicación
  `error.*`/`notFound.*`; `lang="es-AR"`.

## Fases (`plan-accion-2026-09-12.md`)

1. **Auth real + DB viva** (due 2026-09-19) — G1/G2/G4.
2. **Pagos: MP o manual-only** (due 2026-09-26) — G3, decisión humana.
3. **Contenido/estilo + legales** (due 2026-10-03) — LICENSE, paridad,
   tono, a11y; gate `pnpm build` + 33/33 tests + LICENSE.

Nada se aplica sin OK de la dueña.
