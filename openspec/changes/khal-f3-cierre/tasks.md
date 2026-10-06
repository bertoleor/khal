# Tasks: KHAL F3 — cierre real de fixes a11y + tono es-AR

Orden: SDD primero (este dir), TDD rojo-primero por fix, verificación,
commit selectivo + push, espejo Linear, envelope. Kanban lo mueve el
orquestador (este contexto no puede mutar Kanban).

## 0. Guard G3 (antes de todo)

- [x] Restaurar desde HEAD las deletions MP no aprobadas
  (`mercadopago.ts`, `actions/payment.ts`, webhook route, `.env.example`,
  `messages/es|en.json`) — contenido idéntico al blob, pérdida cero.
  Decisión MP = dueña (ORN-81, Fase 2 due 2026-09-26).

## 1. TDD rojo-primero (runner: `vitest run`)

- [ ] `apps/web/test/i18n-tone.test.ts`: T1 (`¡Hola!`), T2 (`Agendar cita`).
  Verlo FALLAR antes del fix.
- [ ] `apps/web/test/a11y-fixes.test.tsx`: skip-link en `Header`
  (render server, sin jsdom) + C1 (`text-slate-600`, sin `slate-400` en el
  nodo de precio). Verlo FALLAR antes del fix.
- [ ] `apps/admin/test/a11y-contrast.test.ts`: contrato estático de fuente
  para C2/C3/C4 (lee los `.tsx`, exige clase nueva y ausencia de la vieja en
  el nodo). Verlo FALLAR antes del fix.
- [ ] `apps/admin/test/a11y-nav.test.tsx`: `admin-nav.tsx` expone
  `aria-current="page"` solo en el link activo (mock de `usePathname`).
  Verlo FALLAR antes de crear el componente.

## 2. Implementación mínima (solo lo que los tests exigen)

- [ ] A1: skip-link en web `header.tsx` + admin `admin/layout.tsx`;
  `id="main"` + `tabIndex={-1}` en `main` de web page y 4 páginas admin.
- [ ] A2: `admin-nav.tsx` client + uso en `admin/layout.tsx`.
- [ ] C1–C4: cambios de clase (4 líneas).
- [ ] T1–T3: 2 strings es + `lang` en 2 layouts.
- [ ] Conservar el fix staged de `booking-form.tsx` (props `PaymentStep`
  acopladas al A3 mergeado en d7c7e54).

## 3. Verificación (gate Fase 3)

- [ ] `vitest run` verde completo (incluye paridad i18n G7 existente).
- [ ] `turbo run typecheck` PASS.
- [ ] `eslint` + `prettier --check` en archivos tocados (o `--write` + re-check).
- [ ] Paridad es/en: 48/48 web, 39/39 admin (la cubre el test G7).

## 4. Entrega

- [ ] Commit selectivo en `feat/khal-payment-a11y`: SDD + tests + fixes +
  `booking-form.tsx`. Afuera: MP deletions (restauradas), `pnpm-lock.yaml`,
  artefactos locales. Push.
- [ ] Comentario espejo en Linear ORN-156 (F3) + nota de guard G3 en ORN-81.
  Kanban (`t_daa7c1df` verificación, `t_7295d043` review→done): lo mueve el
  orquestador padre.
- [ ] Reporte envelope: qué cambió, qué verificado, qué queda (G3 dueña,
  A4/C5 opcionales, bug `href="/"` i18n).
