---
version: alpha
name: Khal
description: B/W ink identity (v7) — strict black-and-white brand, iOS glass surfaces, TAN Nightingale wordmark only, system typography with mono kickers, dark default plus warm paper light mode.
colors:
  primary: "#000000"
  secondary: "#a1a1aa"
  tertiary: "#ffffff"
  accentSoft: "#ffffff"
  accentContrast: "#000000"
  textPrimary: "#ffffff"
  textSecondary: "#a1a1aa"
  textTertiary: "#71717a"
  surface: "rgba(255,255,255,0.06)"
  surfaceHover: "rgba(255,255,255,0.07)"
  border: "rgba(255,255,255,0.10)"
  borderStrong: "rgba(255,255,255,0.15)"
  glassHighlight: "rgba(255,255,255,0.08)"
  header: "rgba(0,0,0,0.60)"
  paper: "#f6f4f1"
  paperInk: "#101014"
  paperAccent: "#0d0d0d"
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
    fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Courier New', monospace"
    fontWeight: 500
    lineHeight: 1.4
  kicker:
    fontFamily: "ui-monospace, 'SF Mono', Consolas, 'Courier New', monospace"
    fontSize: 8px
    fontWeight: 500
    letterSpacing: 2.5px
    lineHeight: 1.2
  wordmark:
    fontFamily: "'TAN Nightingale', 'Bodoni MT', Georgia, serif"
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.2
rounded:
  sm: 12px
  md: 14px
  lg: 16px
  pill: 999px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.accentContrast}"
    rounded: "{rounded.pill}"
    padding: 11px
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.lg}"
    padding: 13px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.sm}"
    padding: 10px
  slot-selected:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.accentContrast}"
    rounded: "{rounded.pill}"
    padding: 8px
  slot-idle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.textSecondary}"
    rounded: "{rounded.pill}"
    padding: 8px
  kicker-label:
    typography: "{typography.kicker}"
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

## Deliberate Typography Exceptions — owner-approved sizes

The following literal `text-[px]` sizes are flagged by `impeccable` but are **owner-approved deliberate choices** per the v7 Delicacy scale. Do not refactor these to default sizes unless the owner explicitly directs otherwise:

- **7px**: used in skeleton geometries and subtle disabled states (`src/components/ui/Skeleton.tsx`)
- **9px**: used in caption text and secondary labels (`src/components/shared/field.tsx`)
- **10px**: used in header labels, field placeholders (`field.tsx`), and some body text
- **10.5px**: used in border-radii calculations and compact spacing (`header.tsx`, `theme-toggle.tsx`)
- **11px**: used in payment-step components and compact body text (`payment-step.tsx`)
- **11.5px**: used in vertical rhythm and line-height calculations (`theme-toggle.tsx`)
- **12.5px**: used in day chip number overlays and some spacing calculations (`khal-ui-preview`, day chips)
- **13px**: used in medium weight text and admin micro-labels (`admin/` components)
- **13.5px**: used in payment-result labels and price detail text (`pago-result.tsx`, `payment-step.tsx`)
- **17px**: used in header bar spacing and some margin calculations (`header.tsx`)
- **19px**: used in section dividers and spacing between groups (`src/components/catalog/`)

- **20px**: used in section spacing and bottom padding calculations (`site-footer.tsx`)
- **22px**: used in card padding and group spacing (`src/components/catalog/catalog-grid.tsx`)
- **28px**: used in section spacing and bottom padding (`site-footer.tsx`, `pb-28` clears action bar)
- **46px**: used in button heights and interactive target sizes (`src/components/shared/button.tsx`)
- **52px**: used in header height and sticky bar dimensions (`header-bar.tsx`, `Shell.tsx`)
- **72px**: used in site-footer large text block and copyright area (`site-footer.tsx`)

These sizes are intentionally set to match the original design intent and the owner's brand voice. Refactoring them to system scale without owner direction would degrade the visual hierarchy.

---
*Generated from khal UI/UX anti-slop research 2026-10. `impeccable` will continue to flag these as `design-system-font-size` warnings; treat as informed decisions, not errors.*

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

---

## v7 addendum — 2026-10-26 (clienta B/W glass · preview v7 approved by owner · branch feat/v7-clienta-bw-glass)

> **Source:** khal-ui-preview skill (v7 spec) + `packages/ui/src/tokens.css` (shipped tokens) + approved preview `E:/Hermes/scratch/khal-preview-v7/index.html` · estado: `canónico v7` · supersedes v1 accents and the v2 D11 radius cap · actualizado: 2026-10-26

### Supersessions (explicit — read before "fixing" anything)

