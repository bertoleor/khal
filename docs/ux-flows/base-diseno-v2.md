# Base de diseño — khal v2 (fundamentos de coherencia)

> **Búsqueda:** keywords: `khal, base de diseño, header, footer, logo, fuentes de componentes, 21st.dev, react bits, calendario, coherencia` · clasificación: `ux-foundation` · estado: `canónico` · actualizado: 2026-10-20
> Parte de: [[skeletons-v2-board]] · [[referencias-skeletons-v2]] · [[AUDIT]] · ODD `khal-ux-skeletons-v2.md` (D9-D10)
> Responde a la owner (2026-10-20): dónde va cada elemento · de dónde sale cada componente · reglas de header/footer/logo · fondo interactivo 21st.dev · calendario admin pensado antes del plan.

## 1. El espacio — header, footer, navbar y logo (regla: SIN líneas)

**Decisión de la owner:** header y footer NO se definen con líneas — son parte del espacio. **Y vale para toda la UI (D11):** separación por aire y escala, no por bordes; esquinas casi rectas (radius ≤ 2px) — el redondeo tipo plantilla IA está prohibido.

| Pieza | La regla | Cómo se ve |
|---|---|---|
| **Header** | No es una barra: es el **arranque del contenido**. Sin border-bottom, sin fondo distinto, sin caja. El wordmark vive en el flujo tipográfico. | "KHAL" (serif, 17px) arriba a la izquierda; al lado, "estudio de pestañas · VL" en mono chiquito. Nada más. El contenido empieza debajo con aire, no con una línea. |
| **Navbar clienta** | **No existe** — khal es un flujo lineal (catálogo → detalle → reservar → seña), no un sitio de secciones. "Atrás" es tipográfico ("← volver"), parte del texto. Cero píldoras, cero menú hamburguesa. | En desktop igual que móvil: la app se recorre, no se navega. |
| **Footer** | Es el **cierre tipográfico del espacio**: sin border-top, sin caja gris. La transición es el **wordmark KHAL gigante fantasma** (regla #5 del taste doc: tipo gigante casi invisible como textura) y debajo la fila de contacto en mono chico. La jerarquía la hacen la escala y el aire — no las líneas. | …contenido → aire generoso → **KHAL** (fantasma, 120px+) → "Instagram · WhatsApp · Vicente López · Políticas" (mono, gris). |
| **Logo** | No hay logo-asset dibujado: **el wordmark es el logo**. Fuente de marca: **TAN Nightingale** (TanType, art-déco) — LICENCIADA por la owner, archivos en `docs/brand/fonts/` (.otf/.ttf/.woff2). Cableada como @font-face local en el demo y lista para la app (apps/web la sirve desde public/fonts en la implementación). Favicon/OG: monograma K. | Header 17px · footer fantasma 120px+ · favicon K. La compra es de la owner/clienta ($17, descarga inmediata). |
| **Barras flotantes** (CTA sticky, APROBAR) | Distinto caso: son **superficies funcionales** que flotan SOBRE el espacio — pueden tener su borde, pero se integran con el fondo de la página y el safe area de iOS (D8). | La excepción que no es header ni footer: aparecen, cumplen, se van. |

Aplicado ya al board: el border-top del footer de la home se eliminó.

## 2. Mapa de fuentes — de dónde sale cada elemento (canon de flota)

Regla madre (skill frontend-component-canon): **jamás inventar un componente que ya existe; jamás hand-craft un efecto que una lib mantiene.** Todo aterriza como **código propio** (copy-in) con los tokens de DESIGN.md.

| Elemento de khal | Fuente | Nota |
|---|---|---|
| Botones, inputs, tabs, checkbox, select, diálogos, tabla, toasts, sheet/drawer | **shadcn/ui** | La base de khal YA es shadcn (stack del proyecto) — extender, nunca hermanar |
| Date pickers (bloqueos, alta manual, "sumar turno") | **react-day-picker** (vía shadcn Calendar) | Solo para ELEGIR fechas, no para la agenda |
| Iconos | **lucide-react** | Un solo trazo en toda la app — nunca mezclar sets |
| Motion | **Motion** (ex-Framer) + los presets que trae cada pieza | Nunca hand-roll lo que ya viene |
| **Fondo interactivo + acentos wow** | **React Bits** (vía 21st.dev / reactbits.dev) | CLI público sin API key para react-bits (`npx shadcn@latest add @react-bits/…`); el MCP `t21st` es de 01-frontend para el marketplace completo |
| Glass real (si entra en admin flotante) | **liquid-glass-js** (WebGL2, fallback CSS) | Solo superficies chicas (criterios iOS D8) |
| Ilustraciones (si hacen falta) | **Kitbitz** (hand-drawn) | Misma vena que la flota |
| **Identidad propia** (nadie más la tiene): portada editorial, filas de servicio, recibo de seña, pass de estado, week view, cola con countdown | **Construcción propia** sobre primitivas | Lo que hace que khal sea khal — acá está la firma, no en un lib |

## 3. El fondo interactivo — DECIDIDO por la owner + su clienta (2026-10-20)

**Elegido: `flow-gradient-hero-section`** — https://21st.dev/@hardikkashiyani123456788/components/flow-gradient-hero-section

**Verificado del bundle real (2026-10-20):**
- Gradiente líquido en **three.js** (canvas WebGL completo) + **grano fino en shader** + tipografía kinética (en khal será el wordmark)
- Movimiento: flujo por tiempo (`u_time`, lerp/mix/smoothstep) — los colores se mezclan solos, sin interacción obligatoria
- **Interactivo en PC y teléfono — confirmado en el código**: `pointermove`, `mousemove`, `touchmove`, `pointerdown` registrados
- **Modo claro y oscuro nativos** (parámetro de tema con paletas por modo) + trío de colores del shader: rojo profundo / verde brillante / azul intenso
- Capturas de referencia: `docs/audits/skeletons-v2-audit/fondo-elegido-*.png` (claro/oscuro × PC/teléfono)

**Lo que agregamos nosotros (la parte khal):**
- **Toggle claro/oscuro visible** — "el poder elegir": sol/luna tipográfico (lucide) arriba a la derecha del header, SIN caja (regla §1), persiste en el dispositivo, default = el del sistema
- Default = EL MISMO look que eligieron (colores, movimiento, responsivo); los tokens de khal solo ajustan si la owner lo pide
- Perf iOS (D8): calibración de densidad/velocidad en el teléfono real + pausa fuera de pantalla + `prefers-reduced-motion`

**Distribución del fondo por app (D12/D13):** el flow-gradient SOLO en la app clienta, **modo oscuro por defecto** (claro por toggle). El ADMIN queda con **fondo sólido oscuro, sin animación** (presupuesto de recursos del teléfono de la dueña); fase 2 del admin: una imagen estática con blur encima del sólido.

**Flags honestos para la implementación (van al plan):**
- **License: unknown** — verificar ANTES de cerrar. Fallback con look idéntico y licencia limpia: shadergradient o paper-design/shaders MeshGradient (repos verificados en premium-frontend-effects)
- Instalación vía MCP `t21st` de 01-frontend (API key) — el código aterriza como fuente propia en el repo
- three.js en iOS: gate de QA de framerate en el iPhone 12 Pro real

(La shortlist previa de React Bits queda descartada — la owner llegó con la elección hecha junto a su clienta.)

## 4. El calendario del admin — pensado ahora, no "ya veremos"

**Por qué es difícil en general:** las libs de calendario (react-big-calendar, FullCalendar) son 100KB+ de peso, con look propio imposible de vestir de editorial, y khal necesita el 10% de sus features (una sola profesional, sin recursos, sin drag-resize de Outlook). Personalizarlas cuesta más que construir.

**La decisión:**
- **Week view PROPIO** construido sobre primitivas — **el skeleton 08 ES la spec**: columnas de días, chips de turno con estados (▪ confirmada · ▫ pendiente · rayado bloqueado), UNA sola fuente de verdad (la misma API de slots que ve la clienta). Un componente liviano, con el look de khal.
- **react-day-picker (shadcn)** solo donde hay que ELEGIR una fecha: bloqueos, alta manual, "sumar turno".
- **Móvil:** el mismo week view con tira mini + swipe día a día (patrón del skeleton) — cero lib extra.
- **Lo realmente difícil ya está resuelto en el backend:** disponibilidad, solapamientos y la regla de las 12 h viven en la lógica de `create_booking` (FOR UPDATE + overlap + idempotencia). La vista **solo muestra estados** — no reinventa nada.

## 5. Coherencia — la regla que ata todo

1. Todo componente externo aterriza como **código propio**, tokens a DESIGN.md, verificado **light/dark + PC/móvil** antes de cerrar (pipeline de flota).
2. Una familia tipográfica · una paleta con **UN acento por modo** · un solo set de iconos.
3. **Máx 1 "spell" por pantalla** — el delight tiene presupuesto (el fondo interactivo YA es el spell de las pantallas clienta: nada más compite).
4. Este doc + el board = **contrato**: si un elemento no está acá, no entra sin propuesta a la owner.
