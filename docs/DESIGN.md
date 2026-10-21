---
version: alpha
name: Khal
description: iOS-strict dark identity for a lash-studio booking app. Black canvas with a living white particle aura, emerald as the single action accent, system typography, translucent surfaces.
colors:
  primary: "#000000"
  secondary: "#F4F4F5"
  tertiary: "#34D399"
  accentSoft: "#6EE7B7"
  textPrimary: "#FFFFFF"
  textSecondary: "#A1A1AA"
  textTertiary: "#71717A"
  surface: "rgba(255,255,255,0.04)"
  surfaceHover: "rgba(255,255,255,0.07)"
  border: "rgba(255,255,255,0.10)"
  borderStrong: "rgba(255,255,255,0.15)"
  header: "rgba(0,0,0,0.60)"
  error: "#F87171"
  statusPending: "#FBBF24"
typography:
  h1:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: 1.875rem
    fontWeight: 600
    letterSpacing: "-0.025em"
    lineHeight: 1.2
  body-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  price:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.4
  wordmark:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: 1.125rem
    fontWeight: 600
    letterSpacing: "-0.025em"
    lineHeight: 1.2
rounded:
  sm: 12px
  md: 16px
  pill: 9999px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "#000000"
    rounded: "{rounded.pill}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.accentSoft}"
    textColor: "#000000"
    rounded: "{rounded.pill}"
    padding: 12px
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.md}"
    padding: 16px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.sm}"
    padding: 8px
  slot-selected:
    backgroundColor: "{colors.tertiary}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    padding: 8px
  slot-idle:
    backgroundColor: "{colors.surface}"
    textColor: "#E4E4E7"
    rounded: "{rounded.sm}"
    padding: 8px
  price-text:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.accentSoft}"
    typography: "{typography.price}"
  secondary-text:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.textTertiary}"
  header-bar:
    backgroundColor: "{colors.header}"
    textColor: "{colors.textPrimary}"
    height: 52px
---

## CSS Tokens (derived)

--primary: #000000
--secondary: #F4F4F5
--tertiary: #34D399
--accentSoft: #6EE7B7
--textPrimary: #FFFFFF
--textSecondary: #A1A1AA
--textTertiary: #71717A
--surface: rgba(255,255,255,0.04)
--surfaceHover: rgba(255,255,255,0.07)
--border: rgba(255,255,255,0.10)
--borderStrong: rgba(255,255,255,0.15)
--header: rgba(0,0,0,0.60)
--error: #F87171
--statusPending: #FBBF24

## Overview

Khal is a lash-studio booking app with an iOS-strict, dark-first identity. The entire brand lives on one idea: a pure black canvas with a slow white particle aura (`BackgroundMesh`, canvas crossfade ~7s) that breathes behind everything. There is exactly one accent color — emerald — and it means one thing: action (book, confirm, pay, WhatsApp). No gradients, no glows, no second accent. The layout is a single centered app column (`max-w-lg`) that feels like a native app in a browser tab, mobile-first.

## Colors

