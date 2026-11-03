# Plan de Acción — khal v7: Gradient Background + Accesibilidad AA + Design System Compliance

**Branch:** `feat/v7-clienta-bw-glass` (actual: `af05425`)
**Objetivo:** Separar capa decorativa/interactiva, lograr contraste AA sobre gradiente, respetar `prefers-reduced-motion`, alinear 100% a tokens khal v7, y refactorar a componentes canónicos.
**Fecha:** 2026-11-03
**Owner:** Gentle AI on Hermes

---

## Specs (S#) — Requisitos de Aceptación

| ID | Spec | Criterio de Aceptación | Checks Aplicables |
|----|------|------------------------|-------------------|
| **S1** | **Capa decorativa aislada** — `FlowGradientBackground` solo renderiza canvas Three.js (decorativo, `aria-hidden=true`). Sin CTA, sin pause, sin cursor custom, sin footer atribución. | 1. `FlowGradientBackground` exporta solo `<div aria-hidden="true"><canvas /></div>` 2. No botones interactivos en su árbol 3. `axe` 0 violations en la capa | `axe`, `tsc`, visual diff |
| **S2** | **Capa UI con componentes canónicos** — Header, Hero, Nav, Footer usan `Button`/`LinkButton`/`GhostButton` del design system (packages/ui). | 1. `primeClass`/`doorClass`/`arrowClass` eliminados 2. Componentes en `packages/ui/src/components/button/` 3. `page.tsx` importa y usa variants | `tsc`, storybook, visual regression |
| **S3** | **Contraste AA garantizado** — Todos los textos sobre gradiente pasan 4.5:1 (AA) y 7:1 (AAA para large text). | 1. `wcag-skill` audit: 0 contrast violations en home 2. Tokens semánticos `--text-on-gradient`, `--ghost-on-gradient` definidos y usados 3. Hero "Khal" + tagline + kicker + botones + footer ghost ≥ 4.5:1 | `wcag-skill` (axe + pa11y), manual contrast check |
| **S4** | **`prefers-reduced-motion` respetado** — Animaciones se detienen/reducen cuando el usuario lo solicita. | 1. Three.js shader loop se pausa 2. TouchTexture trail se desactiva 3. Custom cursor trail se desactiva 4. CSS transitions/animations se desactivan via media query 5. `axe` detecta 0 reduced-motion violations | `wcag-skill` (axe), manual test con `prefers-reduced-motion: reduce` |
| **S5** | **ThemeToggle accesible** — Botón visible, con `translate="no"`, focus ring token, sin `invisible` hack. | 1. `aria-label` dinámico correcto 2. `translate="no"` en "mode" 3. Focus visible usa `--focus-ring` token 4. No `invisible` class; hidratación con `opacity-0 pointer-events-none` + `data-mounted` | `axe`, `tsc`, visual |
| **S6** | **Custom cursor khal propio** — Ring + dot con tokens, solo desktop, respeta reduced-motion. | 1. Componente `CursorTrail` en `packages/ui/src/components/cursor-trail/` 2. Tokens `--cursor-ring-size`, `--cursor-dot-size`, `--cursor-z` 3. `@media (hover: hover)` + `prefers-reduced-motion: reduce` → `display: none` 4. No duplicación con componente 21st.dev | `tsc`, visual, `wcag-skill` |
| **S7** | **Design tokens para todo lo hardcoded** — 7+ tokens nuevos definidos en `packages/ui/src/tokens.css` y usados. | 1. `--ghost-opacity`, `--text-on-gradient`, `--shadow-elevated`, `--cursor-ring-size`, `--cursor-dot-size`, `--cursor-z`, `--focus-ring` 2. 0 hardcoded rgba/opacity/shadow/z-index en `page.tsx`, `globals.css`, componentes | `grep` audit, `tsc`, `impeccable audit` |
| **S8** | **Atribución legal visible y accesible** — En `/politicas` y en footer del gradiente (si se mantiene). | 1. Contraste ≥ 4.5:1 en ambas ubicaciones 2. Enlace externo con `aria-label="se abre en nueva pestaña"` 3. `translate="no"` en nombres propios | `wcag-skill`, manual |
| **S9** | **CI gates** — Auditoría automática en PR. | 1. `impeccable audit` + `wcag-skill` (axe + pa11y) en GitHub Actions 2. Build falla si hay violations nuevas | CI pipeline, PR check |

---

## Tasks (T#) — Unidades de Trabajo

