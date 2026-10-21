# UX Flows — Khal (lash artist booking)

> **Fecha:** 2026-10-17 · **Skill:** ux-flow-designer v1.0.0 · **Estado:** piloto
> **Búsqueda:** keywords: `khal, ux flows, wireframes, use cases, screen map, booking` · clasificación: `ux` · estado: `activo`

---

## Master Screen Map

→ [diagrams/screen-map.md](./diagrams/screen-map.md) — mapa completo de las 13 pantallas (7 web + 6 admin) con paths de navegación.

## Use Cases

→ [use-cases.md](./use-cases.md) — 6 use cases documentados:

| ID | Nombre | Criticidad |
|----|--------|------------|
| UC-001 | Explorar catálogo | Media |
| UC-002 | **Reservar turno con seña 30%** | ⭐ CRÍTICA |
| UC-003 | Admin login OTP | Alta |
| UC-004 | Admin gestiona catálogo (Tiptap + fotos) | Alta |
| UC-005 | Admin gestiona bloqueos | Media |
| UC-006 | Admin gestiona clientas | Media |

## Use Case Diagrams (UC-002 crítico)

### UC-002: Reservar turno con seña
- [Flowchart](./diagrams/uc-002-reservar/flow.md) — navegación pantalla a pantalla con race conditions y error paths
- [State diagram](./diagrams/uc-002-reservar/states.md) — estados del flujo: IdlePicker → Formulario → CreandoReserva → Confirmada
- [Sequence diagram](./diagrams/uc-002-reservar/sequence.md) — interacción Clienta/Web/Supabase/WhatsApp con RPC `create_booking`

## Clickable Prototype

→ [wireframes/INDEX.md](./wireframes/INDEX.md) — 6 pantallas HTML navegables:

**Flujo clienta:** `home.html → servicio-detalle.html → reservar.html → confirmacion.html`

**Flujo admin:** `admin-login.html → admin-dashboard.html → admin-servicios.html`

Abrí `wireframes/home.html` en cualquier browser — todo clickable, zero JS.

## Navigation Patterns

| Patrón | Dónde | Nota |
|--------|-------|------|
| Back button | Todas las screens excepto home y confirmación | `←` en nav bar |
| CTA sticky bar | servicio-detalle (Reservar) | Precio a la izquierda, botón a la derecha |
| Secciones progresivas | reservar (1·Fecha → 2·Horario → 3·Datos) | Cada sección se habilita cuando la anterior está completa |
| WhatsApp como salida | confirmacion | Único CTA verde de la app — exit al canal de pago de la seña |
| OTP grid | admin-login | 6 celdas, auto-advance |

## Reglas de negocio capturadas en los flows

1. **Seña 30%**: el resumen la muestra como monto fijo ($7.500 de $25.000), no como porcentaje
2. **Saldo el día del turno**: $17.500 — se muestra en el resumen para evitar sorpresas
3. **Race condition de slots**: si el horario se toma entre selección y confirmación → refresh + "recién tomado"
4. **24hs de gracia para seña**: el turno queda `pending_deposit` 24hs hasta recibir la seña
5. **WhatsApp-first**: el pago de la seña NUNCA pasa por la web (regla del owner: MP fuera)
6. **Soft delete servicios**: `deleted_at`, no DELETE físico

## Open Questions (para la fase sketch → ui-ux-pro-max)

1. El date picker: ¿calendar month view o chips horizontales de 30 días?
2. La pantalla de reserva: ¿una página con scroll (3 secciones) o un wizard de 3 steps?
3. El OTP: ¿6 celdas separadas o un solo input con letter-spacing?
4. Confirmación: ¿código alfanumérico (KHAL-2026-0184) o numérico corto?
5. Admin dashboard: ¿incluye mini-calendario del día o solo stats + menú?

## Próximos pasos (pipeline de la flota)

```
✅ ux-flow-designer (ESTE DOC — flows + wireframes lo-fi clickables)
⬜ creative/sketch — hi-fi skeleton: mobile + desktop side-by-side con design direction real
⬜ ui-ux-pro-max — visual design production-ready
⬜ Implementación en apps/web (páginas de reserva actuales son skeletons)
```

Los wireframes pueden exportarse a Figma con el integration oficial **Code to Canvas** (requiere Figma desktop + Dev Mode MCP). Pedí "export to figma" si lo querés.

---

## v2 — 2026-10-20 · Reglas de negocio nuevas (fuente: dictado de la owner)

> **Búsqueda:** keywords: `khal, v2, 12 horas, seña manual, términos, bot telegram, ciclo de clienta` · clasificación: `ux-flows` · estado: `canónico` · actualizado: 2026-10-20

**Decisiones (D1–D6) y artefactos v2:**
- **D2 — Regla de las 12 horas:** el turno queda TOMADO 12 h como `pending_deposit` ("para que no haya malentendidos"); vencido sin comprobante → auto-release; la dueña puede re-confirmar a mano (UC-002/UC-007).
- **D1 — Términos en el commit:** casilla con resumen en el paso de confirmar; texto completo en `/politicas` + footer; repetidos los de plata en la pantalla de seña.
- **D3 — Flag externo:** checkbox en el formulario → visible en cola y ficha.
- **D5/D6 — Seña manual via WhatsApp (sin pagos en app) · canvas negro puro, sin partículas.**
- Artefactos: [flujos completos para la dueña (HTML+PDF)](./v2-flujos-completos.html) · [referencias por pantalla](./referencias-skeletons-v2.md) · [board de esqueletos 12 pantallas](./skeletons-v2-board.html) · [auditoría anti-IA](../audits/skeletons-v2-audit/AUDIT.md) · [ODD con tareas y evidencia](../../odd/tasks/khal-ux-skeletons-v2.md)
- UCs nuevos: UC-007 (cola de señas), UC-008 (bot telegram), UC-009 (ciclo de mensajes / retoque 18 días), UC-010 (contenido editable).
