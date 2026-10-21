# Plan de implementación — khal v2 (para 01-frontend)

> **Búsqueda:** keywords: `khal, plan implementacion v2, frontend, tasks, flow gradient, nightingale, admin solido, tokens v2` · clasificación: `plan-implementacion` · estado: `canónico` · actualizado: 2026-10-20
> Autor: 10-uiux (design) · Destinatario: 01-frontend (implementación) · Despacho: via orquestador (24) — nunca directo
> Contratos de entrada: `odd/tasks/khal-ux-skeletons-v2.md` (D1–D13 + evidencia) · `docs/ux-flows/skeletons-v2-board.html` (12 pantallas = spec estructural) · `docs/ux-flows/base-diseno-v2.md` (mapa de fuentes) · `docs/ux-flows/fondo-demo-khal.html` (visual aprobado) · `docs/DESIGN.md` (tokens v2 addendum)

## Resumen ejecutivo

Rediseño integral de khal en 3 frentes: **(1)** app clienta con el fondo interactivo flow-gradient (elegido por la owner + su clienta, demo aprobado en 4 iteraciones), modo **oscuro por defecto**, wordmark **"Khal" en TAN Nightingale** (licenciada, en el repo); **(2)** panel admin **teléfono-primero** con fondo **sólido oscuro sin animación** (presupuesto de recursos), misma lógica que hoy ampliada con la regla de las 12 h, cola de señas y ciclo de mensajes; **(3)** disciplina formal anti-IA: esquinas casi rectas, separación por aire no por bordes. Todo especificado: los skeletons SON la spec — nada se inventa sobre la marcha.

## Decisiones que gobiernan este plan (D1–D13, del ODD)

| # | Decisión | Origen |
|---|---|---|
| D1 | Términos: casilla con resumen en el commit del reservar + repetidos los de plata en la pantalla de seña; texto completo en /politicas | owner |
| D2 | **Regla de las 12 horas**: slot tomado 12 h como `pending_deposit`, auto-release al vencer, la dueña puede re-confirmar a mano | owner |
| D3 | Flag "pestañas de otro lugar" (⚑) visible en cola + ficha desde el formulario | owner |
| D4 | Estados: pending_deposit → confirmed → completed (+ released / rejected / no-show / rescheduled) | 10-uiux |
| D5 | Capas: estructura (skeletons) → aprobación → piel (tokens) | owner |
| D6 | ~~Canvas negro puro~~ — **amendado por D10** | owner |
| D7 | **Admin teléfono-primero** (desktop = versión grande del mismo contenido) | owner |
| D8 | Dispositivo de referencia: **iPhone 12 Pro (390×844)** + criterios iOS (safe-area, 100dvh, targets ≥44pt, motion transform/opacity, backdrop-filter solo superficies chicas, QA en iPhone real) | owner |
| D9 | Header/footer **parte del espacio**: sin líneas; footer = cierre tipográfico (wordmark fantasma) | owner |
| D10 | **Fondo interactivo: flow-gradient-hero-section** (21st.dev, @hardikkashiyani123456788) — interactive pointer+touch, light/dark; demo: docs/ux-flows/fondo-demo-khal.html | owner + clienta |
| D11 | **Esquinas ≤ 2px, sin cajas redondeadas tipo plantilla**; separación por aire/escala/tipografía; bordes solo funcionales | owner |
| D12 | Flow-gradient = **solo app clienta, modo oscuro por defecto** (claro por toggle) | owner |
| D13 | **Admin = fondo sólido oscuro, sin animación**; fase 2: una imagen estática con blur encima | owner |

## Fases y tareas (orden propuesto — cada fase cierra con work-unit commits)