| ID | Specs | Ruta | Descripción | Commit |
|----|-------|------|-------------|--------|
| **T1** | S1 | `apps/web/src/components/shared/flow-gradient-background.tsx` | **Separar capa decorativa**: Reescribir wrapper para que solo renderice el canvas Three.js del componente 21st.dev (sin CTA, pause, cursor, footer). `aria-hidden="true"` en contenedor. Eliminar props `title`, `showPauseButton`, `ctaText`, `onCtaClick`, `showAttribution`. | `feat(web): gradient background decorative layer only` |
| **T2** | S2 | `packages/ui/src/components/button/` (nuevo) | **Componentes canónicos**: Crear `Button.tsx` (variants: `primary`, `glass`, `ghost`), `LinkButton.tsx`, `IconButton.tsx`. Usar tokens: `--focus-ring`, `--shadow-elevated`, `--glass-highlight`, `--radius-full`. Tests unitarios + storybook. | `feat(ui): canonical button components` |
| **T3** | S2 | `apps/web/src/app/[locale]/page.tsx` | **Refactor home a componentes**: Eliminar `primeClass`/`doorClass`/`arrowClass`. Usar `Button` (`variant="primary"`), `LinkButton` (`variant="glass"`), `LinkButton` (`variant="ghost"`). Arrows como sub-componente `ArrowRight`. | `feat(web): home page uses canonical buttons` |
| **T4** | S7 | `packages/ui/src/tokens.css` | **Tokens nuevos**: Definir `--ghost-opacity: 0.08; --text-on-gradient: #ffffff; --shadow-elevated: 0 4px 16px rgba(0,0,0,0.3); --cursor-ring-size: 40px; --cursor-dot-size: 8px; --cursor-z: 30; --focus-ring: 2px solid var(--accent); --text-on-gradient: #ffffff; --ghost-on-gradient: rgba(255,255,255,0.08);`. Actualizar `html.light` overrides. | `feat(ui): gradient accessibility tokens` |
| **T5** | S3 | `apps/web/src/app/[locale]/page.tsx` + `globals.css` | **Contraste AA**: Aplicar `--text-on-gradient` / `--ghost-on-gradient` a hero, tagline, kicker, botones, footer ghost. Fondos semi-transparentes (`bg-black/60` o `bg-surface/80` con token) detrás de textos sobre gradiente. Verificar con `wcag-skill`. | `fix(web): contrast AA on gradient` |
| **T6** | S4 | `apps/web/src/components/ui/flow-gradient-hero-section.tsx` | **Reduced-motion en Three.js**: Detectar `prefers-reduced-motion` en `App` constructor. Si `reduce`: `isPaused = true`, `touchTexture.update = noop`, `cursor trail = noop`. Exponer `setPaused` para control externo. | `fix(web): gradient respects reduced-motion` |
| **T7** | S4 | `apps/web/src/app/globals.css` | **CSS reduced-motion**: `@media (prefers-reduced-motion: reduce) { .liquid-container * { animation: none !important; transition: none !important; } .cursor-ring, .cursor-dot-element { display: none !important; } }`. | `fix(web): css reduced-motion support` |
| **T8** | S5 | `apps/web/src/components/shared/theme-toggle.tsx` | **ThemeToggle accesible**: Eliminar `invisible` hack. Usar `data-mounted` attribute + CSS `opacity-0 pointer-events-none` hasta hidratar. `translate="no"` en "mode". Focus ring con `focus-visible:ring-2 focus-visible:ring-accent` (token `--focus-ring`). | `fix(web): accessible theme toggle` |
| **T9** | S6 | `packages/ui/src/components/cursor-trail/` (nuevo) | **CursorTrail componente**: Ring + dot con tokens `--cursor-ring-size`, `--cursor-dot-size`, `--cursor-z`. `@media (hover: hover)` + `prefers-reduced-motion: reduce` → `display: none`. Integrar en `page.tsx` (solo desktop). | `feat(ui): custom cursor trail component` |
| **T10** | S1+S6 | `apps/web/src/app/[locale]/page.tsx` | **Integrar cursor propio**: Importar `CursorTrail` y renderizar en capa UI (no en gradiente). Eliminar CSS `.cursor-ring`/`.cursor-dot-element` de `globals.css` (los del componente 21st.dev). | `feat(web): khal custom cursor integration` |
| **T11** | S8 | `apps/web/src/app/[locale]/politicas/page.tsx` | **Atribución legal contraste**: Verificar y fijar contraste ≥ 4.5:1 en sección "Créditos". `aria-label` en enlace externo "Made By Haik". | `fix(web): legal attribution contrast` |
| **T12** | S9 | `.github/workflows/audit.yml` (nuevo) | **CI gates**: Workflow que corre `impeccable audit`, `wcag-skill` (axe + pa11y), `tsc --noEmit`, `pnpm build`. Falla en violations nuevas. | `ci: add design/a11y audit gates` |
| **T13** | S1 | `apps/web/src/components/ui/flow-gradient-hero-section.tsx` | **Limpieza componente 21st.dev**: Eliminar CTA, pause, cursor, footer, title rendering del componente (ya no se usan). Mantener solo: Three.js init, shader, TouchTexture, theme detection, resize, cleanup. Exportar `LiquidGradient` como componente decorativo puro. | `refactor(web): 21st.dev component decorative only` |
| **T14** | S2+S7 | `apps/web/src/app/globals.css` | **Limpieza CSS**: Eliminar estilos `.cta-btn`, `.pause-btn`, `.footer-main`, `.cursor-ring`, `.cursor-dot-element`, `.title-main` (ya no se usan). Mantener solo: `.liquid-container`, `.liquid-canvas-wrapper`, `@media (prefers-reduced-motion)`, `@media (hover: none)`. | `refactor(web): remove unused gradient component styles` |

