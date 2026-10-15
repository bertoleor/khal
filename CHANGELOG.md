# Changelog — khal

> **Busqueda:** keywords: `changelog, releases, khal` · clasificacion: `changelog` · estado: canonico · actualizado: 2026-09-25

## [Unreleased]
- 2026-09-25: changelog iniciado (P17 doctrina — flota Hermes). Historia previa: ver git log.
- 2026-10-15 (build): knobs de workers Next (`cpus:2` + `webpackMemoryOptimizations`) — build local paralelo 0/2 muerto → 2/2 en 3m15s (8507abf).
- 2026-10-15 (ci): Turborepo Remote Cache via OIDC sin secrets en el repo + `turbo run --affected` con base full-history (1e6cdb1, 72852e7).
- 2026-10-15 (ci): eslint excluye `.worktrees/` — worktree estacionado ya no rompe `pnpm lint` (003d885).
- 2026-10-15 (docs): re-baseline de `06-estado-gates.md` (gates re-evaluados contra estado real), índice de docs re-ruteado a `E:/Hermes/projects/khal`, ADR-0001 reubicada a `docs/adr/` + ADRs 0002 (pagos dual), 0003 (E2E stub), 0004 (build/CI infra).
