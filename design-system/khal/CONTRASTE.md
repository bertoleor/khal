# KHAL — Contraste design-system real vs catálogo UUPM (`dark-mode-oled` primaria · `glassmorphism` secundaria)

> **Fecha:** 2026-10-17 · **Autor:** 10-uiux · **Motivo:** ORN-204 — contrastar los tokens REALES de khal contra las filas del catálogo UUPM más cercanas a su identidad ("iOS-strict dark") y producir veredicto por ítem (coincidencia / mejora / divergencia). Solo documentación: sin cambios de código ni estilos, sin commits.
> **Búsqueda:** keywords: `khal, dark-mode-oled, glassmorphism, uupm, contraste, tokens, backdrop-blur, negro puro, emerald, aura partículas, design-system` · clasificación: `design-system` · estado: draft · actualizado: 2026-10-17
> **Style ID primario:** `dark-mode-oled` (styles.csv, categoría "Dark Mode (OLED)", status active) · **Style ID secundario (runner-up):** `glassmorphism` (styles.csv, status active) · **Parte de:** [[ticket-contraste-uupm-projects]] · **Relacionados:** [[UUPM-OPERATIONS]], [[ORN-204]]

## Resumen

khal implementa una identidad "iOS-strict dark" cuyo NÚCLEO encaja ítem por ítem con la fila `dark-mode-oled`: canvas #000000 exacto, `color-scheme: dark` literal, dark-only sin tema light, cero glow (más estricto que el "minimal glow" del catálogo) y framework Tailwind. Sobre esa base usa la mecánica de `glassmorphism` como **capa material** (backdrop-blur + blanco translúcido + bordes 1px blancos) a opacidades deliberadamente inferiores (4-7% vs 10-30%) para que el aura blanca de partículas respire a través — mismo hallazgo estructural que paeonia. Las 19 divergencias son decisiones de marca con fuente en `docs/DESIGN.md` (emerald como acento único vs multi-neón, aura monocromática vs fondo vibrante, blur 8px iOS-sutil, tipografía system sin webfont, radios/spacing propios). El catálogo aporta 5 mejoras; la más dura destapa un **error real de verificación**: zinc-500 mide **4.34:1** sobre negro (script WCAG), no los "~5.7:1 AA-safe" que afirman `docs/DESIGN.md:122` y `apps/web/test/a11y-p2-contract.test.ts:66` — el token pineado por el contrato es sub-AA.

**Conteos:** 21 coincidencias (C) · 5 mejoras (M) · 19 divergencias (D) = 45 ítems.

## Índice

