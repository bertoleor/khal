# Auditoría a11y KHAL — ORN-59 (F4) — 2026-09-29

Juez dual según plantilla (hallazgo = defecto solo si es verificable en archivo+línea; sin evidencia se descarta). Todos los contrastes calculados con fórmula WCAG 2.2 relativa (no a ojo). Alcance: apps/web + apps/admin (57 archivos TS/TSX, flujo completo: home → servicio → reservar → pago; admin: agenda/clientes/servicios/bloqueos + login informativo).

## Estado base (lo que YA está bien — no es缺陷 cero pero está lejos de ser grave)
- `html lang={locale}` dinámico ✔ (`apps/web/src/app/[locale]/layout.tsx:26`)
- Fondo decorativo `aria-hidden + tabIndex={-1}` ✔ (`BackgroundMesh.tsx:231-232`)
- SlotPicker: botones nativos + `aria-pressed` ✔ (`slot-picker.tsx:42,71`)
- PaymentStep: `role="status"` en estados, `role="alert"` en error de checkout, `aria-live="polite"` en botón copy ✔ (`payment-step.tsx:44,100,107,160`)
- `useActionState` con feedback `isPending` en submit ✔ (`booking-form.tsx:48,91-95`)
- Inputs admin con `aria-label` en checkboxes sin label visible ✔ (`service-list.tsx:30`)
- Formularios nativos `<form action>` + inputs con `name`/`required` — sin JS-trap ✔
- AdminNav con `Link` reales ✔ (`apps/admin/src/app/admin/layout.tsx`)
- EmptyState con CTA accesible ✔

## Hallazgos confirmados (evidencia archivo:línea)

### H1 — P2 — Contraste insuficiente en texto de precio del form (WCAG 1.4.3 AA: 4.5:1)
- **Dónde:** `apps/web/src/components/booking/booking-form.tsx:99-101` — `text-xs text-slate-400` sobre fondo blanco.
- **Medido:** `#94a3b8` sobre `#ffffff` = **2.56:1** (falla AA 4.5:1; falla hasta AA-large 3:1).
- **Texto afectado:** el precio del servicio, dato clave para decidir la reserva.
- **Fix:** `text-slate-500` (#64748b = 4.76:1 pasa) o `text-slate-600`. Una línea de className.

### H2 — P2 — Focus ring invisible en 6 botones del flujo de reserva (WCAG 2.4.7)
- **Dónde (verbatim, todos sin focus-visible):**
  - `apps/web/src/app/[locale]/servicios/[id]/page.tsx:63` — CTA "Reservar" (CTA principal del site).
  - `apps/web/src/components/booking/booking-form.tsx:92` — submit "Confirmar".
  - `apps/web/src/components/payment/payment-step.tsx:155` — "Pagar online" (ya tiene hover, falta focus).
  - `apps/admin/src/components/admin/appointment-list.tsx:62` — transiciones "Confirmar/Cancelar/No asistió" (admin, acción destructiva).
  - `apps/admin/src/components/admin/service-list.tsx:37-39` + `:61-64` — toggle visibilidad y bulk increase.
  - `apps/admin/src/components/admin/exceptions-list.tsx:51-55` + `client-list.tsx:57-60` — submit forms admin.
- **Evidencia:** patrón `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-*` existe en `error.tsx:28`, `not-found.tsx:15`, `payment-step.tsx:45` — la convención del repo; estos 6+ puntos la omiten.
- **Impacto:** usuario por teclado no ve dónde está el foco en los puntos más críticos (pagar, confirmar, cancelar turno).
- **Fix:** replicar el patrón existente: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900` (o color del botón).

### H3 — P3 — Labels accesibles faltantes en form admin de excepciones (WCAG 1.3.1 / 4.1.2)
- **Dónde:** `apps/admin/src/components/admin/exceptions-list.tsx:27-49` — `<input name="title">` con solo `placeholder`, `<select name="type">` y `<input type="date">` sin label/aria-label asociado.
- **Impacto:** placeholder desaparece al escribir (el título deja de ser visible); lector de pantalla anuncia campo sin nombre.
- **Fix:** `aria-label` en cada control o label visible `sr-only` — 3 atributos.

### H4 — P3 — Estado de botón "copiar" no anunciado por lector de pantalla (WCAG 4.1.3)
- **Dónde:** `apps/web/src/components/payment/payment-step.tsx:35-52` — `aria-live="polite"` está EN el botón que muta su propio texto (`{copied ? t('copied') : t('copy')}`). Un live region que cambia su propio contenido al foco se pierde: el anuncio ocurre en el mismo elemento enfocado; NVDA/JAWS suelen no releerlo.
- **Fix:** mover `aria-live` a un `<span>` vecino o `visually-hidden` con estado, mantener el label del botón estable.

### H5 — P3 — Botones admin de transición sin confirmación de acción destructiva (WCAG a11y-ops, no SC puntual)
- **Dónde:** `apps/admin/src/components/admin/appointment-list.tsx:50-67` — "No asistió"/"Cancelado" en un click sin confirm ni undo; junto a "Confirmado" (misma fila, mismo target size).
- **Impacto:** errar un click en admin sobre una agenda real cancela un turno confirmado.
- **Fix (menor):** `confirm()` nativo o dos-step (click → "¿Seguro?") — decisión de producto; NO inventar diseño.

### H6 — SUGGESTION — Contraste de fondo de dot de estado (no bloqueante)
- `appointment-list.tsx:36-40` — dots `bg-amber-400`/`bg-emerald-500`/`bg-red-500` sobre blanco: 1.67:1 / 2.37:1 / 3.66:1. Como es color-only conveying status (`aria-hidden` + texto ausente), el color NO es el único canal solo si el estado textual está en el botón — pero el status textual no se muestra en la fila, solo el dot. **El estado del turno es info color-only para usuarios con baja visión.**
- **Fix:** agregar `<span class="sr-only">{status}</span>` o mostrar status textual.

### H7 — SUGGESTION — `metadata` no usa plantilla por locale
- `apps/web/src/app/[locale]/layout.tsx:8-11` — title/description hardcodeados en español aunque el site es es/en. Puro SEO+i18n, no bloqueante.

## Lo que NO es defecto (verificado, no asumido)
- Fondo negro `bg-black` + `BackgroundMesh` decorativo: correcto, decoración exenta.
- Disabled day button `text-slate-300` 1.42:1: WCAG 1.4.3 exime controles deshabilitados (exception).
- `sky-600` 4.1:1 con texto blanco en botón grande: pasa AA-large (3:1), aceptable.
- white sobre emerald-600 3.77:1 en botón: pasa AA-large, aceptable (texto ≥14pt bold).
- Nav admin sin `aria-current`: los Links no marcan página activa — menor (H-sugg), el repo ya tiene patrón en el worktree huérfano (`AdminNav.tsx` con `aria-current`).

## Verificación pendiente que NO pude correr acá
- axe-core / Lighthouse a11y sobre el preview: requiere browser runtime en este cron. Los hallazgos H1-H5 son de código estático verificable sin render; axe agrega coberturas runtime (focus order, landmarks) — recomendado como follow-up del slice de fix.

## Clasificación para tickets
- P2: H1 (contraste precio), H2 (focus ring x6 puntos)
- P3: H3 (labels admin), H4 (aria-live copy), H5 (confirm destructivo)
- Suggestion: H6 (status sr-only), H7 (metadata i18n)
