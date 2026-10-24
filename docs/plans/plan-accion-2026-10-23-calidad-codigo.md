# Plan de acción — Calidad de código khal (2026-10-23)

> Contexto: las fotos de la dueña están pendientes → el deploy visual espera. Mientras
> tanto, este plan maximiza la cobertura de calidad del código. Basado en inventario
> REAL verificado hoy (no de memoria): scripts de package.json, config ESLint,
> workflows de CI, devDependencies.

## Estado real (verificado 2026-10-23)

### ✅ Lo que YA está activo y defendiendo el repo
| Capa | Herramienta | Estado |
|---|---|---|
| Hook pre-commit | husky 9 + lint-staged 17 (eslint --fix + prettier) + **gitleaks** | ✅ activo (vió acción hoy) |
| Lint | ESLint 9 flat config: @eslint/js + typescript-eslint + **react-hooks v6** + prettier config | ✅ activo, `--max-warnings 0` |
| Formateo | Prettier 3 (+ plugins organize-imports y tailwindcss) | ✅ activo |
| Tipos | TypeScript `strict: true` + turbo typecheck 8/8 | ✅ activo |
| Unit | Vitest — 43 archivos / 311 tests (incluye contratos de a11y, i18n, migraciones) | ✅ verde |
| E2E | Playwright — happy path + theme (5 pantallas cubiertas) | ✅ verde |
| CI | lint + typecheck + format:check + unit (affected) + E2E | ✅ verde en cada push |
| Otros workflows | semgrep.yml (SAST), visual-tests.yml, megalinter.yml, design-qa.yml | ✅ existen |

### 🧟 Lo instalado pero PRENDIDO A MEDIAS (el hallazgo del día)
| Herramienta | Realidad |
|---|---|
| **eslint-plugin-security, sonarjs, jsx-a11y, import, promise, unused-imports** | En devDependencies — **la config ESLint no los importa** = zombis |
| **knip** (código muerto) | Script `pnpm knip` existe — **no corre en CI** |
| **jscpd** (copy-paste) | Script `copy-paste:check` — **no corre en CI** |
| **cspell** (ortografía) | Script `spell:check` — **no corre en CI** |
| **biome:scan** | Script suelto — experimento sin decisión tomada |

### ❌ Lo que falta directamente
| Hueco | Impacto |
|---|---|
| Sin `@vitest/coverage-v8` | Nadie sabe qué % del código cubren los 311 tests |
| Sin `@axe-core/playwright` | a11y cubierto por contratos de código, pero **nadie escanea el DOM real renderizado** |
| Sin gate de dependencias | `pnpm audit` no corre en ningún lado |
| Sin bot de actualización de deps | (verificar si existe dependabot.yml) |

---

## El plan — 4 fases

### FQ1 — Prender los zombis (ESLint a full poder)
**Objetivo:** los 6 plugins instalados pasan de decoración a defensa real.
- Importar en `eslint.config` con presets `recommended` (no "all" — sin ruido):
  `security` (detección de patrones inseguros), `sonarjs` (complejidad/bugs),
  `jsx-a11y` (refuerza lo que hoy sólo cubren contratos), `import` (imports rotos),
  `promise` (promesas mal manejadas), `unused-imports` (limpieza automática).
- Corregir todo lo que salga (en branch, suite como red de seguridad).
- **Criterio de aceptación:** `pnpm lint` verde con los 6 plugins activos + suite 311/311.

**Progreso 2026-10-23 (CIERRE):** FQ1 COMPLETA. Config cableada (6 plugins;
jsx-a11y e import hand-wired por versiones pre-flat). Primera corrida: 166
hallazgos → 105 FPs de zonas de test resueltos con el bloque documentado
"trusted tooling" + todo-tag off + redundant-type-aliases off en packages/types.
Los ~61 hallazgos reales se cerraron en tres pasadas: (1) primer writer: 21
fixes + 8 disables justificados; (2) regla de la dueña (5 intentos antes de
cualquier disable) aplicada RETROACTIVAMENTE: unit A re-atacó los 8 disables y
los 16 residuales — **16 fixes REALES, 0 disables sobrevivientes** (rename
Error→RouteError, extracción de pasos nombrados en el webhook de MP, exhaustive
switches y Map tipado en las 8 object-injections, regex lineal equivalente
probada en corpus de 342 líneas); (3) unit B: 8 imports de tests al tope
(6 archivos). Pasada de seguridad de workflows de regalo (GHA-001: PR Agent
con trigger por comentarios de cualquier usuario + OPENAI_KEY + token con
contents:write → guard OWNER/MEMBER/COLLABORATOR + permiso recortado;
resto de workflows verificados limpios). Gate final del pariente: lint 0 +
typecheck 8/8 + suite en corrida. Deuda del vendored script
(validate-tokens.cjs) saldada en la FUENTE del skill (uupm-design-system) y
re-espejada — source y copia sincronizados.

