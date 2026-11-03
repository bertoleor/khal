# Plan de Acción — khal v7: Gradient Background + Accesibilidad AA + Design System Compliance

**Branch:** `feat/v7-clienta-bw-glass` (actual: `976511b`)
**Objetivo:** Fix all AA violations, design system compliance, micro-polish per Emil + Impeccable
**Fecha:** 2026-11-03
**Owner:** Gentle AI on Hermes
**Methodology:** TDD + ODD

---

## Specs (S#) — Requisitos de Aceptación

| ID | Spec | Criterio de Aceptación | Checks Aplicables |
|----|------|------------------------|-------------------|
| **S1** | **Contraste AA** — Todos los textos sobre gradiente pasan 4.5:1 (AA) y 7:1 (AAA para large text). | 1. `wcag-skill` audit: 0 contrast violations en home 2. Tokens semánticos `--text-on-gradient`, `--ghost-on-gradient` definidos y usados 3. Hero "Khal" + tagline + kicker + botones + footer ghost ≥ 4.5:1 | `wcag-skill` (axe + pa11y), manual contrast check |
| **S2** | **Reduced-motion respetado** — Animaciones se detienen/reducen cuando el usuario lo solicita. | 1. Three.js shader loop se pausa 2. TouchTexture trail se desactiva 3. Custom cursor trail se desactiva 4. CSS transitions/animations se desactivan via media query 5. `axe` detecta 0 reduced-motion violations | `wcag-skill` (axe), manual test con `prefers-reduced-motion: reduce` |
| **S3** | **ThemeToggle accesible** — Botón visible, con `translate="no"`, focus ring token, sin `invisible` hack. | 1. `aria-label` dinámico correcto 2. `translate="no"` en "mode" 3. Focus visible usa `--focus-ring` token 4. No `invisible` class; hidratación con `opacity-0 pointer-events-none` + `data-mounted` | `axe`, `tsc`, visual |
| **S4** | **Botones canónicos** — `transition` explícito, `scale(0.97)` en `:active`, `will-change`. | 1. `transition-colors` → propiedades explícitas 2. `active:scale-[0.97]` 3. `will-change: transform` en base 4. `transition: background-color, border-color, color` | `tsc`, visual, `impeccable audit` |
| **S5** | **CursorTrail pulido** — easing custom, `will-change`, reduced-motion, hover-only. | 1. `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` 3. `@media (prefers-reduced-motion: reduce)` hide 4. `@media (hover: hover)` only 5. `will-change: transform` | `tsc`, visual, `wcag-skill` |
| **S6** | **Tokens completos** — 0 hardcoded rgba/opacity/shadow/z-index/transition. | 1. `--hero-shadow`, `--ease-out`, `--ease-in-out`, `--hero-overlay-opacity`, `--button-overlay-opacity`, `--text-muted-opacity` 2. 0 hardcoded en grep audit | `grep` audit, `tsc`, `impeccable audit` |
| **S7** | **WhatsApp → LinkButton external** — Botón usa componente canónico. | 1. WhatsApp usa `LinkButton variant="glass" external` 2. `aria-label="se abre en nueva pestaña"` | `tsc`, visual |
| **S8** | **CI gates** — `impeccable audit` + `wcag-skill` + `tsc` + `build` en PR. | 1. GitHub Actions workflow corre axe + pa11y + impeccable + tsc + build 2. Falla en violations nuevas | GitHub Actions, PR check |
| **S9** | **Unificación imports** — `clsx` → `cn` alias consistente. | 1. `@/lib/cn` usado en todos los componentes `@khal/ui` 2. `clsx` removido de deps | `grep` audit, `tsc` |

---

## Tasks (T#) — Unidades de Trabajo con TDD

| ID | Specs | Ruta | Descripción | Test First |
|----|-------|------|-------------|------------|
| **T1** | S1, S6 | `packages/ui/src/tokens.css`, `apps/web/src/app/globals.css`, `apps/web/src/app/[locale]/page.tsx` | **Tokens + Overlays**: Definir tokens faltantes (`--hero-shadow`, `--ease-out`, `--ease-in-out`, `--hero-overlay-opacity`, `--button-overlay-opacity`, `--text-muted-opacity`, `--cursor-transition-duration`). Actualizar overlays en page.tsx a usar tokens. | Test: grep audit 0 hardcoded; visual contrast check |
| **T2** | S3 | `apps/web/src/components/shared/theme-toggle.tsx` | **ThemeToggle accesible**: Quitar `invisible` hack, usar `data-mounted` + `opacity-0 pointer-events-none`. `translate="no"` en "mode". Focus ring con token. | Test: axe 0 violations; visual focus ring |
| **T3** | S4 | `packages/ui/src/components/button/Button.tsx`, `packages/ui/src/components/button/LinkButton.tsx` | **Botones canónicos**: `transition-colors` → propiedades explícitas. `active:scale-[0.97]`. `will-change: transform`. `transition: background-color 160ms ease-out, border-color 160ms ease-out, color 160ms ease-out`. | Test: impeccable audit 0 advisories; visual scale |
| **T4** | S5 | `packages/ui/src/components/cursor-trail/CursorTrail.tsx`, `apps/web/src/app/globals.css` | **CursorTrail pulido**: `--ease-out` token. `will-change: transform`. `@media (prefers-reduced-motion: reduce)` hide. `@media (hover: hover)` only. | Test: reduced-motion hide; visual trail |
| **T5** | S7 | `apps/web/src/app/[locale]/page.tsx`, `packages/ui/src/components/button/LinkButton.tsx` | **WhatsApp → LinkButton external**: Variant `glass` + `external`. `aria-label="se abre en nueva pestaña"`. | Test: axe external link label; visual |
| **T6** | S8 | `.github/workflows/audit.yml` | **CI gates**: axe + pa11y + impeccable + tsc + build. Falla en violations nuevas. | Test: workflow runs on PR |
| **T7** | S9 | `packages/ui/src/components/cursor-trail/CursorTrail.tsx`, `packages/ui/src/components/button/*.tsx` | **Unificar imports**: `clsx` → `cn` alias (`@/lib/cn`). | Test: grep `clsx` = 0 en @khal/ui |
| **T8** | S1, S6 | `apps/web/src/app/[locale]/page.tsx`, `apps/web/src/app/globals.css`, `packages/ui/src/tokens.css` | **Overlays + Contraste AA**: Hero `bg-black/60` → token `--hero-overlay-opacity`. Botones `bg-black/40` → token `--button-overlay-opacity`. Tagline `text-muted/80` → token `--text-muted-opacity`. Hero shadow token `--hero-shadow`. | Test: wcag-skill contrast ≥ 4.5:1; grep audit 0 hardcoded |

