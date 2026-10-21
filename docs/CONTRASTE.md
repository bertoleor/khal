# CONTRASTE — khal: tokens reales vs catálogo UUPM

> **Búsqueda:** keywords: `khal, contraste, uupm, dark-mode-oled, glassmorphism, liquid-glass, tokens, emerald, oled, wcag` · clasificación: `design-system` · estado: `canónico` · actualizado: 2026-10-20
> Fuente de tokens: `tailwind.theme.json` + `apps/web/src/app/globals.css` + `docs/DESIGN.md` (verificados contra código 2026-10-20). Motor UUPM consultado 2026-10-20. Detalle ítem por ítem (45 ítems, 21 C / 5 M / 19 D): `design-system/khal/CONTRASTE.md`. Ticket ORN-204 (kanban t_b3fbf03d).

## Estilos del catálogo

- **`dark-mode-oled`** (primario, styles.csv #7): canvas Deep Black #000000, texto blanco, un acento vibrante, contraste 7:1+, sin fondos blancos.
- **`glassmorphism`** (secundario, #3): la capa material — blur, blanco translúcido, borde 1px.
- **`liquid-glass`** (referencia, #14): contrato Apple de translucidez en navegación/controles — khal es "iOS-strict".

## Coincidencias

- Canvas #000000 EXACTO (globals.css + `BG_COLOR` del mesh + manifest) — la cláusula central de dark-mode-oled.
- `color-scheme: dark` literal + dark-only sin toggle ("Light Mode: not-recommended" del catálogo ✓).
- Un solo acento vibrante: emerald #34D399 — dentro de la familia "vibrant neon accents", recortado a UNO por regla de marca.
- Contraste alto real (WCAG computado esta sesión): headings 21:1 · zinc-400 8.19:1 · texto negro sobre CTA emerald 10.92:1 (AAA).
- Cero glow — más estricto que el "minimal glow" del checklist OLED ✓.
- Glass: bordes 1px sutiles ✓ · z-depth (canvas a -z-10) ✓ · focus-visible emerald contract-tested ✓ (requisito de ambas filas).
- Framework Tailwind ✓ (compatibilidad declarada por ambas filas).

## Mejoras sugeridas (catálogo + gusto del owner)

1. **Contraste 7:1+ (checklist OLED):** zinc-500 #71717A sobre negro da **4.35:1** real (script WCAG de esta sesión), no los "~5.7:1 AA-safe" que afirman `docs/DESIGN.md:122` y el comentario del contrato. Subir a zinc-400 (8.19:1) o corregir la afirmación. Ídem combos sub-AA en el flujo de pago, deuda KHAL-A1 vigente hoy: CTA WhatsApp emerald-600 3.77:1 · botón MP sky-600 4.10:1 (medidos en `design-system/khal/CONTRASTE.md`).
2. **Reduced-motion completo** (requisito de ambas filas): hoy solo baja `speed` a 0; breathing y crossfade siguen animando. Frame estático único bajo `prefers-reduced-motion`.
3. **Perf:** el catálogo tasa `cost:low|drivers:none`, pero khal agrega un RAF full-screen sin pausa en `document.hidden` — pausar por visibilidad + cap de DPR.
4. **Variables semánticas:** solo `--background`/`--foreground` están cableados; `--accent`/`--surface`/`--border` viven solo en el doc. Cablearlas abre el pipeline de tokens de UUPM (Flujo 3).
5. **Estilo (gusto del owner — clase Awwwards):** la system stack queda justificada para body/UI, pero el wordmark "Khal" es el momento tipográfico protagonista — una display con personalidad ahí no rompe el iOS-strict y cumple la regla "tipografía distintiva como protagonista" del gusto confirmado por el owner.

## Divergencias (con justificación)

- Translucidez 4-7% vs glass 10-30%: sobre negro puro, más blanco mata el aura — "the aura must breathe through" (`docs/DESIGN.md:123`).
- Aura monocromática vs "vibrant background": "the aura is the only atmosphere" (`docs/DESIGN.md:155`).
- Blur 8px vs 10-20px del glass: iOS-sutil deliberado.
- System stack sin webfont vs fuentes distintivas del catálogo: jerarquía por peso/color, no por familia (`docs/DESIGN.md:128`).
- Radios 12/16/pill + spacing 8/16/24 locked: sistema propio cerrado, fuera del catálogo.
- Botón pill emerald con texto NEGRO + `active:scale-[0.98]`: firma iOS propia — el catálogo sugiere neón sobre negro; khal gana contraste (10.92:1 AAA).

## Veredicto

khal ES dark-mode-oled con una capa glass propia: núcleo coincidente y divergencias todas documentadas en `docs/DESIGN.md`. No necesita rediseño — las mejoras son de contraste real (hoy sub-AA), reduced-motion, perf y tokens cableados.
