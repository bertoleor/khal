# Changelog — khal

> **Busqueda:** keywords: `changelog, releases, khal` · clasificacion: `changelog` · estado: canonico · actualizado: 2026-10-20

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
- 2026-10-16 (deps): floors de seguridad en dependencias — `source-map-js >=1.2.2` (CVE-2026-93749, HIGH DoS) y `sharp >=0.35.5` (librsvg) vía overrides + lockfile regenerado, suite 139/139 local (ae1a889).
- 2026-10-16 (db): gate de ventanas de agenda en `create_booking` — `business_hours`/`provider_schedules` bloquean reservas fuera de ventana (ORN-170, migración 0007) (a90a53a, 8a05695).
- 2026-10-16 (db): hardening de grants `anon` en tablas `public` — KHAL H2 (migración 0009) + receipt de convergencia repo↔DB viva, matriz 15/15 PASS (af9bbb2, bedac38).
- 2026-10-16 (admin+db): catálogo admin contra DB real — server actions + schema zod + editor Tiptap + fotos + login OTP real (T1–T5), y bucket `service-photos` con policies staff-only (migración 0010, aplicada en vivo) (e6f8683, 6b7d76e, f51bc7e).
- 2026-10-16 (docs): feature doc `khal-admin-100-operable` + flujo-admin y gates actualizados (a2ffbc2).
- 2026-10-16 (fix): gestor de catálogo `service-list` — acciones `bulkIncrease`/`toggleVisibility` y type mismatch del input hidden + semgrep en ruleset `p/ci` (evita el error de severidad MEDIUM) (635eabc, 2a59021, f39b99c, 6daa1e7, f2211bf).
- 2026-10-16 (deps): revert de los merges de dependabot #10/#13 (bumps dev/prod) — se re-escalan a bumps MAJOR (ver ORN-57) (6ce899a, fe31d4a).
- 2026-10-17 (fix): A1 pagos lee `global_settings` de la DB — merge de `khal/t_f3bec8b8-payment-settings-db` + conflicto de `payment-step.tsx` resuelto + lockfile `typescript-eslint 8.70.0` (e71dd8c, 778aced, 6b8423c).
- 2026-10-17 (ci): design-qa gate — validación de tokens de diseño en CI (ORN-206, PR #26) (28a840a).
- 2026-10-17 (test): scaffold de regresión visual pixel-diff + páginas canónicas per `CONTRASTE.md` + smoke baselines Windows (ORN-205, PR #27) (d21419c, 8789127, 0e3aafe).
- 2026-10-17 (ci): commit de snapshots container-safe (bash pinneado, `safe.directory`, identidad global) + re-run del pipeline contra baselines Linux (6ea614d, 95837ea, 1788760).
- 2026-10-17 (web+admin): flows de contenido real restaurados + modo presentación `?skeleton=1` funcional (b67b3ef).
- 2026-10-17 (admin): dark theme del admin alineado a la marca web (requisito de la dueña) (778bf06).
- 2026-10-17 (fix): ratchet de tokens en design-qa (hex codes fuera del test de contraste) + export `mercadopagoMock` faltante con unit tests + e2e stub sirve `global_settings` con paso de pago legible en dark (d997af3, ee97d41, 2243f87).
- 2026-10-17 (docs): reestructura del árbol de docs — `ARCHITECTURE`/`CONTRIBUTING`/`DESIGN`/`DATABASE`/`ux-flows` (449a559).
- 2026-10-17 (deuda): pre-commit robusto (`lint-staged --no-stash`, timeout 300s) + ignore del pnpm store local + lint-staged cubre `.mjs/.cjs` + smoke test del hook en CI (f590e44, 14ce630, df85ef8).
- 2026-10-18 (devx): arsenal de calidad de código — knip (dead code), semgrep SAST, pr-agent (AI review en PRs), megalinter audit (1290508).
- 2026-10-18 (arsenal): jscpd (detector de copy-paste) + cspell (spell checker) al arsenal (e3c03e8).
- 2026-10-18 (sast): semgrep excluye specs `test/e2e` del scan (3ce3b6f).
- 2026-10-18 (fix): serie pr-agent — workflow canónico mínimo + `settings.toml`, imagen `docker://` con keys de doble underscore, rename del wf (cache inválido de GitHub), scope de permisos `pull-requests`, budget de tokens para custom models (c86e280, 6dd53c0, 613a2b7, 3d7dcfb, d15da85).
- 2026-10-18 (payments): MP webhook — delivery por query-param, rollback del claim al fallar, manifest corto, timeout 8s (4865376).
- 2026-10-18 (docs): referencia de tooling por capas del arsenal de calidad + script `biome:scan` (PR #32) + feature doc biome-migration (S1–S7, T1–T5) (b6bf966, 50d492a).
- 2026-10-19 (docs): rutas canónicas del set infaltables v2 en `AGENTS.md` + links en `README` (ORN-216) (5ce07ec).
- 2026-10-19 (ci): visual flake skip en PRs de dependabot + pr-agent ticket-compliance off + re-run del pipeline en baselines Ubuntu-26 (146ea37, 8792c7d, 263afc2).