1. [Metodología y fuentes](#metodología-y-fuentes)
2. [Elección de estilo: evidencia + runner-up](#elección-de-estilo)
3. [Leyenda de veredictos](#leyenda-de-veredictos)
4. [Tabla de contraste](#tabla-de-contraste)
5. [Mejoras adoptadas del catálogo](#mejoras-adoptadas-del-catálogo)
6. [Divergencias intencionales](#divergencias-intencionales)
7. [Notas de honestidad del sistema (drift)](#notas-de-honestidad-del-sistema)
8. [Verificación](#verificación)

## Metodología y fuentes

- **Tokens reales extraídos de khal** (NO del catálogo): `apps/web/src/app/globals.css` (23 líneas; tokens `:root` 3-6, `color-scheme` 9, font stack 15, `::selection` 21), `apps/web/src/components/BackgroundMesh.tsx` (config 12-38, reduced-motion 175-176, RAF 185-194, resize 205-215, z-index 230), componentes (`shared/header.tsx`, `shared/site-footer.tsx`, `shared/field.tsx`, `shared/empty-state.tsx`, `catalog/catalog-grid.tsx`, `booking/slot-picker.tsx`, `booking/booking-form.tsx`, `payment/payment-step.tsx`), páginas (`[locale]/page.tsx`, `servicios/[id]/page.tsx`, `servicios/[id]/reservar/page.tsx`, `politicas/page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `manifest.ts`, `opengraph-image.tsx`), tests (`apps/web/test/a11y-p2-contract.test.ts`, `a11y-p3-contract.test.ts`), docs (`docs/DESIGN.md` — canon actual, yaml alpha de 160 líneas; `docs/04-branding-identidad.md` — con drift interno, ver Notas).
- **Catálogo:** `python scripts/search.py "glassmorphism" --domain style --full` → 1 resultado; `"dark mode"` → `dark-mode-oled`; `"oled"` → `dark-mode-oled` (alias "Dark Mode"). Ejecutados 2026-10-17 desde `E:/Hermes/skills/design/uupm-ui-ux-pro-max`. Se contrastaron las columnas con contenido de ambas filas; las triviales (Aliases, Parent Style ID, Preferred Mode, Complexity) se omiten salvo Keywords/Best For.
- **Tailwind v4 verificado:** `tailwindcss ^4.1.0` (`apps/web/package.json:27`); `--blur-sm: 8px` (`apps/web/node_modules/tailwindcss/theme.css:477`). El compilador v4 emite `-webkit-backdrop-filter` junto a `backdrop-filter` para backdrop-blur (verificado en `apps/web/node_modules/tailwindcss/dist/lib.js`, handler `backdrop-blur`, archivo minificado).
- **Contrastes WCAG computados** con script de luminancia relativa en esta sesión (fórmula WCAG 2.x) — tabla completa en [Verificación](#verificación). Los ratios de este doc son de ese script, no de estimaciones.
- **Contexto de estado:** el dark theme de la web app es del 2026-10-15 (`a11y-p2-contract.test.ts:65` "Dark theme since 2026-10-15") y sus refinamientos están SIN commitear en el árbol de trabajo (ver Notas).

## Elección de estilo

**PRIMARIA: `dark-mode-oled`.** Evidencia de encaje estructural:

- Canvas **Deep Black #000000 EXACTO**: `--background: #000000` (`globals.css:4`), `BG_COLOR = '#000000'` (`BackgroundMesh.tsx:38`), `background_color`/`theme_color` del manifest (`manifest.ts:10-11`), `body bg-black` (`layout.tsx:58`).
- CSS keyword **`color-scheme: dark`** textual (`globals.css:9`).
- **Dark-only**, sin toggle ni overrides `.light` — coincide con "Light Mode: not-recommended".
- Texto high-contrast: #FFFFFF 21:1 + jerarquía zinc (zinc-400 8.19:1, computado).
- Checklist OLED: "Deep black" ✓, "No white background" ✓ (core), "OLED power optimization" ✓, "Minimal glow" ✓ (cero). Framework `tailwind` ✓.

**SECUNDARIA (runner-up, aporta la capa material): `glassmorphism`.** La identidad declara superficies translúcidas + backdrop-blur + bordes 1px blancos (`catalog-grid.tsx:24`, `header.tsx:5`) — mecánica exacta del glass. PERO el glass exige **fondo vibrante** y opacidades **10-30%**: khal rechaza ambas por diseño (aura monocromática 4-7%). Falla la premisa central del glass ("vibrant background verified") en la decisión de marca más fuerte de khal, así que no puede ser fila primaria — pero su checklist de material (blur, borde 1px, translucidez, contraste 4.5) sí aplica y se contrasta.

**Regla de desempate:** en conflictos manda la PRIMARIA (dark-only, monocromo, cero glow). Cada fila indica contra cuál de las dos se mide.

## Leyenda de veredictos

- **C (coincidencia):** valor del project dentro del valor/rango del catálogo → confirmar.
- **M (mejora):** el catálogo trae algo que khal no tiene (checklist, perf notes, a11y, dark/light, anti-patterns) → adoptar.
- **D (divergencia intencional):** valor del project FUERA del catálogo → documentar por qué citando los docs de branding; la decisión del project manda (regla v2 de [[UUPM-OPERATIONS]]).

## Tabla de contraste

| # | Columna catálogo | Valor catálogo (fila) | Valor real khal | Cita path:line | V |
|---|---|---|---|---|---|
| 1 | Primary Colors | Deep Black #000000 (oled) | `--background: #000000` + canvas BG_COLOR + manifest | apps/web/src/app/globals.css:4; apps/web/src/components/BackgroundMesh.tsx:38; apps/web/src/app/manifest.ts:10-11 | C |
| 2 | Primary Colors | Dark Grey #121212 (oled) | Sin gris sólido: blanco 4%→7% sobre negro (compone #0a0a0a/#121212 — el hover ES #121212, por alpha) | apps/web/src/components/catalog/catalog-grid.tsx:24; docs/DESIGN.md:13-14,123 | D |
| 3 | Primary Colors | Midnight Blue #0A0E27 (oled) | Ausente: aura monochrome blanca/gris + emerald único | apps/web/src/components/BackgroundMesh.tsx:12-29; docs/DESIGN.md:114 | D |
| 4 | Primary Colors | color: #FFFFFF or #E0E0E0 (oled) | `--foreground: #ffffff`; headings text-white; body zinc-400 (8.19:1 computado) | apps/web/src/app/globals.css:5; apps/web/src/app/[locale]/page.tsx:22,25 | C |
| 5 | Primary Colors | Blanco translúcido rgba(255,255,255,0.1-0.3) (glass) | white/[0.03]-[0.07]: cards [0.04], hover [0.07], idle slots/inputs [0.06], hero [0.03] | apps/web/src/components/catalog/catalog-grid.tsx:24; apps/web/src/components/booking/slot-picker.tsx:49; apps/web/src/app/[locale]/page.tsx:20 | D |
| 6 | Effects & Animation | Borde sutil 1px solid rgba white 0.2 (glass) | 1px white/10 (cards/header), white/15 (interactivos), white/20 (outline buttons — llega al 0.2) | apps/web/src/components/shared/header.tsx:5; apps/web/src/components/booking/slot-picker.tsx:49; apps/web/src/components/payment/payment-step.tsx:47 | D |
| 7 | Primary Colors | Vibrant neon accents: green, blue, gold, purple (oled) | Emerald ÚNICO #34D399 (hover #6EE7B7) — verde dentro de la familia neón, restringido a uno por regla de marca | docs/DESIGN.md:8-9,152; apps/web/src/components/booking/booking-form.tsx:90 | D |
| 8 | Effects & Animation | Minimal glow, text-shadow 0 0 10px (oled) | CERO glow/sombras — más estricto que "minimal" | docs/DESIGN.md:136,155 | C |
| 9 | Effects & Animation | Light reflection (glass) | Cero reflejos (regla zero-glow) | docs/DESIGN.md:155 | D |
| 10 | Effects & Animation | Dark-to-light transitions (oled) | transition-colors/all en cards, botones, slots | apps/web/src/components/catalog/catalog-grid.tsx:24; apps/web/src/components/booking/booking-form.tsx:90 | C |
| 11 | Effects & Animation | Vibrant background (glass) | Aura MONOCROMÁTICA (pares blanco/gris, BASE_OPACITY 0.5) sobre negro puro | apps/web/src/components/BackgroundMesh.tsx:12-29,36 | D |
| 12 | Effects & Animation | Z-depth (glass) | -z-10 canvas / z-10 header sticky / z-20 skip-link / bottom bar fixed | apps/web/src/components/BackgroundMesh.tsx:230; apps/web/src/components/shared/header.tsx:5,8; apps/web/src/app/[locale]/servicios/[id]/page.tsx:67 | C |
| 13 | Effects & Animation | (no cubierto por el catálogo) | Aura de partículas viva: crossfade ~7s (420 frames), fade 90 frames, breath 0.12 — identidad propia | apps/web/src/components/BackgroundMesh.tsx:31-37; docs/DESIGN.md:114 | D |
| 14 | Effects & Animation | (no cubierto) | active:scale-[0.98] compresión táctil iOS-native | apps/web/src/components/catalog/catalog-grid.tsx:24; docs/DESIGN.md:140 | D |
| 15 | CSS/Technical Keywords | color-scheme: dark (oled) | Literal en `html { color-scheme: dark }` | apps/web/src/app/globals.css:9 | C |
| 16 | CSS/Technical Keywords | backdrop-filter: blur(15px), rango 10-20px (glass) | backdrop-blur-sm / backdrop-blur = 8px (Tailwind v4 --blur-sm 8px) en cards, header, bottom bar | apps/web/src/components/catalog/catalog-grid.tsx:24; apps/web/src/components/shared/header.tsx:5; apps/web/node_modules/tailwindcss/theme.css:477 | D |
| 17 | CSS/Technical Keywords | -webkit-backdrop-filter: blur(15px) (glass) | Tailwind v4.1 emite el prefijo automáticamente con backdrop-blur (verificado en el compilador, handler minificado) | apps/web/package.json:27; apps/web/node_modules/tailwindcss/dist/lib.js (handler backdrop-blur) | C |
| 18 | CSS/Technical Keywords | (no cubierto) | Tipografía system stack sin webfont: -apple-system… | apps/web/src/app/globals.css:15; docs/DESIGN.md:22,128 | D |
| 19 | CSS/Technical Keywords | (no cubierto) | Radios locked 12/16/pill + spacing 8/16/24 | docs/DESIGN.md:43-50,140; apps/web/src/components/booking/slot-picker.tsx:44,73 | D |
| 20 | CSS/Technical Keywords | (no cubierto) | Botón pill emerald-400 con texto NEGRO (10.92:1 AAA, computado) | docs/DESIGN.md:52-61,120; apps/web/src/components/booking/booking-form.tsx:90 | D |
| 21 | Implementation Checklist | Deep black #000000 or #121212 (oled) | #000000 exacto (refs. filas 1-2) | apps/web/src/app/globals.css:4 | C |
| 22 | Implementation Checklist | Vibrant neon accents used (oled) | Emerald único (ref. fila 7) | docs/DESIGN.md:152 | D |
| 23 | Implementation Checklist | Text contrast 7:1+ (oled) | Headings 21:1 y zinc-400 8.19:1 SÍ; zinc-500 4.34:1 real NO — docs y test afirman "~5.7:1" (desmentido por cálculo WCAG) | apps/web/src/components/booking/booking-form.tsx:97; docs/DESIGN.md:122; apps/web/test/a11y-p2-contract.test.ts:66 | M |
| 24 | Implementation Checklist | Minimal glow effects (oled) | Cero glow (ref. fila 8) | docs/DESIGN.md:155 | C |
| 25 | Implementation Checklist | OLED power optimization (oled) | Canvas repaint negro full-screen + theme_color #000000; el aura agrega coste (fila 38) | apps/web/src/components/BackgroundMesh.tsx:187-188; apps/web/src/app/manifest.ts:11 | C |
| 26 | Implementation Checklist | No white (#FFFFFF) background (oled) | Core web ✓ cero bg-white sólido (islas drift error/not-found → Notas) | grep apps/web/src 2026-10-17; apps/web/src/app/error.tsx:20 (deuda) | C |
| 27 | Implementation Checklist | Backdrop-filter blur 10-20px (glass) | 8px (ref. fila 16) | apps/web/src/components/catalog/catalog-grid.tsx:24 | D |
| 28 | Implementation Checklist | Translucent white 15-30% (glass) | 4-7% (ref. fila 5) | apps/web/src/components/catalog/catalog-grid.tsx:24 | D |
| 29 | Implementation Checklist | Subtle border 1px light (glass) | 1px white/10-20 en todas las superficies (ref. fila 6) | apps/web/src/components/catalog/catalog-grid.tsx:24; apps/web/src/components/shared/header.tsx:5 | C |
| 30 | Implementation Checklist | Vibrant background verified (glass) | Monochrome (ref. fila 11) | apps/web/src/components/BackgroundMesh.tsx:12-29 | D |
| 31 | Implementation Checklist | Text contrast 4.5:1 checked (glass) | Verificación formal EXISTE (contract tests + auditorías) — única de la flota; el token pineado zinc-500 resulta 4.34:1 (ref. fila 23) | apps/web/test/a11y-p2-contract.test.ts:59-83,100-123 | C |
| 32 | Design System Variables | oled: --bg-black/--text-primary/--accent-neon; glass: --blur-amount/--glass-opacity/--border-color | Solo --background/--foreground cablegados; docs/DESIGN.md:95-110 lista tokens "derived" SIN cablear a CSS | apps/web/src/app/globals.css:3-6; docs/04-branding-identidad.md:55-56 | M |
| 33 | Accessibility | requires: contrast-text-4.5 (ambas) | Core ✓ computado (21 / 8.19 / 10.92 / 13.78 / 12.58 / 7.59) PERO 7 combos sub-AA en deuda/islas: 3.77 (WhatsApp), 4.10 (MP sky), 4.35 (red-600), 1.91 (slate-700), 2.77 (slate-600), 4.10 (zinc-500 sobre card), 4.34 (zinc-500 price line) | apps/web/src/components/payment/payment-step.tsx:37,164,171,192,197,209; apps/web/src/components/booking/booking-form.tsx:97 | M |
| 34 | Accessibility | requires: keyboard (ambas) | Botones nativos, aria-pressed, skip-link, main tabIndex | apps/web/src/components/booking/slot-picker.tsx:42,71; apps/web/src/components/shared/header.tsx:6-11; apps/web/src/app/[locale]/page.tsx:16 | C |
| 35 | Accessibility | requires: visible-focus (ambas) | focus-visible:outline-2 outline-offset-2 outline-emerald-400, 17 usos en web, contract-tested | apps/web/src/components/booking/booking-form.tsx:90; apps/web/test/a11y-p2-contract.test.ts:114-123 | C |
| 36 | Accessibility | requires: reduced-motion (ambas) | PARCIAL: speed=0 pero breathing y crossfade siguen animando; hovers/scale sin gating | apps/web/src/components/BackgroundMesh.tsx:175-176 vs :31-32,34,128 | M |
| 37 | Accessibility | risk:conditional (glass) | Mitigado: aria-pressed, role=status/note/alert, live region sr-only separada del botón mutante, canvas aria-hidden | apps/web/src/components/payment/payment-step.tsx:40,51,124,155,197; apps/web/src/components/BackgroundMesh.tsx:231 | C |
| 38 | Performance | cost:low \| drivers:none (ambas) | Drivers que el catálogo no contempla: RAF full-screen continuo sin pausa por visibilidad + backdrop-blur apilado sobre canvas animado; debounce resize 200ms ya existe | apps/web/src/components/BackgroundMesh.tsx:185-194,205-215; apps/web/src/components/catalog/catalog-grid.tsx:24 | M |
| 39 | Light Mode ✓ | not-recommended (oled) | Dark-only total, sin toggle ni overrides .dark | apps/web/src/app/globals.css:9; docs/DESIGN.md:154 | C |
| 40 | Dark Mode ✓ | supported (ambas) | Nativo: color-scheme dark + body bg-black + theme #000000 | apps/web/src/app/globals.css:8-14; apps/web/src/app/[locale]/layout.tsx:58 | C |
| 41 | Light Mode ✓ | supported (glass) | No aplica: dark-only — la PRIMARIA manda | docs/DESIGN.md:114 | D |
| 42 | Framework Compatibility | tailwind \| mui \| chakra (ambas) | Tailwind v4.1 vía `@import 'tailwindcss'` (mui/chakra no usados) | apps/web/src/app/globals.css:1; apps/web/package.json:27 | C |
| 43 | Keywords | Frosted glass, transparent, blurred, layered, vibrant bg, light source, depth, multi-layer (glass) | 5/7 presentes (frosted/transparent/blurred/layered/depth); vibrant bg y light source ausentes POR DISEÑO (filas 9,11) | apps/web/src/components/catalog/catalog-grid.tsx:24; docs/DESIGN.md:114,155 | D |
| 44 | Keywords | Dark theme, deep black, high contrast, OLED, power efficient, midnight blue… (oled) | 6/8 presentes; midnight blue ausente (fila 3) | apps/web/src/app/globals.css:4,9; docs/DESIGN.md:114 | C |
| 45 | Best For | navigation, modal overlays, lifestyle apps (glass) | Glass usado exactamente ahí: header sticky blur, bottom bar fija, cards translúcidas (booking de pestañas = lifestyle) | apps/web/src/components/shared/header.tsx:5; apps/web/src/app/[locale]/servicios/[id]/page.tsx:67; apps/web/src/components/catalog/catalog-grid.tsx:24 | C |

## Mejoras adoptadas del catálogo

1. **Target de contraste 7:1+ del checklist OLED** (fila 23). El cálculo WCAG real dice zinc-500 = **4.34:1** sobre negro, no los "~5.7:1 AA-safe" que afirman `docs/DESIGN.md:122` y el comentario del contrato `apps/web/test/a11y-p2-contract.test.ts:66`. **Adopción:** subir el price line (`booking-form.tsx:97`) y los labels `text-zinc-500` (`payment-step.tsx:37`, `catalog-grid.tsx:56`) a zinc-400 (8.19:1) o superior, y corregir el comentario del test. El catálogo da el target (7:1+) que hace visible el error.
2. **Exigencia formal contrast-4.5 sobre TODOS los combos renderizados** (fila 33). khal es la única de la flota con contract tests de contraste, pero validan TOKENS, no combinaciones con composición alpha. Los combos sub-AA computados viven en deuda: CTA WhatsApp emerald-600/white **3.77** (`payment-step.tsx:209`), botón MP sky-600/white **4.10** (`:192`), error red-600 **4.35** (`:197`), labels slate-700 **1.91** (`:164,176`), instrucciones slate-600 **2.77** (`:171`), zinc-500 sobre card white/4% **4.10** (`:37`). **Adopción:** gate de contraste computado (con composición alpha) en CI.
3. **Reduced-motion COMPLETO** (fila 36). Hoy el canvas solo baja la velocidad a 0 (`BackgroundMesh.tsx:175-176`) pero el breathing (`:34`, `:128`) y el crossfade (`:31-32`) siguen animando; hover/scale no están gateados. **Adopción:** frame estático único bajo `prefers-reduced-motion: reduce` + gating de microinteracciones (el catálogo lo lista como `requires` en ambas filas).
4. **Notas de performance del canvas** (fila 38). El catálogo dice `cost:low|drivers:none`; khal agrega un RAF full-screen que corre continuo sin pausa por visibilidad (`BackgroundMesh.tsx:185-194`) + backdrop-blur apilado sobre ese canvas animado. **Adopción:** pausar el RAF en `document.hidden`, cap de DPR, frame estático en reduced-motion (mitiga también #3). El debounce de resize a 200ms ya existe (`:205-215`).
5. **Capa de variables semánticas** (fila 32). Solo `--background`/`--foreground` están cableados (`globals.css:3-6`); `docs/DESIGN.md:95-110` lista tokens "derived" (--tertiary, --surface, --border…) que NO existen como CSS vars — lo admite `docs/04-branding-identidad.md:55-56` ("sin tokens propios"). **Adopción:** cablear `--accent`, `--surface`, `--border`, `--blur-amount` (nombres sugeridos por ambas filas del catálogo) — puerta al Flujo 3 UUPM (tokens.json → tokens.css) y reemplazo del hex inline de `opengraph-image.tsx`.

## Divergencias intencionales

Cada una con la fuente que la justifica — la decisión del project manda (regla v2 de [[UUPM-OPERATIONS]]):

1. **Superficies por translucidez, no gris sólido** (fila 2): blanco 4%→7% compone #0a0a0a→#121212 — el hover cae EXACTO en el Dark Grey #121212 del catálogo, pero obtenido por alpha. "Never solid gray fills — the aura must breathe through". Fuente: `docs/DESIGN.md:123`, `:154`.
2. **Sin Midnight Blue** (fila 3): paleta monochrome + emerald único. "No gradients, no glows, no second accent". Fuente: `docs/DESIGN.md:114`; `BackgroundMesh.tsx:12-29`.
3. **Translucidez 4-7% vs glass 10-30%** (filas 5,28): sobre negro puro, 15-30% mataría el aura — mismo patrón que paeonia. Fuente: `docs/DESIGN.md:123` y tokens `:13-14`.
4. **Bordes white/10-15 vs 0.2** (fila 6): sobre negro, 0.2 lee pesado; los outline buttons sí llegan a 0.2. "Bordes sutiles". Fuente: `docs/DESIGN.md:15-16`; `docs/04-branding-identidad.md:11-12`.
5. **Emerald único vs multi-neón** (filas 7,22): "Do keep exactly one accent (emerald). A second accent is a regression". Fuente: `docs/DESIGN.md:152`, `:120`.
6. **Cero light-reflection** (fila 9): la regla zero-glow es más estricta que el glass. Fuente: `docs/DESIGN.md:155`.
7. **Aura monocromática vs fondo vibrante** (filas 11,30,43): "efecto EROS adaptado a blanco y negro" (`BackgroundMesh.tsx:7`); "the aura is the only atmosphere". Fuente: `docs/DESIGN.md:114`, `:155`.
8. **Aura de partículas como identidad** (fila 13): no existe en ninguna fila del catálogo — extensión propia (canvas ~7s crossfade). Fuente: `docs/DESIGN.md:114`, `:153` (una sola instancia global).
9. **active:scale-[0.98]** (fila 14): feedback táctil iOS-native, fuera del catálogo. Fuente: `docs/DESIGN.md:140`.
10. **Blur 8px vs 10-20px** (filas 16,27): iOS-sutil por diseño ("bordes sutiles, cero animación pesada"). Fuente: `docs/04-branding-identidad.md:11-12`; escala v4 verificada `theme.css:477`.
11. **Tipografía system stack sin webfont** (fila 18): iOS-strict, jerarquía por peso/color. Fuente: `globals.css:15`; `docs/DESIGN.md:128`; `docs/04-branding-identidad.md:15-16`.
12. **Radios 12/16/pill + spacing 8/16/24 locked** (fila 19): sistema propio cerrado. Fuente: `docs/DESIGN.md:43-50`, `:140`.
13. **Botón pill emerald con texto negro** (fila 20): 10.92:1 AAA — patrón de CTA propio, superior en contraste al neón-sobre-negro. Fuente: `docs/DESIGN.md:52-61`, `:120`.
14. **Dark-only vs glass light-supported** (fila 41): la fila primaria (OLED, "light: not-recommended") manda. Fuente: `docs/DESIGN.md:114`, `:154`.

## Notas de honestidad del sistema

Drift/deuda detectada (NO intencional, sin veredicto D porque ninguna está respaldada por `docs/DESIGN.md`; no se modificó código — fuera de alcance):

- **Islas light `error.tsx`/`not-found.tsx`**: `bg-white` + slate-900/500/200 (`apps/web/src/app/error.tsx:20-34`; `apps/web/src/app/not-found.tsx:7-15`). Restos pre-dark (el tema dark es del 2026-10-15 según `a11y-p2-contract.test.ts:65`). Internamente consistentes (slate-900 sobre blanco 17.85:1 computado) pero rompen la identidad dark-only.
- **Isla MercadoPago light + SEGUNDO acento** (`payment-step.tsx:162-201`): slate-700/600/200/300, botón `sky-600` (viola la regla one-accent de `docs/DESIGN.md:152`), error `red-600`. Contrastes computados: 1.91 / 2.77 / 4.10 / 4.35 — todos sub-AA. Deuda de la integración KHAL-A1 (última intervención en el archivo: commit 778aced).
- **CTA WhatsApp `emerald-600`/texto blanco** (`payment-step.tsx:209`) vs spec `button-primary` emerald-400/negro (`docs/DESIGN.md:52-61`): inconsistencia con la spec propia + 3.77:1 sub-AA (hover emerald-700 pasa: 5.48).
- **Hex inline en `opengraph-image.tsx`** (:18 #000000, :27 #ffffff, :37 #6ee7b7): justificado técnicamente (edge runtime ImageResponse sin acceso a CSS vars), pero es el hex hardcoded que un gate de diseño flaguearía. Nota: el workflow `design-qa.yml` fue **removido** del repo (commit cd73070, "depends on Hermes-specific skills").
- **Hero `sm:bg-white/[0.03]`** (`page.tsx:20`): 3%, apenas bajo el piso 4% del sistema (`docs/DESIGN.md:13`). Nano-drift.
- **Días cerrados `text-zinc-600`** (2.72:1, `slot-picker.tsx:46`): exento para WCAG (control deshabilitado) — registrado, no deuda de identidad.
- **`apps/admin` es una superficie LIGHT independiente** (103 usos de slate, ej. `apps/admin/src/components/admin/service-manager.tsx:669`): `docs/DESIGN.md` no la cubre; la identidad dark es de la app cliente. Fuera del alcance de este contraste.
- **`docs/04-branding-identidad.md` DESACTUALIZADO**: cita "bordes slate-200 / header bg-white/80 / tarjetas bg-white" (líneas 24,28) — describe el estado pre-dark. El canon actual es `docs/DESIGN.md`. Drift de doc, no de código.
- **Estado del árbol preexistente**: ANTES de esta tarea el árbol estaba sucio (refinamientos del dark theme + KHAL-A1 sin commitear: `DESIGN.md` raíz borrado→`docs/DESIGN.md` untracked, `page.tsx`/`header.tsx`/`catalog-grid.tsx`/`site-footer.tsx` modificados, `packages/utils/src/mercadopagoMock.ts` y `tests/` untracked). El árbol es compartido con workers paralelos — durante esta sesión aparecieron además `package.json` modificado y untracked de visual tests (`update-snapshots.yml`, `visual-tests.yml`, `playwright.visual.config.ts`). El único delta de ORN-204 es este archivo (`design-system/khal/CONTRASTE.md`).

## Verificación

- **Consultas del catálogo ejecutadas y capturadas** (2026-10-17, desde `E:/Hermes/skills/design/uupm-ui-ux-pro-max`): `search.py "glassmorphism" --domain style --full` → 1 resultado (Style ID `glassmorphism`); `search.py "dark mode" --domain style --full` → `dark-mode-oled`; `search.py "oled" --domain style --full` → `dark-mode-oled`.
- **Contrastes WCAG computados** (script de luminancia relativa, esta sesión):

| Par (uso) | Ratio |
|---|---|
| #FFFFFF sobre #000000 (headings) | 21.00:1 |
| zinc-400 #A1A1AA sobre #000000 (body) | 8.19:1 |
| **zinc-500 #71717A sobre #000000 (price line — DESIGN.md:122/test afirman ~5.7:1)** | **4.34:1 — sub-AA** |
| zinc-500 sobre card white/4% (labels `payment-step.tsx:37`) | 4.10:1 |
| negro sobre emerald-400 #34D399 (CTA canónico) | 10.92:1 |
| blanco sobre emerald-600 #059669 (CTA WhatsApp `payment-step.tsx:209`) | 3.77:1 — sub-AA |
| blanco sobre emerald-700 (hover WhatsApp) | 5.48:1 |
| emerald-300 #6EE7B7 sobre #000000 (precios) | 13.78:1 |
| amber-300 #FBBF24 sobre #000000 (pendiente) | 12.58:1 |
| red-400 #F87171 sobre #000000 (error `booking-form.tsx:86`) | 7.59:1 |
| red-600 #DC2626 sobre #000000 (error MP `payment-step.tsx:197`) | 4.35:1 — sub-AA |
| blanco sobre sky-600 #0284C7 (botón MP `payment-step.tsx:192`) | 4.10:1 — sub-AA |
| slate-700 sobre card white/4% (labels MP `payment-step.tsx:164,176`) | 1.91:1 — falla grave |
| slate-600 sobre #000000 (instrucciones MP `payment-step.tsx:171`) | 2.77:1 |
| blanco sobre superficie compuesta white/4% (cards) | 19.80:1 (≈ "18:1" de DESIGN.md:123 ✓) |
| zinc-400 sobre superficie compuesta white/4% | 7.72:1 |
| slate-900 sobre #FFFFFF (islas error/not-found) | 17.85:1 |
| zinc-600 sobre #000000 (días cerrados, disabled) | 2.72:1 (exento WCAG) |

- Composición alpha verificada: white 4% sobre #000 = **#0a0a0a**; white 7% = **#121212** (exacto el Dark Grey del catálogo, fila 2).
- Todos los `path:line` citados fueron leídos con read_file/grep reales en esta sesión (globals.css, BackgroundMesh.tsx, header, catalog-grid, slot-picker, booking-form, payment-step, field, empty-state, site-footer, page.tsx, servicios/[id] + reservar, politicas, layout, error, not-found, manifest, opengraph-image, a11y-p2/p3 tests, docs/DESIGN.md, 04-branding).
- `git status` del project tras esta tarea: solo se agrega `design-system/khal/CONTRASTE.md` (el resto del estado sucio es preexistente del dark theme/KHAL-A1, ver Notas).

---

**Style ID:** `dark-mode-oled` (primaria) · `glassmorphism` (secundaria) · **Project:** khal · **Ticket:** ORN-204 (Linear) / t_0f04bcfe (kanban) · Ver también los contrastes hermanos: [[CONTRASTE-TRINO]] (bauhaus), eros, sacre-shop, nail-app, paeonia, Vicky.