- **Primary (#000000):** The canvas. Rendered by the BackgroundMesh particles' base color; pages are transparent above it.
- **Secondary (#F4F4F5):** Body text off-white. Never pure white except headings — off-white keeps depth on black.
- **Tertiary (#34D399, emerald-400):** The single action accent. Every CTA, selected day/slot, price highlight and focus ring uses it. Black text on emerald passes WCAG AA at ~8:1.
- **AccentSoft (#6EE7B7, emerald-300):** Hover state and price text on dark surfaces.
- **TextSecondary / TextTertiary (zinc-400 / zinc-500):** Two-step gray hierarchy for secondary copy. zinc-500 on black is ~5.7:1 (AA-safe for the price line, contract-tested).
- **Surface (white 4%):** Translucent cards and rows over the aura. Hover bumps to 7%; borders at white 10% (15% for interactive outlines). Never solid gray fills — the aura must breathe through. Translucent tokens composite over the `#000000` canvas: white text on `surface` is effectively ~18:1 (AA/AAA far exceeded) — linters that skip alpha compositing read these as 1:1 false negatives; do not "fix" them with solid fills.
- **StatusPending (amber-400) / Error (red-400):** Semantic only, always paired with text, tinted at 10-30% over dark, never solid pastel backgrounds.

## Typography

System font stack everywhere — deliberate brand decision (iOS-strict, zero webfont weight). Hierarchy comes from weight and color, not font changes: semibold tracking-tight headings (h1 up to 2.25rem on desktop), medium prices in emerald, regular zinc body. The wordmark "Khal" is the h1-level wordmark, tracking-tight semibold.

## Layout

One app column: `max-w-lg` centered, `px-4`, sticky translucent header (52px), catalog grid that expands to 2 columns at `sm:`. Fixed bottom action bar on service detail (price + CTA). Footer minimal: wordmark, locality, Instagram, WhatsApp. Spacing scale 8/16/24; page bottom padding clears the fixed bar (`pb-28` on detail).

## Elevation & Depth

No drop shadows. Depth = translucency: `backdrop-blur` over the animated aura, 1px white/10 borders, and the aura itself moving slowly behind. Focus elevation is a 2px emerald outline with 2px offset (`focus-visible`), never a glow.

## Shapes

Three radii, locked: 12px (inputs, slots, day chips), 16px (cards, status boxes), pill (every button). Nothing else. Interactive elements compress on press (`active:scale-[0.98]`).

## Components

- **button-primary** — emerald pill, black semibold text, the only high-emphasis action per screen (Reservar, Confirmar turno, Enviar comprobante). Hover lightens to emerald-300; disabled drops to 50% opacity.
- **card-surface** — translucent service card: circular initial-avatar (white/6 fill, white/15 ring), white title, emerald-300 price. Whole card is the link.
- **input** — dark translucent field, white/15 border, emerald border + outline on focus. Labels above, zinc-300.
- **slot-selected / slot-idle** — day and time pickers. Selected = solid emerald with black text; idle = translucent with white/15 border; closed days = 40% zinc, cursor-blocked.
- **price-text** — emerald-300, medium weight. On black surfaces AA is 10+:1 (contract-pinned in `apps/web/test/a11y-p2-contract.test.ts`).

## Do's and Don'ts

- Do keep exactly one accent (emerald). A second accent is a regression.
- Do render BackgroundMesh once, globally (root layout). Never add a second canvas.
- Don't use pure `#FFFFFF` backgrounds or solid gray panels — translucency is the depth system.
- Don't add shadows, glows, or gradient text; the aura is the only atmosphere.
- Don't style buttons non-pill or cards at radii other than 12/16.
- Don't ship any interactive control without the `focus-visible` emerald ring (contract-tested, ORN-59).
- Do keep all visible copy in voseo es-AR (`lang="es-AR"`, i18n messages).

--background: #000000

---

## v2 addendum — 2026-10-20 (khal-ux-skeletons-v2 · 10-uiux · approved by owner)

> **Búsqueda:** keywords: `khal, design tokens v2, tan nightingale, dark default, sharp corners, flow gradient` · clasificación: `design-tokens` · estado: `canónico v2` · actualizado: 2026-10-20

### Brand
- **Wordmark font: TAN Nightingale** (TanType, licensed) — files in `docs/brand/fonts/` (.otf/.ttf/.woff2). Use for the wordmark ONLY (header, hero, footer ghost, favicon/OG monogram). Body stays system/UI font. `font-display: swap`, self-hosted from `public/fonts`.
- Wordmark text: **"Khal"** (capitalizada sola, no all-caps).

### Modes (D12)
- **Dark = DEFAULT** on the clienta app (flow-gradient hero). Light mode available via the typographic toggle (persisted, defaults to system preference on first visit).
- Token model: each mode defines surface/text/accent tokens; ONE accent per mode.

### Backgrounds (D12/D13)
- **Clienta:** flow-gradient-hero-section (21st.dev, chosen by owner+clienta) — three.js liquid gradient, interactive on pointer AND touch, light/dark variants. Dark preferred. Code lands as owned source; license verified pre-ship (fallback: shadergradient / paper-design MeshGradient).
- **Admin:** **solid dark, NO animation** (phone resource budget). Phase 2: static blurred image layered on top.

### Form discipline (D11 — anti-AI guard)
- `border-radius`: ≤ 2px everywhere (sharp editorial). NO rounded card/button defaults.
- Separation = whitespace + scale + typography. Borders ONLY functional (sticky bar top edge). No shadow+radius stacks.

### Skeletons = spec
- `docs/ux-flows/skeletons-v2-board.html` (12 screens, clienta móvil-first + admin teléfono-primario) is the structural contract; `docs/ux-flows/base-diseno-v2.md` is the element-source map.
