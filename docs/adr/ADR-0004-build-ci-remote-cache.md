# ADR-0004 — Build & CI: capped Next workers, Turborepo remote cache via OIDC, turbo --affected
> Parte de: [[projects/khal/README|README]] · Relacionados: [[06-estado-gates]] · [[ADR-0001]]

- Status: accepted (2026-10-15; applied in commits 8507abf, 003d885, 1e6cdb1, 72852e7).
- Context: the build host is a 4 vCPU / 11.8GB machine shared with the live
  Hermes fleet (~3.5GB free). Parallel `next build` of web+admin died with
  `0xC0000142` at "Collecting page data": each Next page-data worker loads a
  full copy of the module graph, and Windows could not spawn them. CI also
  rebuilt everything on every run, and the only remote-cache auth option
  (long-lived PAT) put a secret in the repo that expires in hours anyway.
- Decision:
  1. Cap build workers per app: `experimental: { cpus: 2,
     webpackMemoryOptimizations: true }` (validated: 0/2 dead at 7m17s → 2/2
     in 3m15s; refs: nextjs memory-usage guide, vercel/next.js#95744).
  2. Remote cache via the `vercel/setup-turborepo-remote-cache-action` with a
     team-side Turborepo CLI OIDC policy — short-lived tokens minted per CI
     run, auto-revoked, ZERO secrets in the repo. Only workflows of
     bertoleor/khal can mint (claims: aud, repository, repository_id,
     repository_owner, repository_owner_id).
  3. `turbo run <task> --affected` in CI with `fetch-depth: 0` +
     `TURBO_SCM_BASE=origin/main` (shallow clones + --affected = false
     greens). Commands call turbo directly via `pnpm exec` — the root lint/test
     scripts bypass turbo (anti-pattern, flagged).
- Consequences: local builds fit in fleet-host RAM; CI restores anything
  already built anywhere (host ↔ CI cache sharing) and only runs tasks for
  changed packages. Local↔remote proven with a wiped local cache restoring
  FULL TURBO in 1.2s. Ops note: pushing config-only changes yields
  intentionally-empty turbo runs (vacuous green is correct for that diff).
