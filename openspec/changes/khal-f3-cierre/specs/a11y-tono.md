# Spec: KHAL F3 — fixes a11y + tono es-AR

Fuente normativa: `DOCS/auditoria-a11y-tono-es-ar-2026-09-14.md` §2–§4.
Criterio WCAG 2.x AA: texto normal ≥ 4.5:1.

## Escenarios

### A1 — skip-link (keyboard, Alta)

- **WHEN** un usuario de teclado carga cualquier página web o admin,
  **THEN** el primer foco es un link "Ir al contenido" (`href="#main"`,
  visible solo con `focus-visible`) que salta el header/nav sticky.
- **WHEN** se activa el skip-link, **THEN** el foco cae en `<main id="main"
  tabIndex={-1}>` de la página.
- Alcance: web `header.tsx` + `main` de `[locale]/page.tsx`;
  admin `admin/layout.tsx` + `main` de las 4 páginas bajo `/admin`.

### A2 — `aria-current` en nav admin (keyboard, Media)

- **WHEN** se renderiza el nav admin, **THEN** el link de la página activa
  lleva `aria-current="page"` y los demás no llevan `aria-current`.
- Implementación: nuevo client component `admin-nav.tsx` con `usePathname`
  de `@/i18n/navigation`; las labels traducidas entran por props desde el
  layout server (no se mueve `getTranslations` al cliente).

### C1–C4 — contraste (Alta/Media)

- **C1:** precio en `booking-form.tsx` usa `text-slate-600` (7.58:1 estimado,
  supera 4.5:1); no queda `text-slate-400` en ese nodo.
- **C2:** nombre de servicio oculto usa `text-slate-500` (4.76:1, PASS); el
  estado visible/oculto lo expresa el botón Mostrar/Ocultar (texto, no color).
- **C3:** etiqueta LTV usa `text-slate-600`; no queda `text-slate-400`.
- **C4:** badge no-show usa `text-red-700` sobre `bg-red-50` (supera 4.5:1).

### T1–T3 — tono es-AR (revisión formal)

- **T1:** `payment.whatsappMessage` (es) abre con `"¡Hola!"`.
- **T2:** `book` (es) es `"Agendar cita"` (sentence-case, como el resto).
- **T3:** `<html lang="es-AR">` efectivo en admin y en web con locale `es`
  (`lang={locale === 'es' ? 'es-AR' : locale}`; `en` intacto).
- **G7 intacto:** claves es/en idénticas tras tocar messages (paridad 48/48
  web, 39/39 admin; placeholders sin cambios).

## Out of scope

A4 (tablist day-picker), C5 (decorativos), `href="/"` hardcodeado en
`error.tsx`/`not-found.tsx` (bug i18n, otra tarjeta).
