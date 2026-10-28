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

- T1 (S1,S12,S13): tokens B/W + radios 16/12/pill + re-anchor contratos de tokens. Route: inline. ✅ e6a37ad
- T2 (S2,S4,S11): home linktree + conocenos + footer. Route: writer. ✅ a06e3f7
- T3 (S3,S5): catálogo foto + detalle. Route: writer. ✅ a06e3f7
- T4 (S6,S9): reservar + extras + recibo (con copy buttons). Route: writer → cierre inline (parent). ✅ 5f5681b (focused 71/71 pre-commit; es/en parity; hook verde)
- T5 (S10): estado 4 estados. Route: writer → cierre inline (parent). ✅ este commit (estado-v7 contract; ver Log L6)
- T6 (S6): persistencia extras (migración 0016 addons jsonb + RPC + contracts). Route: writer → cierre inline (parent). ✅ 0ceefea — 0016 aplicada a prod vía Management API (HTTP 201) + read-back verificado (columna addons live, create_booking 10-arg single overload, ledger 0016) + smoke real por puerta anon (PostgREST: duration_minutes 60, hold_released_at set, addons null en turno real). Gap de ledger de T7 corregido: 0017 no tenía insert en su archivo → fila idempotente añadida; ledger ahora 0017,0016,0015,0014. Backups _backup_*_pre_v7_20261026 verificados; 0016 no toca datos; down restaura 0014/0015 verbatim (contract 10/10).
- T7 (S7,S8,S14): data SQL con backup (seña fija, duración 1h, catálogo real). Route: inline. ✅ migración 0017 aplicada vía Management API + read-back verificado (23 servicios, 23/23 fixed $10k, 23/23 60min, 19 wired al provider nuevo; appointments intactas).
- T8: e2e rewrite + warmup + contratos + VRT baselines. Route: writer. Pendiente (nota para T8: mocks/services.ts aún sirve el catálogo viejo al stub e2e — reconciliar con el catálogo real o dejar el stub como fixture).
- T9: gates + merge + deploy + live check. Route: inline. (Nota T9: los ratchet gates que sólo disparan en default branch nunca corrieron en esta feature branch — correrlos locales antes del merge.)
- T10 (S1,S7,S12, audit-fix): anti-slop pack — seña copy fija $10.000, esmeraldas v1 retiradas (OG + ::selection), error/404/pago del template default a B/W glass. Route: inline (parent orchestrator). ✅ fc4a8db + 09b3a8c + fee7ce1

## Log

- L1 (2026-10-26): dueña aprueba v7 completo: "por ahora todo aprobado. hazlo, testealo, chequealo, hay push deploy y vercel". Fuente: preview v7 (7 rondas de feedback v1→v7, skills cargadas, registro de gusto aplicado).
- L2: licencia fondo 21st: "unknown" (página oficial) — decisión de la dueña: usarlo con créditos en Políticas cuando se integre; esta ronda va sin fondo animado (B/W).
- L3 (26/10 ~16:30): dueña: "ok, prosigue con t4, t5 y tg" — retomada de T4-T6 con el tree a medias de los writers de la madrugada. Estado al retomar: suite 341/341 verde, typecheck 8/8, lint 0 warnings, pero todo sin commitear y 0016 sin aplicar.
- L4 (26/10 19:14): T6 cerrado — 0ceefea. 0016 aplicada a prod vía Management API (HTTP 201) + read-back. Anon-smoke PostgREST sobre turno real confirma la forma v2 (el turno muestreado resultó ser un hold auto-liberado: status=cancelado + hold_released_at — exactamente el caso que S10 debe distinguir). Suite completa 341/341 + typecheck 8/8 + lint 0 warnings antes del commit; hook verde (gitleaks limpio).
- L5 (26/10 19:18): T4 cerrado — 5f5681b. Focused 71/71 (payment-step, payment-settings, sena-receipt, a11y-p2, i18n-parity, 0016-contract, booking-input, duration) inmediatamente antes del commit; hook verde.
- L6 (26/10 19:2x): T5 cerrado — este commit (estado-v7 contract). DESIGN.md re-anclado a la identidad B/W v7 (compañero tardío del trabajo de tokens de T1) viaja acá. Pendiente: T8 (e2e) y T9 (gates+merge+deploy+live check).
- L7 (26/10 03:13): T10 cerrado — lote autorizado por la dueña ("ok, sigue con todo"), surgido de la auditoría read-only anti-slop (Engram khal/anti-slop-audit-v7). Commits: fc4a8db (depositBody es/en → seña fija $10.000, S7), 09b3a8c (OG tagline #6ee7b7 → ink 68%; ::selection esmeralda → ink-invert por modo; nota del addendum DESIGN.md en la misma unidad), fee7ce1 (error.tsx + not-found.tsx del template slate default a tokens B/W glass con pills 17/11/13 y kicker mono en 404; pago-result sin verde semántico en exito, pendiente/error conservan status-pending/danger). Gates: suite 341/341 (22.3s), tsc apps/web exit 0, eslint 0 warnings en los .tsx tocados, hooks verde (gitleaks + lint-staged). Scanners post-fix: impeccable detect 0 anti-patterns, validate-tokens sin hex (solo 2 breakpoints 640px conocidos), designmd lint 0 errors. Canvas: se mantiene #000000 shippeado + vidrio light ink-4% (interpretación "como esté" del "sigue con todo"; S1 decía #0d0d0d — flip futuro = 1 work unit con re-anchor del test). Nota: gate full-repo typecheck+lint no completó en esta sesión (E: I/O lenta, timeout 420s) — T9 corre los gates completos antes del merge.
