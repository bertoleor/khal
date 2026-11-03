# Design-First Flow — khal v7

## Philosophy

**Design-first** means: the DESIGN.md + PRODUCT.md are the source of truth. All UI implementation must trace back to these docs. No pixel guessing, no "make it look nice" — every decision is grounded in an authorized spec.

This flow replaces ad-hoc UI building with a reproducible pipeline: **spec → screen plan → baseline → implementation → verify**.

---

## 1. Artefactos de referencia (Source of Truth)

| Artefacto | Path | Qué contiene |
|-----------|------|--------------|
| **DESIGN.md** | `docs/DESIGN.md` | Token system, radius scale, kicker, wordmark, glass, 17 tamaños owner-approved, 9 anti-slop rules |
| **PRODUCT.md** | `PRODUCT.md` | 5 decisiones type/colour/layout/density/tone |
| **Tokens CSS** | `packages/ui/src/tokens.css` | Capa real de 6357 chars — origen de verdad para todos los componentes |
| **Anti-slop rules** | `DESIGN.md §9` | 9 reglas standing: no-gradient, no-emoji, no-phrases, etc. |

> **Never** deviate from these without an explicit `## Log` entry in the feature doc and owner approval.

---

## 2. Screen Plan (por feature)

Cada pantalla/new feature debe tener un `screen-plan.md` que cite los S# DESIGN.md y los tokens esperados.

### Estructura de screen-plan.md:

```markdown
# Screen: <ruta> — <nombre>

## Specs citados

- S3: `fontFamily: 'Bodoni MT', serif` — `tokens.css @font-face`
- S5: `radius scale: inputs 12px, cards 14-16px, pills 999px` — `tokens.css`
- S8: `kicker: fontSize: 8px, letterSpacing: 2.5px` — `tokens.css`
- S12: `wordmark: TAN Nightingale, self-hosted` — `tokens.css + public/fonts/`
- S17: `::selection: ink-invert per-mode` — `globals.css`

## Tokens esperados en la vista

- `--background: #000000` (dark) / `#f6f4f1` (light)
- `--accent: #ffffff` (dark) / `#0d0d0d` (light)
- `--kicker-fontSize: 8px`
- `--kicker-letterSpacing: 2.5px`
- `--radius-input: 12px`
- `--radius-card: 14px`

## Locators (para e2e)

- Hero heading: `getByRole('heading', { name: 'Nuestros servicios' })`
- CTA pill: `getByRole('button', { name: reAgendar })`
- Wordmark: `img[alt='TAN Nightingale']`

## Anti-slop checks