### Fase 0 — Tokens y sistema de tema (base de todo)
- **T-F0.1** —DESIGN.md v2 addendum→ tokens reales en el código: paleta por modo (dark default), UN acento por modo, superficies sin bordes.
- **T-F0.2** Sistema de tema: dark default + toggle tipográfico (sin caja, lucide sun/moon, persiste, default=sistema en primera visita). Verificar light/dark en CADA pantalla (gate).
- **T-F0.3** `@font-face` TAN Nightingale (self-host desde `public/fonts/`, usar los archivos de `docs/brand/fonts/`), aplicada SOLO al wordmark; fallback serif.
- **T-F0.4** Radius global: override a ≤2px en el theme de Tailwind; revisar componentes shadcn heredados que traigan radius default.
- **Aceptación:** toggle persiste y funciona en ambas apps; wordmark renderiza en Nightingale (document.fonts.check); cero componente con radius >2px.

### Fase 1 — Fondo clienta (el visual aprobado)
- **T-F1.1** **Verificar licencia** del componente (actualmente "unknown" en 21st.dev) ANTES de integrar. Si no es permissiva → **fallback decidido**: reimplementar el mismo look con shadergradient o paper-design MeshGradient (repos verificados, licencia limpia) — avisar a la owner antes de cambiar.
- **T-F1.2** Traer el código fuente vía MCP `t21st` (API key de 01) → **aterriza como fuente propia** en el repo (regla de flota), tokens intercambiados, sin link de crédito del autor.
- **T-F1.3** Integración: dark default (D12), `prefers-reduced-motion` respeta la pausa (el pause-btn visible NO va), pausa cuando la pestaña no está visible, densidad calibrada en móvil.
- **T-F1.4** QA perf iOS: framerate en iPhone 12 Pro real (gate D8); three.js en **code-splitting** (solo la home carga el bundle 3D).
- **Aceptación:** interacción touch viva en el teléfono real; 60fps objetivo (≥30 mínimo); light/dark con toggle; el hero texto = wordmark "Khal" en Nightingale; CTA "Agendá tu turno" en UNA línea.

### Fase 2 — App clienta (6 pantallas, spec = board 01-06)
- **T-F2.1** Home: cover editorial con wordmark + **catálogo en LISTA de filas** (primera fila = servicio firma agrandado), footer tipográfico sin líneas, empty state diseñado.
- **T-F2.2** Detalle: imagen protagonista + cluster de datos con **seña visible**, lista "qué incluye", CTA sticky (con safe-area).
- **T-F2.3** Reservar: tira de fechas horizontal (reel) + slots con tachados visibles + campo externo ⚑ + casilla de términos (D1) + botón "Confirmar — reserva por 12 h" + race condition + idempotencia anti doble-tap.
- **T-F2.4** Seña: recibo (monto enorme, alias COPIAR, CBU chico), barra 12 h, CTA único WhatsApp, términos de plata repetidos.
- **T-F2.5** Confirmación/estado: badge PENDIENTE + countdown + 3 pasos "qué pasa ahora"; badge cambia con la aprobación de la dueña.
- **T-F2.6** /politicas: términos numerados legibles + link desde footer; contenido editable desde admin (F4).
- **Aceptación:** cada pantalla pasa el checklist anti-IA (board panel derecho); móvil 390px impecable; a11y (las 2 auditorías previas como baseline).

### Fase 3 — Panel admin (teléfono-primero, spec = board 07-12)
- **T-F3.0** **Fondo sólido oscuro** (D13) — sin animación, sin canvas. Fase 2 posterior: imagen estática con blur (no bloquea este plan).
- **T-F3.1** Hoy/Mañana: pestañas de un toque [HOY|MAÑANA|SEÑAS (n)] + versión desktop split 60/40.
- **T-F3.2** Cola de señas: lista → hoja completa con comprobante grande + acciones en zona de pulgar (APROBAR grande, secundarias abajo) + teclado A/R/W/L en desktop + countdowns. **Cada acción dispara su mensaje** (templates en v2-flujos §06-07) listo para reenviar por WhatsApp.
- **T-F3.3** Calendario: **week view propio** (spec = board 08; columnas+chips, estados ▪/▫/rayado) — NO react-big-calendar ni FullCalendar. Date-pickers puntuales con react-day-picker/shadcn. Móvil: tira mini + swipe día a día.
- **T-F3.4** Ficha clienta: flags chips (⚑/no-shows/lifetime), notas editables, **alta manual**, timeline de turnos, arranque del reloj de retoque (18 días) al completar.
- **T-F3.5** Catálogo: tabla desktop / lista con thumb en teléfono + FAB "+"; la primera fila define el servicio firma de la home.
- **T-F3.6** Settings: secciones (Alias & CBU · Seña monto/% · Redes · Términos editor con preview en vivo · Bot on/off).
- **Aceptación:** dueña completa el circuito crítico SOLO desde el teléfono: aprobar seña → confirmar → ver agenda → editar término. QA en SU iPhone.