---

## Log

**L1** (2026-11-03) — Auditoría completa (impeccable + wcag-skill + web-design-guidelines). Hallazgos: 12 críticos a11y, 6/6 textos fallan contraste AA, 7 violaciones tokens, 4 acoplamientos rígidos, 3 violaciones reduced-motion. Plan creado.

---

## Archivos Afectados (Resumen)

### Nuevos
- `packages/ui/src/components/button/Button.tsx`
- `packages/ui/src/components/button/LinkButton.tsx`
- `packages/ui/src/components/button/IconButton.tsx`
- `packages/ui/src/components/button/index.ts`
- `packages/ui/src/components/button/Button.stories.tsx`
- `packages/ui/src/components/button/Button.test.tsx`
- `packages/ui/src/components/cursor-trail/CursorTrail.tsx`
- `packages/ui/src/components/cursor-trail/index.ts`
- `.github/workflows/audit.yml`

### Modificados
- `packages/ui/src/tokens.css` (+7 tokens)
- `apps/web/src/components/shared/flow-gradient-background.tsx` (rewrite)
- `apps/web/src/components/ui/flow-gradient-hero-section.tsx` (strip to decorative)
- `apps/web/src/app/[locale]/page.tsx` (refactor completo)
- `apps/web/src/app/[locale]/politicas/page.tsx` (contraste atribución)
- `apps/web/src/components/shared/theme-toggle.tsx` (accesibilidad)
- `apps/web/src/app/globals.css` (tokens + reduced-motion + limpieza)

### Eliminados (de page.tsx inline)
- `primeClass`, `doorClass`, `arrowClass` strings

---

## Criterios de Done por Task

Cada task se considera **DONE** cuando:
1. `tsc --noEmit` pasa (0 errores)
2. `pnpm exec next build` pasa (exit 0)
3. `wcag-skill` audit (axe + pa11y) 0 violations nuevas en archivos tocados
4. `impeccable audit` 0 advisories nuevas en archivos tocados
5. Visual regression: sin cambios no intencionales (comparar screenshots)
6. Commit convencional en `feat/v7-clienta-bw-glass` con mensaje descriptivo

---

## Orden de Ejecución Recomendado

1. **T4** (tokens base) → 2. **T13** (strip 21st.dev) → 3. **T1** (decorative layer) → 4. **T2** (button canon) → 5. **T3** (home refactor) → 6. **T6/T7** (reduced-motion) → 7. **T5** (contraste) → 8. **T8** (theme toggle) → 9. **T9/T10** (cursor propio) → 10. **T11** (atribución) → 11. **T14** (limpieza CSS) → 12. **T12** (CI gates)

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Three.js `prefers-reduced-motion` no detiene shader a tiempo | Media | Alto (WCAG) | Test manual con `reduce` en DevTools antes de commit T6 |
| Contraste variable por animación del gradiente | Alta | Alto | Usar overlay semi-transparente fijo (`bg-black/60`) detrás de textos, no confiar en colores del shader |
| `Button` canon rompe páginas existentes | Baja | Medio | Test visual en `catalogo`, `conocenos`, `booking` antes de merge |
| CI `wcag-skill` requiere tools no instaladas en runner | Media | Medio | Pre-instalar `@axe-core/cli pa11y @qualweb/cli vnu-jar chromedriver` en workflow |
| Custom cursor conflictúa con focus-visible del sistema | Baja | Medio | `CursorTrail` solo se monta en `@media (hover: hover)` y `pointer-events: none` |

---

## Métricas de Éxito

- **Accesibilidad:** `axe` 0 violations, `pa11y` 0 errors en home + politicas
- **Contraste:** 100% textos ≥ 4.5:1 (AA), large text ≥ 7:1 (AAA)
- **Tokens:** `grep -r "rgba\|opacity\|shadow\|z-index" apps/web/src --include="*.tsx" --include="*.css" | grep -v "var(--"` = 0 resultados
- **Bundle:** `next build` size ≤ baseline + 5KB (button components tree-shaken)
- **Performance:** LCP home < 2.5s, CLS < 0.1 (gradiente no causa layout shift)

---

**Próximo paso:** Aprobar plan → arrancar **T4** (tokens base) + **T13** (strip 21st.dev component) en paralelo.

