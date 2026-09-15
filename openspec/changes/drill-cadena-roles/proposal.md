# Proposal: formatTimeEsAR — hora es-AR con voseo en mensajes

## Intent

Unificar cómo se muestra la hora (hh:mm → "19:30 h") en mensajes al usuario con voseo rioplatense, evitando formatos inconsistentes (AM/PM, locales mixtos).

## Scope

### In Scope
- Helper puro `formatTimeEsAR(hh:mm)` → string es-AR ("19:30 h")
- Mensajes con voseo que consumen la hora formateada (ej: "Tenés turno a las 19:30 h")
- Validación de entrada `HH:mm` 24h y errores tipados

### Out of Scope
- Date-pickers, timezones, i18n multi-idioma
- Cambios visuales / a11y de componentes
- Persistencia o API de turnos

## Capabilities

### New Capabilities
- `time-format-es-ar`: formateo de hora 24h a es-AR + mensajes con voseo

### Modified Capabilities
- None

## Approach

Función pura TS sin dependencias, validación con regex `^([01]\d|2[0-3]):[0-5]\d$`; error `RangeError` ante input inválido. Tests unitarios primero (TDD estricto).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/utils/formatTimeEsAR.ts` (o equivalente) | New | Helper + tipos de error |
| `src/**/*.test.ts` (co-ubicado) | New | Tests RED/GREEN del helper |
| `openspec/specs/time-format-es-ar/spec.md` | New | Spec promovida al archivar |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Ubicación del helper difiere del monorepo | Med | El implementador crea el path canónico y lo declara en tasks |
| Colisión con next-intl | Low | Helper agnóstico al locale runtime; sólo formato es-AR fijo |

## Rollback Plan

Borrar `openspec/changes/drill-cadena-roles/` (untracked); si ya se implementó, revert del archivo helper + su import. Sin migración de datos.

## Dependencies

- Ninguna. Sólo toolchain existente (`pnpm test`, `pnpm typecheck`).

## Success Criteria

- [ ] `formatTimeEsAR("19:30") === "19:30 h"` y rechaza `"7:30 PM"`, `"25:00"`
- [ ] Mensaje ejemplo usa voseo: "Tenés turno a las 19:30 h"
- [ ] Todo queda untracked para FASE 2 (sin commit)