- **The brand is black/white ONLY. The emerald accents (#34D399 / #6EE7B7) are GONE.** The accent IS the ink: `--accent: #ffffff` on dark, `--accent: #0d0d0d` on light; pill text uses `--accent-contrast` (the opposite ink). Any color sneaking back into the clienta UI is a regression.
- **The D11 "radius ≤ 2px" cap is DEAD** (explicit owner approval of the glass system; see `packages/ui/src/tokens.css`). Radius scale now: inputs **12px**, cards **14–16px**, buttons/chips/slots = **real pills (999px)** — enforced through the `--radius-*` tokens and pinned by `tests/unit/khal-v2-tokens.test.ts`.
- **BackgroundMesh aura and flow-gradient hero: PARKED.** Fondo stays B/W until the 21st.dev flow-gradient is integrated in-app. Do not re-add animated backgrounds on your own.
- The v1/v2 sections above remain as history; where they contradict this addendum, THIS addendum wins.

### v7 tokens (shipped, source: packages/ui/src/tokens.css)

- **Dark (default, D12):** canvas `#000000`, foreground `#ffffff`, text `#a1a1aa` / `#71717a`; glass surfaces `rgba(255,255,255,0.06)` rest, `0.07` hover; hairlines `0.10` / `0.15`; glass inset top highlight `rgba(255,255,255,0.08)` (web `globals.css`).
- **Light (paper):** canvas `#f6f4f1`, foreground `#101014`, text `#52525b` / `#6b6b74`; accent pill = ink `#0d0d0d` with white text; glass = ink at `0.04` rest / `0.08` hover; hairlines `0.14` / `0.22`; highlight `rgba(255,255,255,0.7)`.
- **Glass recipe (owner-approved):** `backdrop-filter: blur(16–26px) saturate(150%)` + 1px hairline border + inset top highlight. Blur only over real content (iOS language), never decorative glow.
- **Semantic-only colors survive:** `--status-pending` (#fbbf24 dark / #b45309 light), `--error` (#f87171 / #b91c1c). `::selection` is ink-invert: white bg + black text on dark, ink bg + white text on light (the emerald tint retired 2026-10-26).

### Typography (v7)

- **TAN Nightingale: ONLY the "Khal" wordmark + the ghost watermark "KHAL"** (complete, never cut, pale, over the fondo). Capital K, lowercase rest.
- Everything else: system font stack (iOS-strict, zero webfont weight). Kickers: mono (`ui-monospace / SF Mono / Consolas`), ~9px, letter-spacing 2–3px, uppercase. Prices/totals: mono.
- Hierarchy = weight + ink level (ink / 68% / 44% via text-secondary/tertiary), never a second family.

### Delicacy scale (v7 — owner-specified; "chunky = AI-look")

- Linktree buttons: padding 11px 17px, font 13px, real pill. Cards: radius 16px, padding 13–14px. Rows: 10px 14px. Inputs: radius 12px, padding 10px 14px. Kicker: 8px, ls 2.5px. Day chips: 8px/7px with 12.5px number. Slot bar: 1.5px, no track. Arrows on buttons: own breathing room (`margin-left:auto; padding-left:16px`, 11px, ink-42%) — never glued to text.

### Screens (v7 clienta)

- Home = personal linktree: wordmark + tagline + only 4 pills (Agendá tu turno solid · Catálogo · Conocenos · WhatsApp ↗). Catálogo = 2-col photo grid with name chip overlay (price list removed; prices live in service detail). Conocenos = studio blurb + social rows. Servicio: photo slot, description, TOTAL in big mono, duración, seña (no "el resto al pagar al llegar"). Reservar: 7 day chips (dom off), 1.5px sliding bar, hourly slots (taken = strikethrough + dashed), "¿Sumás algo más?" add-on module with live total, button "Confirmar reserva" (never expose the 12h hold). Recibo: "Tu turno está reservado" (no ✓ check), alias + CBU with copy buttons, WhatsApp CTA. Estado: unique personal link only; 4 states; recordatorios numbered 1–4 (never bullet dots); vencida/cancelada end with "Si creés que fue un error, escribinos."

### Anti-slop rules (standing, from the 2026-10 AI-look research)

- Do: screenshot at 390px and 1280px before calling UI work done; one orchestrated motion moment per page; respect `prefers-reduced-motion`; real photos once available (initials-avatars and gray boxes are placeholders, replace before demo).
- Don't: purple/blue gradients, gradient text, emoji as icons, three identical cards, side-tab colored borders, ALL-CAPS eyebrows (mono kickers are the approved exception), glow/neon/grid backgrounds, beige/cream+terracotta "anti-AI" drift.
- Precedence: shipped components > preview HTML > this file's historical sections. An agent touching clienta UI reads this file first.

### QA gates (run before merging UI work)

- `npx -y -p @google/design.md designmd lint docs/DESIGN.md` — structure + WCAG contrast.
- `node scripts/design-qa/validate-tokens.cjs --dir apps/web/src` — hardcoded hex/px detector (vendored from skill uupm-design-system, ORN-206).
- `tests/unit/khal-v2-tokens.test.ts` — radius/accent contract; any token change re-anchors this test in the SAME work unit.