### FQ2 — Gates de CI (que nadie pueda romper lo que ya está bien)
**Objetivo:** knip, jscpd y cspell dejan de ser opcionales.
- Correr los 3 hoy, arreglar lo rojo (baseline verde primero).
- Agregarlos como job "Quality Gates" en ci.yml (bloqueante tras el baseline).
- Agregar `pnpm audit --prod` (o `--audit-level=high`) al mismo job.
- Verificar/crear dependabot.yml (updates semanales de deps).
- **Criterio de aceptación:** CI rojo si entra código muerto, copy-paste, typo o CVE alto.

### FQ3 — Cobertura medible + a11y del DOM real
**Objetivo:** saber qué tan bien cubiertos estamos y escanear lo que la clienta ve.
- Instalar `@vitest/coverage-v8`, medir el % actual → fijarlo como **piso** (ratchet: el piso sube, nunca baja).
- Instalar `@axe-core/playwright` → el e2e del happy path escanea las 5 pantallas con 0 violaciones serias (critical/serious).
- **Criterio de aceptación:** reporte de coverage con piso enforcado + axe scan verde.

### FQ4 — (re-scopedada por la dueña: "¿no vale la pena en paralelo?") Biome como escáner PARALELO
**Objetivo:** dos pares de ojos > uno. Biome NO reemplaza a ESLint — corre AL LADO, en su territorio exclusivo.
- Wire `biome:scan` (el script YA existe) como job de CI: primero informativo (baseline de qué encuentra), luego decidir si bloquea.
- Territorio de Biome: sus reglas exclusivas (noSvgWithoutTitle, useTopLevelRegex...), lint de CSS/HTML/GraphQL (ESLint no puede), y una segunda opinión general con la config recommended.
- Territorio que le PROHIBIMOS duplicar: react-hooks (brecha v6/v7 confirmada) y todo lo que los 6 plugins ESLint ya cubren — ESLint queda como fuente de verdad de esos dominios.
- Medir en CI: tiempo de biome scan vs eslint — los números alimentan la decisión futura de migración (si algún día oxlint/Biome 3 cierra la brecha de hooks, la migración se evalúa con datos).
- **Criterio de aceptación:** job de Biome corriendo en CI sin falsos positivos duplicados + métrica de tiempo documentada.

### FQ6 — (agregada por decisión de la dueña: "mientras sea gratuito, costéalo") Blindaje de los datos de plata
**Objetivo:** las funciones que tocan dinero y turnos pasan de "bien testeadas" a "matemáticamente probadas".
- **Mutation testing Scoped** (Stryker) SOLO sobre `packages/utils` (formatCents y las funciones de dinero — el código que calcula la seña): si un mutante sobrevive, el test tiene un agujero. Corre en CI (gratuito, ~5 min); nunca local (el disco haría eterna la corrida).
- **Property-based tests** (fast-check, gratuito): formatCents/deposit-math/slot-computation bajo miles de entradas aleatorias — el redondeo del peso argentino ($13.500,00 con NBSP) queda a prueba de valores extraños.
- **SBOM en el release** (cyclonedx, gratuito): el inventario de dependencias nace como artifact de cada release — cero runtime, listo para cuando un cliente enterprise lo pida.
- **semgrep más fuerte** (gratuito): subir `p/security-audit` de informativo a BLOQUEANTE + sumar `p/owasp-top10`.
- **Criterio de aceptación:** mutantes de money 0 sobrevivientes (o justificados), property tests verdes en CI, SBOM en artifacts del release, semgrep bloqueante verde.

### FQ5 — (agregada tras auditoría de cobertura 2026-10-23) Performance de la demo
**Objetivo:** que la demo no sólo funcione bien sino que VUELE — el performance ES argumento de venta.
- **Lighthouse CI** en el deploy preview: gate de scores (performance, a11y, best-practices, SEO) con piso realista en móvil (la clienta reserva desde el teléfono).
- **Presupuesto de bundle** (size-limit): que nadie duplique el peso del JS sin que CI lo note.
- **Criterio de aceptación:** Lighthouse en el pipeline con pisos + size-limit en CI.

### FQ7 — (nacida de la revisión de la dueña + investigación 2026-10-23) pgTAP: las RLS a prueba de fuego
**Objetivo:** pasar de LEER las políticas de seguridad (contratos) a DISPARARLAS de verdad. Hallazgo clave: el CLI de Supabase trae pgTAP integrado (`supabase test db`) — corre los tests contra el stack local REAL (con schema auth, roles y RLS de verdad), no un Postgres plano. Es el camino oficial de Supabase y es gratuito.
- Workflow `db-tests.yml`: `supabase db start` (aplica TODAS las migraciones) + `supabase test db` en cada PR — público ⇒ minutos de CI ilimitados.
- Tests de los CUADRANTES DE NEGACIÓN (el 80% del valor): la clienta A no puede leer/escribir los turnos de la clienta B; el anónimo no ve NADA salvo la puerta `get_booking_status`; el dueño del turno no puede cambiar el `organization_id`.
- El test META de oro para un repo operado por agentes: **"ninguna tabla pública puede quedar sin RLS"** — un solo query que falla el día que cualquier agente crea una tabla y olvida `enable row level security`.
- **Criterio de aceptación:** workflow verde + cuadrantes de negación para appointments/clients/services/global_settings + el meta-RLS test. Los contratos de migración existentes quedan como primera capa (fuente) y pgTAP como capa de ejecución.

