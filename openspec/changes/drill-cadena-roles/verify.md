# Verify: drill-cadena-roles — formatTimeEsAR (F1 + F2 + F3)

> Rama `feat/khal-payment-a11y`. Juez + seguridad + receipt + cierre (FASE 3, rol senior 13-security + juez).
> Fecha: 2026-09-15. Engram: `khal/drill-cadena-roles` (obs #1093, proyecto `pc living`).

## F1 — SDD (rol SDD)

Artefactos en `openspec/changes/drill-cadena-roles/`:

- `proposal.md` — intent: unificar hora `hh:mm → "19:30 h"` con voseo; scope in: helper puro +
  mensajes con voseo + validación `HH:mm` 24h con errores tipados; out: date-pickers, timezones,
  i18n multi-idioma, cambios visuales/a11y, persistencia/API. Approach: regex
  `^([01]\d|2[0-3]):[0-5]\d$`, `RangeError` ante input inválido, TDD estricto.
- `specs/time-format-es-ar/spec.md` — 3 requirements:
  1. Formateo `HH:mm → es-AR` (scenarios: `19:30→19:30 h`; `00:00→0:00 h` + `23:59→23:59 h`;
     inválidos `7:30 PM`/`25:00`/`ab:cd`/`""` → `RangeError` con el valor en el mensaje).
  2. Mensajes con voseo (`Tenés turno a las 19:30 h`, nunca `tienes`).
  3. Función pura sin locale runtime (`Intl`/`next-intl`/timezone prohibidos; `09:05→9:05 h` determinista).
- `tasks.md` — fases RED/GREEN/Verify (todas tildadas `[x]` en F3).

## F2 — Implementación (rol 16-backend + 17-ts, TDD estricto)

Paths finales:

- `packages/utils/src/formatTimeEsAR.ts` (nuevo) — `formatTimeEsAR` + `turnoMessage`.
- `packages/utils/test/formatTimeEsAR.test.ts` (nuevo) — 10 tests.
- `packages/utils/src/index.ts` (1 línea) — `export * from './formatTimeEsAR';` (barrel, convención del repo:
  los tests importan de `@khal/utils`).

Evidencia F2 (Engram obs #1093): RED 10 fallos (helper inexistente) → helper mínimo → GREEN 10/10 exit 0,
typecheck exit 0, eslint exit 0, suite completa 16 files 65 tests exit 0. Sin commit (cierra F3).

## F3 — Juez (veredicto requirement por requirement, re-verificado hoy)

| Requirement | Veredicto | Evidencia |
|---|---|---|
| Formateo `HH:mm → "H:MM h"` | ✅ CUMPLE | `formatTimeEsAR('19:30')==='19:30 h'` (test `formats an afternoon hour`, PASS) |
| Medianoche y borde | ✅ CUMPLE | `'00:00'→'0:00 h'`, `'23:59'→'23:59 h'`, `'09:05'→'9:05 h'` (3 tests, PASS) |
| Entrada inválida → `RangeError` con valor | ✅ CUMPLE | `7:30 PM`/`25:00`/`ab:cd`/`""` → `RangeError` (it.each, PASS) + test mensaje incluye `25:00` (PASS); impl: `throw new RangeError(\`Invalid time: ${input}\`)` |
| Mensajes con voseo | ✅ CUMPLE | `turnoMessage('19:30')` contiene `Tenés turno a las 19:30 h`, no contiene `tienes` (PASS) |
| Función pura sin locale runtime | ✅ CUMPLE | Impl: sólo regex + `Number` + slice + template; sin `Intl`/`Date`/`next-intl`/timezone (revisado línea por línea) |
| Out of scope respetado | ✅ CUMPLE | Sin date-pickers, timezones, i18n multi-idioma, cambios visuales ni persistencia |

**Veredicto juez: APROBADO — la implementación cumple el spec completo (6/6).**

Comandos F3 (exits reales, 2026-09-15):

- `pnpm vitest run packages/utils/test/formatTimeEsAR.test.ts` → 10 passed — exit 0
- `pnpm typecheck` → 8 successful — exit 0
- `pnpm eslint packages/utils/src/formatTimeEsAR.ts packages/utils/test/formatTimeEsAR.test.ts` → limpio — exit 0
- `pnpm test` (suite) → 16 files, 65 passed — exit 0

## F3 — Seguridad

- `gitleaks protect --staged` (v8.30.1) → `no leaks found` — exit 0.
  (Nota: `gitleaks detect --staged` no existe en v8; el subcomando correcto es `protect`.)
- `slopgate-check.py`: NO APLICA — el drill agrega 0 dependencias (helper puro sin imports);
  correrlo contra `pnpm-lock.yaml` da falsos FAILs porque chequea paquetes npm contra PyPI
  (está diseñado para `package-lock.json`/PyPI). Sin cambios en el lockfile por este drill.
- Secretos/PII: grep de patrones (`sk-`, `ghp_`, `AKIA`, private keys, `password=`, `apiKey`, DNI 7-8
  dígitos) sobre helper + test + SDD → único match: substring `dni` dentro de `midnight`
  (falso positivo). Sin secretos, tokens ni PII. ✅

## F3 — Receipt RDD

- `python E:/Hermes/scripts/rdd-receipt.py --staged` → `signed receipt-42138b24fea4.json sha=42138b24fea4 files=7` — exit 0. ✅

## F3 — Commit

- Acotado por path, sin push. Archivos del drill: helper, test, barrel `index.ts` (1 línea F2),
  `openspec/changes/drill-cadena-roles/` (proposal, tasks tildado, spec, este verify).
- Excluidos a propósito (NO son del drill): `.github/workflows/ci.yml`, `.husky/pre-commit`,
  `pnpm-lock.yaml`, `DOCS/`, `AGENTS.md`, `plan-accion-2026-09-12.md`, `supabase/.temp/`, `.worktrees/`.