---

## Log

**L1** (2026-11-03) — Auditoría completa (impeccable + wcag-skill + web-design-guidelines + emil-design-eng). Hallazgos: 12 críticos a11y, 6/6 textos fallan contraste AA, 7 violaciones tokens, 4 acoplamientos rígidos, 3 violaciones reduced-motion, 6 transition-all, 3 scale ≠ 0.97. Plan creado.

**L2** (2026-11-03) — Plan aprobado. Iniciando ejecución TDD+ODD.

---

## Archivos Afectados (Resumen)

### Nuevos/Modificados (TDD)
- `packages/ui/src/tokens.css` (+7 tokens)
- `apps/web/src/app/globals.css` (reduced-motion, utilities, tokens)
- `apps/web/src/app/[locale]/page.tsx` (overlays tokens, WhatsApp LinkButton)
- `apps/web/src/components/shared/theme-toggle.tsx` (accesible)
- `packages/ui/src/components/button/Button.tsx` (transition explícito, scale 0.97, will-change)
- `packages/ui/src/components/button/LinkButton.tsx` (transition explícito, scale 0.97, external)
- `packages/ui/src/components/button/IconButton.tsx` (consistencia)
- `packages/ui/src/components/cursor-trail/CursorTrail.tsx` (easing token, will-change, reduced-motion)
- `apps/web/src/components/shared/theme-toggle.tsx` (accesible, data-mounted)
- `apps/web/src/app/[locale]/page.tsx` (overlays tokens, WhatsApp LinkButton)
- `apps/web/src/app/globals.css` (reduced-motion, utilities, tokens)
- `.github/workflows/audit.yml` (CI gates)

---

## Criterios de Done por Task (TDD)

Cada task se considera **DONE** cuando:
1. **RED** — Test escrito y visto fallar (falla por feature missing, no typo)
2. **GREEN** — Código mínimo para pasar test
3. **REFACTOR** — Limpieza manteniendo tests verdes
4. `tsc --noEmit` → 0 errores
5. `pnpm exec next build` → exit 0
6. `wcag-skill` audit (axe + pa11y) → 0 violations nuevas
7. `impeccable audit` → 0 advisories nuevas
8. Visual regression: sin cambios no intencionales
9. Commit convencional en `feat/v7-clienta-bw-glass`

---

## Orden de Ejecución (TDD vertical)

1. **T1** (Tokens base) → 2. **T8** (Overlays + Contraste) → 3. **T2** (ThemeToggle) → 4. **T3** (Botones) → 5. **T4** (CursorTrail) → 6. **T5** (WhatsApp) → 7. **T7** (Imports) → 8. **T6** (CI) → 9. **Commit + Push + Verify Deploy**

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Contraste variable por animación | Alta | Alto | Overlay fijo `bg-black/60` detrás de textos, no confiar en shader |
| Three.js `prefers-reduced-motion` no detiene a tiempo | Media | Alto | Test manual con `reduce` en DevTools antes de commit T4 |
| `Button` canon rompe páginas existentes | Baja | Medio | Visual test en `catalogo`, `conocenos`, `booking` antes de merge |
| CI `wcag-skill` tools no instaladas | Media | Medio | Pre-instalar en workflow |

---

## Métricas de Éxito Final

| Métrica | Target |
|---------|--------|
| `axe` violations | 0 |
| `pa11y` errors | 0 |
| Contraste textos | 100% ≥ 4.5:1 (AA) |
| Large text contraste | 100% ≥ 7:1 (AAA) |
| Hardcoded rgba/opacity/shadow/z-index/transition | 0 (grep audit) |
| `transition-colors` / `transition-all` | 0 |
| `active:scale-[0.985]` | 0 (→ 0.97) |
| `impeccable audit` advisories | 0 nuevas |
| Bundle size increase | ≤ +5KB |
| LCP home | < 2.5s |

---

**Próximo paso:** Iniciar **T1** (Tokens base) con TDD.
