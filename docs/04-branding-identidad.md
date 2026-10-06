# 04 — Branding e identidad visual
> Parte de: [[projects/khal/README|README]] · Relacionados: [[05-marketing-tono]] · [[reporte-producto-marketing-estilo-2026-09-12]] · [[docs/proyectos/khal|khal]]

Fuente: `apps/web/src/app/globals.css`, `components/shared/header.tsx`,
`components/BackgroundMesh.tsx`, `components/catalog/*`,
`components/payment/payment-step.tsx`, y `docs/reporte-... §3`.

## Marca

- **Nombre:** Khal (header: `Khal`, `text-lg font-semibold tracking-tight`).
- **Voz visual:** iOS-estricta — tipografía limpia, bordes sutiles, cero
  animación pesada, 100% foco utilitario, mobile-first (proposal virtual-agenda).
- **Fondo de marca:** negro (`--background: #000000`) con aura blanca animada
  (`BackgroundMesh`: canvas de partículas blancos/grises con crossfade ~7s,
  "efecto EROS adaptado a blanco y negro"). Sistema: `-apple-system…`
  (stack nativo, sin webfont propia).
- **Logo/imagotipo:** pendiente — hoy solo wordmark tipográfico "Khal".
  Los avatares del catálogo son la inicial del servicio (placeholder).

## Paleta (Tailwind v4, sin `tailwind.config`)

| Uso | Tokens |
|---|---|
| Estructura | `slate` (grises): bordes `slate-200`, texto `slate-900/500`, header `bg-white/80` |
| Acción / pago / WhatsApp | `emerald` |
| Seña pendiente | `amber` |
| Turno confirmado | `emerald` |
| Superficie | `bg-white`, tarjetas `rounded-2xl border` |
| Botones | `rounded-full` + `active:scale-[0.98]` |

## Componentes

- `Header` — sticky, `backdrop-blur`, con **skip-link** "Ir al contenido"
  (`href="#main"`, visible solo con foco). El `<main id="main" tabIndex={-1}>`
  ya existe en la home.
- `CatalogGrid` — cards blancas con inicial-avatar.
- `SlotPicker` — botones nativos día/hora con `aria-pressed`.
- `PaymentStep` — alias/CVU + copiar (`aria-live`) + link WhatsApp;
  estados con `role="status"`.
- `Field`, `EmptyState` — compartidos.
- `error.tsx` / `not-found.tsx` en ambas apps, con foco visible
  (`focus-visible:outline-2`).

## Accesibilidad (ver auditoría 2026-09-14, `docs/auditoria-a11y-tono-es-ar-2026-09-14.md`)

- ✅ Bien: botones nativos, `aria-pressed`, labels implícitos, foco visible.
- ⚠️ Hallazgos abiertos: `aria-current` en nav admin, `aria-live` del botón
  copiar (mejor en región `status`), day-picker como scroll sin rol tablist,
  **4 pares de color con FAIL AA** (precio, LTV, servicio oculto, badge no-show).
- Contraste a corregir antes de producción — detalle y ratios en la auditoría.

## Gaps de identidad

1. Sin logo/imagotipo (solo wordmark).
2. Sin tokens propios (se usan utilidades Tailwind directas; no hay
   `tailwind.config` ni CSS vars de marca más allá de bg/fg).
3. Sin página de confirmación/éxito de pago (las `back_urls` de MP apuntan a
   `/pago/exito|error|pendiente`, inexistentes).
