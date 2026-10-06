# Tasks: drill-cadena-roles — formatTimeEsAR

> Para rol 16-backend (FASE 2). TDD estricto. NO commitear: dejar untracked.

## Phase 1 — RED (tests que fallan) — ✅ verificado F3

- [x] 1.1 Crear test co-ubicado del helper (ej: `formatTimeEsAR.test.ts` junto al helper)
  - Casos: `"19:30"→"19:30 h"`, `"00:00"→"0:00 h"`, `"23:59"→"23:59 h"`, `"09:05"→"9:05 h"`
  - Inválidos: `"7:30 PM"`, `"25:00"`, `"ab:cd"`, `""` → esperan `RangeError`
  - Mensaje con voseo contiene `"Tenés turno a las 19:30 h"` (sin "tienes")
- [x] 1.2 Correr `pnpm test <ruta-del-test>` y confirmar que FALLA (helper no existe)
  - Criterio: salida roja pegada en el reporte de fase 2

## Phase 2 — GREEN (implementación mínima) — ✅ verificado F3

- [x] 2.1 Crear helper puro `formatTimeEsAR(input: string): string`
  - Regex `^([01]\d|2[0-3]):[0-5]\d$`; si no matchea → `throw new RangeError(\`Invalid time: ${input}\`)`
  - Formato: `${Number(H)}:${MM} h` (sin padding en hora, con padding en minutos)
  - Sin `Intl` / `next-intl` / `Date` / timezone
- [x] 2.2 Función de mensaje ejemplo: `turnoMessage(hhmm: string): string` → `` `Tenés turno a las ${formatTimeEsAR(hhmm)}` ``
- [x] 2.3 Correr `pnpm test <ruta>` + `pnpm typecheck` en verde

## Phase 3 — Verify (cierre para fase 3) — ✅ hecho F3

- [x] 3.1 `pnpm lint` limpio en archivos tocados
- [x] 3.2 `git status --short` muestra SÓLO untracked de este cambio + helper/test (sin commit)
- [x] 3.3 Reportar: paths finales del helper y test + comandos corridos + salidas
