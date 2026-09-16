# Proposal: KHAL F3 — cierre real de fixes a11y + tono es-AR

## Intent

La tarjeta kanban `t_daa7c1df` ("F3 fixes a11y + tono es-AR") figura `done`,
pero la verificación contra el árbol muestra que solo aterrizó **A3**
(commit `d7c7e54`). El resto de los fixes auditados en
`docs/auditoria-a11y-tono-es-ar-2026-09-14.md` (A1, A2, C1–C4, T1–T3)
sigue pendiente en el código. Este cambio los completa con TDD rojo-primero.

## Scope (solo fixes, sin redesign — veredicto de la auditoría)

| ID | Fix | Archivo |
|----|-----|---------|
| A1 | skip-link "ir al contenido" + `id="main"`/`tabIndex={-1}` | web `header.tsx`, `[locale]/page.tsx`, admin `admin/layout.tsx` + 4 `main` de páginas |
| A2 | `aria-current="page"` en nav | admin `admin/layout.tsx` vía nuevo `admin-nav.tsx` client |
| C1 | `text-slate-400` → `text-slate-600` (precio) | web `booking-form.tsx:97` |
| C2 | nombre oculto `text-slate-400` → `text-slate-500` (botón Mostrar/Ocultar ya da estado explícito) | admin `service-list.tsx:39` |
| C3 | LTV `text-slate-400` → `text-slate-600` | admin `client-list.tsx:34` |
| C4 | badge no-show `text-red-600` → `text-red-700` | admin `client-list.tsx:49` |
| T1 | `"Hola!"` → `"¡Hola!"` | web `messages/es.json` (`payment.whatsappMessage`) |
| T2 | `"Agendar Cita"` → `"Agendar cita"` | web `messages/es.json` (`book`) |
| T3 | `lang="es-AR"` | admin `app/layout.tsx`, web `[locale]/layout.tsx` |

Fuera de alcance (la auditoría los deja opcionales): A4 tablist+flechas,
C5 decorativos, bug `href="/"` en error/not-found (es i18n, no a11y).

## Non-goals / guards

- **G3 (MP vs manual-only, Linear ORN-81) sigue BLOQUEADA** — requiere OK de
  la dueña. En el árbol hay deletions staged de la integración MP
  (`mercadopago.ts`, `actions/payment.ts`, webhook route, env vars, strings)
  sin esa aprobación: este cambio las **restaura desde HEAD** (pérdida cero,
  el contenido es idéntico al blob commiteado) y solo commitea el fix de
  compilación (`booking-form.tsx` props de `PaymentStep`, acoplado al A3 ya
  mergeado) más los fixes de arriba. La decisión MP queda para la dueña.
- No se toca `pnpm-lock.yaml` (ruido) ni `.worktrees/`, `supabase/.temp/`,
  `.eslintcache` (artefactos locales).

## Gate de aceptación (Fase 3 del plan-accion-2026-09-12)

- `vitest run` verde (incluye tests nuevos rojo-primero + paridad i18n G7).
- `turbo run typecheck` PASS (repara el descalce `bookingId`/`serviceId` que
  d7c7e54 dejó en `booking-form.tsx`).
- `eslint` + `prettier --check` PASS en archivos tocados.
- Paridad es/en intacta 48/48 web y 39/39 admin.
