# Changelog — khal

> **Busqueda:** keywords: `changelog, releases, khal` · clasificacion: `changelog` · estado: canonico · actualizado: 2026-10-19

## [Unreleased]
- 2026-09-25: changelog iniciado (P17 doctrina — flota Hermes). Historia previa: ver git log.
- 2026-10-15 (build): knobs de workers Next (`cpus:2` + `webpackMemoryOptimizations`) — build local paralelo 0/2 muerto → 2/2 en 3m15s (8507abf).
- 2026-10-15 (ci): Turborepo Remote Cache via OIDC sin secrets en el repo + `turbo run --affected` con base full-history (1e6cdb1, 72852e7).
- 2026-10-15 (ci): eslint excluye `.worktrees/` — worktree estacionado ya no rompe `pnpm lint` (003d885).
- 2026-10-15 (docs): re-baseline de `06-estado-gates.md` (gates re-evaluados contra estado real), índice de docs re-ruteado a `E:/Hermes/projects/khal`, ADR-0001 reubicada a `docs/adr/` + ADRs 0002 (pagos dual), 0003 (E2E stub), 0004 (build/CI infra).
- 2026-10-15 (web): identidad de marca dark aplicada — aura `BackgroundMesh` en todas las páginas, acento esmeralda, superficies translúcidas oscuras, contratos a11y actualizados a tokens dark (e5ccb3b).
- 2026-10-15 (deploy): release demo producción — autor de Vercel vinculado a la cuenta Git (habilita compliance de Vercel) + merge del release con build knobs, remote cache y re-baseline de docs (f42463a, 30b8201).
- 2026-10-16 (web): catálogo lash 100% (DB viva + seed + mocks + stub), footer social con Instagram oficial (`khal.estudiook`), SEO técnico (robots/sitemap/manifest/OG/favicon), `BackgroundMesh` único global (3491864).
- 2026-10-16 (web+docs): SEO local Vicente López (JSON-LD `BeautySalon` con `sameAs` Instagram, geo metas, localidad en copy) + docs de flota: flujo clienta, flujo admin y guía API + drop del cache stale de eslint en lint-staged (78c15d2).
- 2026-10-16 (design): `DESIGN.md` en la raíz — spec de tokens (formato design.md) para la identidad dark lash + export `tailwind.theme.json` (d2a23a2).
- 2026-10-16 (web): features demo research-driven — página `/politicas` (seña, cancelación, no-show, puntualidad; es+en), card de sugerencia de relleno a +21 días (fail-soft), fotos before/after (`photo_path` → `next/image`), links de políticas en header/footer, sitemap con `/politicas` (237f744).
- 2026-10-16 (deuda): pre-commit timeout 60s→300s (exit-124 mataba lint-staged lento) + drop del shim husky v8 + `.gitattributes` LF + gitignore `.turbo` + `DESIGN.md` al índice de docs (473afb3).
- 2026-10-16 (fix): a11y — títulos de cards del catálogo h3 → h2 (único fail de a11y en Lighthouse) (a21dc72).
- 2026-10-16 (audit): review 360 — Lighthouse perf 91 / a11y 98→100 (fix h3→h2) / responsive 12-12 / SEO capped por noindex de `vercel.app` (tradeoff documentado de la decisión sin dominio) (cded079).
