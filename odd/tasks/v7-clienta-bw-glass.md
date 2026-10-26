# v7 clienta — blanco/negro + glass iOS (preview v7 aprobado)

Branch: feat/v7-clienta-bw-glass · Strategy: single-PR (merge a main al cierre) · Runner: vitest + playwright · Deploy: Vercel git-integration on main.

## Specs

- S1 (dueña, verbatim): "la marca de la clienta es practicamente blanco/negro. el unico touch de color que le estamos dando es ese fondo animado… y el estilo de iOS de efecto glass en los componentes con bordes redondeados y fondo blur en las tarjetas" + "si quieres por el momento deja el fondo negro/blanco (para modo oscuro y claro)". UI = B/W monochrome en ambos modos; fondo plano #0d0d0d dark / #f6f4f1 light. Sin fondo animado esta ronda (mesh/hero se retiran; el bundle aprobado queda como referencia en docs/ux-flows/fondo-demo-khal.html).
- S2 Home = linktree (v7 aprobado): wordmark "Khal" (TAN) + tagline "tu mirada, nuestra prioridad" + 4 botones: "Agendá tu turno" (píldora sólida), "Catálogo", "Conocenos", "WhatsApp ↗". Precios NO en el home.
- S3 Catálogo = "solo vamos a poner fotos": grilla 2 col, foto 4/5 + nombre, tap → detalle. Precios viven sólo en el detalle.
- S4 Conocenos (nuevo): texto del estudio + redes (Instagram/TikTok/WhatsApp) — "vamos ahí a poner las redes después".
- S5 Servicio: foto (slot hasta fotos reales), descripción, TOTAL en grande (mono), duración, seña. Sin "el resto al llegar".
- S6 Reservar: day strip chips + barra deslizante 1px "delicada", horarios de hora en hora (duración 1h), "¿Sumás algo más?" — extras compatibles SIN carrito (perfilado +$18.000, kit +$5.000), total vivo. Botón "Confirmar reserva" (la mecánica de 12h nunca visible para la clienta).
- S7 Seña: "$10.000 fija en todos los servicios" (dueña) — data change, no code.
- S8 Duración: "pongamos duracion del servicio 1hs hasta la confirmacion" — data change, no code.
- S9 Recibo: "Tu turno está reservado" sin ✓; alias y CBU con botón copiar; sin "resto al llegar".
- S10 Estado: link personal único (sin búsqueda). 4 estados con statusbox y data box del mismo ancho, centrados: pendiente (cuenta + 3 pasos numerados), confirmado (recordatorios NUMERADOS 1-4: notificación el día del turno, llegar a tiempo, sin maquillaje, avisar si trae servicio hecho), no confirmado, cancelado — estos dos cierran con "Si creés que fue un error, escribinos." + "Reservar otra vez".
- S11 Marca de agua footer: "Khal" (K mayúscula, resto minúscula, TAN), completa, sin cortes, sobre el fondo. Footer: instagram · tiktok · whatsapp · políticas.
- S12 Delicadeza (dueña, verbatim): "me gustaria que los botones y espaciados en todo en general fuera un poco mas delicado (sino si parece IA)" — escala del preview v7: linktree 11px/17px padding 13px font; tarjetas r16 p13-14; filas 10px 14px; inputs r12 p10px14px; kickers 8px ls2.5px; chips 8/7px; barra 1px; flechas con aire (11px, ink-42%, padding-left 16px). Radios: D11 2px queda REEMPLAZADO por r16/r12/pill (aprobación explícita del look iOS glass).
- S13 Tipografía: sistema para TODO; TAN Nightingale SOLO wordmark + marca de agua.
- S14 Catálogo real (lista de precios enviada 2026-10-25): Extensiones 8, Cejas 3, Combos 6, Otros 4, Kit 2 precios — seed completo con fotos placeholder.
- S15 (dueña): "hazlo, testealo, chequealo, hay push deploy y vercel" — suite + e2e + CI + merge a main + vercel auto-deploy + verificación live.

Visual spec de referencia: E:/Hermes/scratch/khal-preview-v7/index.html (aprobado "por ahora todo aprobado"). Design system: skill `khal-ui-preview`.

## Tasks

- T1 (S1,S12,S13): tokens B/W + radios 16/12/pill + re-anchor contratos de tokens. Route: inline.
- T2 (S2,S4,S11): home linktree + conocenos + footer. Route: writer.
- T3 (S3,S5): catálogo foto + detalle. Route: writer.
- T4 (S6,S9): reservar + extras + recibo (con copy buttons). Route: writer.
- T5 (S10): estado 4 estados. Route: writer.
- T6 (S6): persistencia extras (migración 0016 addons jsonb + RPC + contracts). Route: writer.
- T7 (S7,S8,S14): data SQL con backup (seña fija, duración 1h, catálogo real). Route: inline.
- T8: e2e rewrite + warmup + contratos + VRT baselines. Route: writer.
- T9: gates + merge + deploy + live check. Route: inline.

## Log

- L1 (2026-10-26): dueña aprueba v7 completo: "por ahora todo aprobado. hazlo, testealo, chequealo, hay push deploy y vercel". Fuente: preview v7 (7 rondas de feedback v1→v7, skills cargadas, registro de gusto aplicado).
- L2: licencia fondo 21st: "unknown" (página oficial) — decisión de la dueña: usarlo con créditos en Políticas cuando se integre; esta ronda va sin fondo animado (B/W).
