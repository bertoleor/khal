# Referencias por pantalla — Khal skeletons v2 (reference-first)

> **Búsqueda:** keywords: `khal, referencias, distribuciones, skeletons v2, fresha, booksy, linear, editorial` · clasificación: `ux-references` · estado: `canónico` · actualizado: 2026-10-20
> Parte de: [[AUDIT|docs/audits/skeletons-v2-audit/AUDIT.md]] · Alimenta: T5 (clienta) y T6 (admin) de `odd/tasks/khal-ux-skeletons-v2.md`
> Regla (layout-composition): antes de dibujar cada pantalla, 2-3 referencias REALES con la distribución dicha en una línea. El promedio estadístico (stack centrado + cards iguales) está PROHIBIDO — el catálogo anti-patrones vive en AUDIT.md.

## Fuentes vivas
- **godly.website** (extraído 2026-10-20): "Portfolio Homepage Layout", "N233 Agency Hero", "GPGPU Jelly Glass" — editoriales actuales, barra alta.
- **land-book.com** (extraído 2026-10-20): filtros de estilo "Black & White / Big Type / Serif" como familia validada — la editorial cruda del moodboard existe como categoría.
- **designspells.com** (llms.txt leído; homepage con challenge anti-bot para curl): hechizos de micro-interacción por tag — se consulta al definir el delight (max 1 por pantalla, fase piel).
- **awesome-design-md local** (84 refs en el pool): `linear.app`, `mercury`, `wise` para admin denso; `theverge`/`wired` para editorial.
- **Dominio booking belleza** (Fresha, Booksy, GlossGenius, StyleSeat): distribuciones conocidas del rubro, citadas por pantalla abajo.

## CLIENTA (mobile-first)

| Pantalla | Referencias reales | Distribución (una línea) |
|---|---|---|
| **Home / catálogo** | Fresha salon page · Booksy salon page · godly "Portfolio Homepage Layout" | **Lista de filas, NO grilla de cards**: nombre+duración izquierda, precio derecha; sobre la lista, un cover editorial asimétrico con la tipografía protagonista (kicker offset, no centrado) |
| **Servicio detalle** | Fresha service detail · StyleSeat provider page | Split asimétrico: imagen Frame grande arriba, cluster de datos (duración/precio/seña) desalineado a un costado, strip portfolio como Reel, CTA sticky persistente |
| **Reservar** | Fresha/Booksy pickers · GlossGenius progressive | Se mantiene progresivo (concepto aprobado en audit): **tira de fechas horizontal (Reel, no calendario-pared)** + grilla de horarios como Cluster compacto; al confirmar, resumen + casilla de términos (D1) |
| **Comprobante / seña** | Patrones de transferencia (MercadoPago) + recibo/receipt | **Estilo recibo**: monto ENORME, alias con botón copiar, CTA WhatsApp como única salida visible; la cuenta de 12 h como estado con barra, no como amenaza |
| **Confirmación / estado** | Fresha "You're booked" · Apple Wallet pass | Estado primero (badge PENDIENTE + countdown), detalles como filas de pass, "qué pasa después" en 3 pasos numerados |
| **Términos** | Stripe ToC (el canon de terms legibles) | Columna única legible, items numerados, palabras clave en negrita, sin pared legal; cada término con su ícono propio |

## ADMIN (teléfono-primario — decisión de la owner en revisión T8, 2026-10-20; desktop = versión grande)

| Pantalla | Referencias reales | Distribución (una línea) |
|---|---|---|
| **Hoy / mañana** | Linear (densidad + teclado) · Fantastical day view | **Split asimétrico 60/40**: timeline de agenda a la izquierda, cola de señas pendientes en riel derecho con countdown — nada de grilla de cards |
| **Calendario semana** | Google Calendar week (no se inventa UX de calendario) · Rise/Amie (modernos) | Grilla semana clásica con twist khal: puntos de ocupación, banderas de pendientes, bloqueos rayados |
| **Cola de comprobantes** | Linear Triage/Inbox | Master-detail: lista a la izquierda, comprobante+datos de la clienta a la derecha, acciones Aprobar/Rechazar/Liberar con teclado |
| **Ficha clienta** | Attio/Notion ficha CRM | Cabecera con flags (externo ⚑ / no-shows) como chips de metadata, dos paneles: datos+notas izquierda, timeline de turnos derecha, alta manual protagonista |
| **Catálogo editor** | Shopify product list (canon de CRUD commerce) | Tabla con thumbs, precio y estado, edición inline, handles de orden — cero cards |
| **Configuración** | Vercel/Linear settings | Nav izquierda (Alias, Seña, Redes, Términos, Bot), formularios a la derecha; el editor de términos con preview en vivo de lo que verá la clienta |

## Reglas de composición que aplican a todas (design-taste-frontend + layout-composition)
1. Primitivas primero (Stack/Cluster/Cover/Reel/Frame/Sidebar) — cero CSS one-off por página.
2. Prohibido: fila de 3+ cards iguales · todo centrado · dos secciones con la misma estructura seguidas · zigzag sin tope.
3. Un momento de contraste por pantalla (tipografía gigante casi invisible, número enorme, banda negra) — la firma editorial-luxe en el esqueleto ya.
4. El delight (1 spell max) se decide en fase piel, no acá.

## Hechizos candidatos (a elegir en piel, fuente designspells)
- Copiar alias → feedback "copiado" con micro-animación (EL momento khal, va en comprobante y config)
- Countdown 12 h como tick sutil (estado pendiente)
- Success de reserva: confirmación con un solo movimiento (no confeti genérico)

## D7 — El admin vive en el teléfono de la dueña (owner, T8)
Las 6 pantallas admin resuelven PRIMERO en teléfono: pestañas de un toque (hoy/mañana/señas), calendario deslizable día a día, cola → hoja completa con acciones en zona de pulgar, ficha con tabs + acciones fijas, catélogo lista + botón flotante, settings una sección por pantalla. Desktop queda como la versión grande del mismo contenido.

## D8 — Dispositivo de referencia: iPhone 12 Pro (owner, 2026-10-20)
390×844 pt con notch y home indicator — los frames del board ya son ese tamaño exacto. Implementación iOS (criterios de aceptación T9): safe-area en barras fijas, viewport-fit=cover, 100dvh, targets ≥44pt, motion solo transform/opacity, backdrop-filter solo en superficies chicas, QA en el iPhone real de la dueña antes de lanzar.
