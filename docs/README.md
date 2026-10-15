# KHAL — docs/ (baseline verificada 2026-09-15 · índice y paths re-sincronizados 2026-10-15)
> Relacionados: [[docs/proyectos/khal|khal]] · [[Hub-Proyectos]] · [[INDICE-PLANS]] · [[ESTADO-FLOTA-2026-09-14]]

> Solo documentación. No se tocó código. Todo lo afirmado sale de lectura
> estática del repo en `E:/Hermes/projects/khal` (README, `docs/`, `odd/tasks/`,
> `apps/web/src`, `packages/*`, `supabase/migrations`). Lo no comprobado
> contra DB viva / deploy real se marca **UNVERIFIED**.

## Índice

| Doc | Qué cubre |
|---|---|
| [01 — Qué es](01-que-es.md) | Qué es KHAL, para quién, propuesta de valor |
| [02 — Arquitectura y stack](02-arquitectura-stack.md) | Cómo se arma: monorepo, apps, packages, framework/stack, datos |
| [03 — Funciones](03-funciones.md) | Funciones web pública + admin + automatizaciones |
| [04 — Branding e identidad visual](04-branding-identidad.md) | Branding, identidad visual, tokens, componentes |
| [05 — Marketing y tono](05-marketing-tono.md) | Marketing, i18n es/en, tono es-AR, copys clave |
| [06 — Estado y gates](06-estado-gates.md) | Baseline medida, gates bloqueantes, gaps, próximos pasos (re-baseline 2026-10-15) |
| [ADR-0001 — Auth provisoria → JWT](adr/ADR-0001-auth-provisoria.md) | Admin auth: cookie mock → Supabase JWT claims (aplicada) |
| [ADR-0002 — Pagos dual](adr/ADR-0002-payment-dual-flow.md) | MP checkout + transferencia manual como flujos oficiales |
| [ADR-0003 — E2E stub](adr/ADR-0003-e2e-supabase-stub.md) | E2E contra stub determinista, no DB viva |
| [ADR-0004 — Build/CI infra](adr/ADR-0004-build-ci-remote-cache.md) | Remote cache OIDC, knobs de build, turbo --affected |

## Fuentes canónicas (ya existían, no se duplican)

- `README.md` — quickstart + gates en la raíz.
- `docs/` — auditorías y guías operativas:
  `auditoria-nocturna-2026-09-12.md`, `reporte-producto-marketing-estilo-2026-09-12.md`,
  `auditoria-a11y-tono-es-ar-2026-09-14.md`, `supabase-migration.md`,
  `automations.md`, `ADR-0001-auth-provisoria.md`.
- `openspec/changes/virtual-agenda/` — proposal, design, specs por capacidad.
- `plan-accion-2026-09-12.md` — fases y gates con dueños.
- `SECURITY.md`, `CHANGELOG.md`.