- ✅ No gradient backgrounds (rule #1)
- ✅ No emoji in copy (rule #2)
- ✅ No generic phrases (rule #3)
- ✅ Radius within v7 scale (rule #4)
- ✅ Kicker typography exact (rule #5)
- ✅ Wordmark self-hosted (rule #6)
- ✅ ::selection ink-invert (rule #7)
- ✅ No slate default (rule #8)
- ✅ Color palette from DESIGN.md (rule #9)
```

---

## 3. Baseline Screenshots (e2e)

### Flujo para crear/actualizar baselines:

1. **Correr e2e en modo headless** con la versión actual:
   ```bash
   npx playwright test --project=chromium
   ```

2. **Si los tests fallan por "pixel diff" (nuevas baselines)**:
   - Aceptar los nuevos screenshots:
     ```bash
     npx playwright test --project=chromium --update-screenshot
     ```
   - O revisar manualmente en `test-results/` y decidir si el cambio es intencional (design change) o ruidoso (reloj, partículas, etc.)

3. **Si el fallo es por lógica/timeout** (ej. clock no installado):
   - Fixear el test (agregar `page.clock.install()`)
   - Re-run y actualizar baseline

### Estatus actual de baselines (test-results/):

| Test | Estado | Comentario |
|------|--------|------------|
| `home-es.png` | ✅ Baseline actual | Hero + catálogo de servicios |
| `servicio-detail-es.png` | ✅ Baseline actual | Lifting de Pestañas $45.000 |
| `reservar-es.png` | ❌ Needs clock install | Clock se instala en test, rota baseline cada medianoche |
| `politicas-es.png` | ✅ Baseline actual | Políticas del estudio |

---

## 4. Flujo de implementación (step-by-step)

### Paso 1: Leer specs

```bash
# Leer DESIGN.md y citar los S# relevantes
cat docs/DESIGN.md | grep -E '^#|fontSize:|radius:|kicker:|wordmark:'
```

### Paso 2: Crear screen-plan.md

```markdown
# Screen: /es/servicios/lifting-de-pestañas

## S# citados

- S4: `color: palette dark/light` — DESIGN.md
- S8: `kicker 8px/2.5px` — DESIGN.md
- S11: `exceptions: 17 tamaños owner-approved` — DESIGN.md
```

### Paso 3: Implementar componente

Usar tokens de `packages/ui/src/tokens.css` nunca valores hardcodeados. Ejemplo:

```tsx
// Anti-patrón (NUNCA):
<div style={{ fontSize: '16px' }}> ... </div>

// Patrón v7 (SÍ):
import tokens from 'packages/ui/src/tokens.css';

<div className={tokens.kicker}> ... </div>
```

### Paso 4: Agregar test e2e

Crear o actualizar `visual.spec.ts` con el locator correcto y el nombre de screenshot.

### Paso 5: Correr y verificar

```bash
npx playwright test --project=chromium
# Si todo verde → commit
# Si falla por baseline → actualizar screenshot
```

---

## 5. Anti-slop guardrails (automatizados)

### Scanners que corren en cada PR:

| Scanner | Comando | Salida esperada |
|---------|---------|-----------------|
| `impeccable detect` | `npx -y -p impeccable detect` | 0 anti-patrones defaults (los 56 advisories deben estar documentados en DESIGN.md T12) |
| `validate-tokens` | `node scripts/design-qa/validate-tokens.cjs --dir apps/web/src` | 0 hallazgos hex esmeralda, 0 breakpoints no documentados |
| `designmd lint` | `npx -y -p @google/design.md designmd lint` | Exit 0, 0 errores (avisos documentados en T12 están OK) |

### Gate de aprobación:

Un PR no puede mergearse cuando:

1. `impeccable detect` encuentra anti-patrones **no documentados** en DESIGN.md T12
2. `validate-tokens` encuentra `#6ee7b7` (emerald) en código no documentado
3. `designmd lint` errores > 0 sin entry en `## Log` del feature doc

---

## 6. Decision log (cuando cambiar el design)

Cada cambio de diseño debe tener un `## Log` entry en `odd/tasks/v7-clienta-bw-glass.md`:

```markdown
L2: 2026-10-28 — Cambié el kicker de 11px a 8px per S8 DESIGN.md owner-approved.
     Validated with: `grep -n 'fontSize: 8px' packages/ui/src/tokens.css`
     Scanner: impeccable detect 0 anti-patterns post-fix.

L3: 2026-10-28 — Radius caps: moví de 12px a 14px en cards per S4 redesign.
     Scanner: validate-tokens exit 0, radius scale updated.
```

> **Never** commit a design change without a `## Log` entry. El padre (git) posee el historial.

---

## 7. Checklist para un nuevo screen

Antes de considerar un screen "done", este checklist debe estar completo:

- [ ] screen-plan.md creado y citando S# DESIGN.md
- [ ] Tokens usados de `packages/ui/src/tokens.css` (nunca hardcodeados)
- [ ] Anti-slop rules checking passing (`impeccable detect`, `validate-tokens`)
- [ ] Baseline screenshot actualizada en `test-results/`
- [ ] Test e2e pasando (`npx playwright test --project=chromium`)
- [ ] `## Log` entry en feature doc si hay cambio de diseño
- [ ] PRODUCT.md decision alineada (type/colour/layout/density/tone)