---

## Qué NO incluimos (y por qué)

> Re-triage final 2026-10-23: CodeQL PASÓ a activo (khal es público — workflow
> `codeql.yml` con security-extended); pgTAP pasó a la FQ7 (el CLI de Supabase
> lo trae integrado — mi "imposibilidad técnica" aplicaba a Postgres vanilla,
> no al stack local de Supabase); mutation-scoped, property-based y SBOM viven
> en FQ6; k6 smoke post-deploy. Los que siguen tienen razón DURA.

| Opción | Por qué no |
|---|---|
| **Migrar a Biome como REEMPLAZO ahora** | Brecha react-hooks v6/v7 confirmada. PERO: Biome entra YA como escáner PARALELO (ver FQ4 re-scoped) — su territorio exclusivo (CSS/GraphQL/sus reglas propias) sin tocar el dominio de ESLint. |
| **Cobertura 100% como meta** | Demo-stage: el piso actual con ratchet es honesto; 100% fabrica tests basura. |
| **Presets ESLint "all"** | Ruido que mata la señal: recommended + reglas puntuales. |
| **Cambiar husky/lint-staged/gitleaks** | Funcionan y defendieron el repo HOY (2 bugs atrapados). |
| **Mutation testing a TODO el repo HOY** | Con repo público los minutos de CI son ilimitados y Stryker es Apache 2.0 — así que ya NO es un "no" para siempre: FQ6 arranca scoped a la plata, y el repo entero queda habilitado como expansión post-FQ6 (es cuestión de tiempo de corrida, no de plata). |

## Passes puntuales (gratuitos, en la cola de cierre)

| Pass | Cuándo |
|---|---|
| **UX hostil** (recorrer la demo como clienta furiosa/envidiosa/apurada) | Post-deploy, contra la demo online — pulido pre-venta |
| **k6 smoke** (10 usuarios virtuales × 30s, gratuito) | Post-deploy — valida cold-start bajo cortesía |
| **Revisión de seguridad de los workflows** (semgrep no escanea .github/workflows) | Ya — arranca apenas el writer de FQ1 libera el disco |

## Módulos dormidos — la convención (dueña, 2026-10-23)

El **dual flow de Mercado Pago** (acción de checkout, webhook HMAC, páginas /pago)
está DORMIDO por decisión explícita de la dueña: no se conecta, no se borra, no
se "arregla por gusto". Su valor real es ser el **template de referencia para
replicar en ventas futuras** (otro estudio con MP habilitado arranca de acá).

Regla para todo módulo dormido:
1. **Documentación en el propio módulo**: un header que diga qué es, por qué
   está dormido, quién lo decidió, y que está PROHIBIDO marcarlo como código
   muerto en los barridos (knip: los módulos dormidos con tests vivos NO son
   dead code).
2. **Los hallazgos de lint en módulos dormidos** se resuelven en este orden:
   (a) si el fix mejora el VALOR DEL TEMPLATE para replicar (legibilidad,
   pasos nombrados, auditabilidad) → hacer el refactor real — es exactamente
   el caso del webhook 2026-10-23; (b) si el fix no agrega valor de
   replicación → disable documentado con los 5 intentos, sin inversión extra.
3. **Tests vivos obligatorios**: un módulo dormido sin tests no es un template,
   es una trampa. El dual flow mantiene sus 16 tests siempre verdes.

Estado del dual flow tras FQ1: webhook refactorizado a pasos nombrados
(verifySignature / parseEvent / ...) SIN cambio de comportamiento — el
template quedó más legible para replicar. Conexión: NUNCA mientras la dueña
no lo re-decida.

## Cobertura verificada tras la auditoría (2026-10-23)

Los siguientes gates YA existen y corren — verificados leyendo los workflows reales, no de memoria: gitleaks (pre-commit **Y CI**), dependabot.yml, megalinter (batería completa + reportes como artifacts), VRT con baselines nacidas en CI (imagen oficial Playwright), changesets + release con deploy preview a Vercel, CODEOWNERS, semgrep con 4 rulesets bloqueantes.

## Qué se mantiene / qué se reemplaza
- **Se mantiene TODO el esqueleto actual** (husky → lint-staged → gitleaks/eslint/prettier + CI turbo affected).
- Este plan **sólo AGREGA**: nada de lo existente se reemplaza en FQ1-FQ3.
- La única decisión de reemplazo potencial (lint por oxlint) queda para FQ4, con datos.

## Riesgo
| Riesgo | Mitigación |
|---|---|
| Los 6 plugins tiran una avalancha de errores nuevos | Fase aislada en branch, una fase = un commit, suite 311 como red |
| knip/jscpd rojos por trabajo antiguo | Baseline primero, gates después |
| El disco lento hace inusable el pre-commit | Es el argumento de FQ4 — se mide, no se sufre |

## Orden de ejecución
FQ1 → FQ2 → FQ3 (inmediatas, mientras esperamos las fotos) → merge+deploy de la F2
→ FQ4 post-demo. Cada fase = 1 unidad de trabajo con su commit y verificación.