### Fase 4 — Regla de las 12 h + estados (backend que ya existe, ampliar)
- **T-F4.1** `hold_expires_at` en create_booking + job de auto-release a las 12 h + re-confirmación manual (dueña) si llegó tarde el comprobante.
- **T-F4.2** Estados del turno (D4) aplicados en agenda/cola/ficha + contador visible.
- **Aceptación:** un turno vencido se libera solo y el slot vuelve a estar disponible para la clienta — probado con datos de prueba (NO en producción).

### Fase 5 — Bot de Telegram (canal, no pantalla)
- **T-F5.1** Implementación en `apps/api-workers` (ya existe la app): alertas de reserva, digest diario (hoy+mañana), nudge de vencimiento, seguimiento 2 días. Templates y triggers: `v2-flujos-completos.html` §06.
- **T-F5.2** Fallback: bot caído = 0 pérdida (el panel es la fuente).
- **Coordinación:** el dispatch de esta fase lo arma el orquestador (posible co-work con backend/automation).

### Fase 6 — QA final (gates)
- **T-F6.1** Checklist anti-IA por pantalla (referencia citada · sin cards iguales · asimetría · 1 contraste · radius ≤2px).
- **T-F6.2** iOS real: dueña en su iPhone + iPhone 12 Pro (clienta) — flujos completos, perf del fondo, safe-areas.
- **T-F6.3** Light/dark verificado en las 12 pantallas · a11y (WCAG AA + auditorías previas) · bilingüe es/en intacto.

## De dónde sale cada componente (canon — regla: no inventar lo que existe)

| Pieza | Fuente |
|---|---|
| Primitivas (botones, inputs, tabs, sheets, tabla, toasts) | shadcn/ui — extender lo existente en khal, nunca hermanar |
| Date pickers | react-day-picker (shadcn Calendar) |
| Iconos | lucide-react (set único) |
| Fondo clienta | flow-gradient (21st.dev vía t21st MCP) — código propio tras instalar; fallback shadergradient/MeshGradient |
| Wordmark | TAN Nightingale (licenciada, `docs/brand/fonts/`) |
| Identidad propia (portada, filas de servicio, recibo, pass, week view) | construcción propia sobre primitivas — spec en el board |
| Motion | Motion (ex-Framer) — presets, no hand-roll |

## Fuera de este plan
- Pagos automáticos en la app (la seña es manual por WhatsApp — decisión de negocio estable)
- La imagen estática con blur del admin (fase 2 posterior, no bloquea)
- Renovación de diseño de emails/marketing (otro scope)

## Riesgos y mitigaciones
| Riesgo | Mitigación |
|---|---|
| Licencia del fondo "unknown" | Se verifica ANTES (T-F1.1); fallback con look igual ya elegido |
| three.js pesa en iPhone | code-splitting + calibración + pausa offscreen + gate de QA en dispositivo real |
| Branch en vuelo (khal/changelog-batch-1016) | El orquestador coordina branches antes del dispatch — este plan no se apila solo |
| Drift de diseño en la implementación | El board + base-diseno son CONTRATO; desviación = rechazo en review con los checks anti-IA |

## Tracking
Progreso y evidencia en `odd/tasks/khal-ux-skeletons-v2.md` (tasks estables + evidence). Al retomar: leer ODD + board antes de tocar código.
