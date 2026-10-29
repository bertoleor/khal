# Product Design Decisions — khal web app

This file captures the five design decisions that anchor every UI edit in this project. Read it before any UI change. If a change conflicts with any decision, pause and reconcile.

## 1. Type
- **Font family**: System font stack only (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`). No second family, no Inter, no custom webfonts for body text.
- **Type scale**: Hierarchy comes from weight + ink level, not font changes.
  - Headings: semibold, tracking-tight, up to 2.25rem on desktop.
  - Body: regular, 1rem/1.5 line-height, zinc hierarchy (`textSecondary: #a1a1aa`, `textTertiary: #71717a`).
  - Kickers + prices: mono (`ui-monospace / SF Mono / Consolas`), 8–9px, letter-spacing 2–3px, uppercase.
  - Wordmark "Khal": TAN Nightingale, used ONLY in header/hero/footer/ghost/favicon. Body stays system.
- **Forbidden**: A second font family anywhere. No `text-inter`, no `font-["..."]` with arbitrary faces.

## 2. Colour
- **One accent only**: Emerald is GONE (v7 addendum). The accent IS the ink:
  - Dark mode: `--accent: #ffffff` (white ink on black canvas).
  - Light mode: `--accent: #0d0d0d` (ink on paper `#f6f4f1`).
  - Pill text uses `--accent-contrast` (the opposite ink).
- **Neutrals**:
  - Dark: `#000000` (canvas), `#ffffff` (white), `#a1a1aa` (textSecondary), `#71717a` (textTertiary).
  - Light: `#f6f4f1` (paper), `#101014` (foreground), `#52525b` / `#6b6b74` (text).
- **Where accent is allowed**: Buttons primary, selected slots/days, price highlights, focus rings, CTA pills. Nowhere else.
- **Forbidden**: Purple/blue gradients, gradient text, emoji as icons, solid `#FFFFFF` backgrounds, solid gray panels, neon/glow effects, more than one accent color per mode.

## 3. Layout
- **One app column**: `max-w-lg` centered, `px-4`, sticky translucent header (52px).
- **Catalog**: 2-column photo grid at `sm:` breakpoint. No "three identical cards in a row".
- **Fixed bottom action bar** on service detail (price + CTA). Footer minimal: wordmark, locality, Instagram, WhatsApp.
- **No centered hero default**: Content left-aligned on visible grid. Asymmetric layout when the brief demands it.
- **Forbidden**: Default "hero → three features → pricing → footer" stack without a differentiated point of view. No card rows where every card is identical.

## 4. Density
- **Spacing scale**: 8px baseline (`sm: 8px`, `md: 16px`, `lg: 24px`). All margins/paddings must resolve to this scale.
- **Page bottom padding**: `pb-28` clears the fixed action bar (28px = 3.5 × 8px).
- **Component compactness**:
  - Buttons: padding 11px (1.375 × 8px).
  - Cards: radius 16px, padding 13–14px.
  - Inputs: radius 12px, padding 10px 14px.
  - Kicker: 8px, letter-spacing 2.5px.
- **Forbidden**: Arbitrary `px` values (`margin-top: 17px`, `padding: 11.5px`). No uniform padding that makes everything look "the same". Whitespace must be earned, not default.

## 5. Tone
- **Language**: Voseo es-AR everywhere (`lang="es-AR"`). All visible copy in Argentine Spanish.
- **Copy style**: Short, plain, about what we make. Never "supercharge", "unlock your potential", "revolutionize your workflow".
- **CTA voice**: Exactly what happens when used — "Reservar turno", "Confirmar reserva", "Enviar comprobante". Same name through the whole flow.
- **Empty/Error states**: Explain what happened and how to fix it, in the interface's voice. Never vague.
- **Forbidden**: Generic AI phrases ("Revolutionize your workflow", "unlock your potential", "next-gen", "seamless", "game-changing", "cutting-edge", "elevate your", "supercharge", "effortless"). No ALL-CAPS eyebrows except the approved mono kickers.

---
*Generated from DESIGN.md v7 + 2026-10 AI slop research. Keep in sync with tokens.css and DESIGN.md whenever tokens or rules change.*