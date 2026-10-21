# Auditoría UI — Khal v2 (pre-skeletons) — anti-patrones "hecho con IA"

> **Búsqueda:** keywords: `khal, auditoría, anti-ia, skeletons v2, header, footer, home, reservar, anti-patrones` · clasificación: `auditoría-ux` · estado: `canónico` · actualizado: 2026-10-20

## Método
Dev server local (`next dev`, `apps/web`), capturas Playwright en 2 viewports (móvil 390×844, desktop 1366×900). Fondo animado de partículas removido por captura con OK de la owner (2026-10-20: "borrar el fondo animado y ponerlo totalmente negro" — decisión registrada también como dirección de piel v2). Extracción DOM + wireframes 2026-10-17 como fuente de las pantallas que requieren datos (catálogo vacío en dev — ver hallazgo operativo). Visión del perfil no disponible hoy (key diaria agotada) — la lectura visual queda para la owner con los PNGs; el análisis estructural es DOM/código.

## Evidencia (capturas en esta carpeta)
- `home-movil.png` / `home-desktop.png` — home con catálogo vacío
- `politicas-movil.png` / `politicas-desktop.png` — página de políticas
- `reservar-movil.png` / `reservar-desktop.png` / `servicio-*.png` — 404 (sin servicios en dev, ver abajo)
- `confirmacion-wireframe.png` / `admin-dashboard-wireframe.png` — wireframes 17/10 como referencia de estructura
- `servicio-detalle` y `reservar`: estructura extraída del HTML wireframe (nav → img grande → título → texto → lista → CTA bar → footer / fecha-grid → slot-grid → datos)

## Anti-patrones concretos (por qué "se ve hecho con IA")

| # | Patrón | Dónde | El problema |
|---|--------|-------|-------------|
| 1 | **Fondo de partículas generativas** | Todas las páginas | El "tell" clásico de IA (canvas de puntitos flotando). Owner OK'd su eliminación — canvas negro puro. |
| 2 | **Stack centrado estadístico** | Home | Kicker + H1 + subtítulo centrados, apilados — el promedio estadístico de todo AI landing. Cero asimetría deliberada. |
| 3 | **Grilla de cards uniforme** | Home (catálogo) | `grid-cols-12` → fila de cards idénticas sin jerarquía ni ritmo. Sin celda destacada, sin número exacto pensado. |
| 4 | **Header utilitario genérico** | Todas | Wordmark "Khal Studio" aislado en la barra — sin tratamiento tipográfico, sin firma. Es un navbar default, no una pieza editorial. |
| 5 | **Footer de una línea volcado** | Todas | "Khal · Pestañas · Vicente López \| Políticas \| Instagram \| WhatsApp" — links planos apilados. Las redes sociales como texto suelto, sin diseño ni jerarquía. Es exactamente el "utility dump" que la owner marcó. |
| 6 | **Detalle = template e-commerce** | servicio-detalle | Columna única centrada: imagen grande → título → texto → lista → CTA sticky. Ficha de producto genérica de tutorial. |
| 7 | **Reservar = 3 grillas apiladas** | reservar | Fecha-grid + slot-grid + form, todo centrado y uniforme. Funciona (progresivo) pero sin pensamiento de distribución — tres bloques iguales. |
| 8 | **Cero personalidad tipográfica** | Global | Solo system font. Sin serif editorial, sin escala dramática, sin textura tipográfica — el look "dark SaaS template". |
| 9 | **Empty state plano** | Home (catálogo vacío) | "Todavía no hay servicios disponibles. Volvé pronto." — texto pelado. Un estado vacío es un momento de diseño, no un blankspace. |

## Lo que SÍ está bien (se conserva en v2)
- Sticky CTA bar con precio a la izquierda y botón a la derecha (servicio-detalle)
- Secciones progresivas 1·Fecha → 2·Horario → 3·Datos (concepto correcto, distribución a rediseñar)
- Skip-link "Ir al contenido" (a11y real, no decorativo)
- Copys en voseo rioplatense correctos
- Bilingüe es/en y arquitectura de rutas limpia
- 404 funcional con "Ir al inicio"

## Hallazgo operativo (no UX — flag para la dueña)
**El catálogo aparece VACÍO en dev** ("Todavía no hay servicios disponibles"). Los mocks fueron removidos al pasar a Supabase real. Si producción muestra lo mismo, la dueña necesita cargar sus servicios desde el panel admin (o verificar si el query falla en silencio). **Pendiente confirmar con la owner qué se ve en la URL productiva.**

## Dirección que surge de esta auditoría (puente a T2)
- Canvas **negro puro** (owner OK) — sin partículas. El "fondo dinámico" pasa a ser una variante opcional del board, no un default.
- La piel v2 (post-skeletons): **glass + tipografía editorial sobre negro sólido** — paleta "editorial crudo" (negro/blanco/rojo) del moodboard de la owner.
- Skeletons con `layout-composition`: referencia real primero, primitivas (Stack/Cluster/Sidebar/Cover/Reel), anti-repetición, y UN momento de contraste por pantalla.
