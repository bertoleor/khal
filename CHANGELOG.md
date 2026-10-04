# Changelog — KHAL

All notable changes. Format follows Keep a Changelog (summarized).

## Unreleased (UNVERIFIED)

- Docs: `docs/` única fuente — case-rename `DOCS/`→`docs/` en index (breaker de CI Linux),
  `SECURITY.md`→`docs/SECURITY.md`, `AGENT CONSTITUTION.MD`→`docs/agent-constitution.md`,
  ADR-0001→`docs/adr/`; `docs/PRODUCTO.md` + `docs/README.md` (índice) nuevos;
  refs vivas re-apuntadas (README, issue template, comentarios de código, skills).
- Prettier formatting pass across repo (style only, no logic change).
- Docs: added `README.md`, `CHANGELOG.md`, `DOCS/ADR-0001-auth-provisoria.md`.
- Audit: `DOCS/auditoria-nocturna-2026-09-12.md` (baseline + gates + gaps + kanban dry-run).

## 2026-09 (committed, per git log)

- i18n client components, error boundaries, not-found pages, SQL prep docs.
- Admin internationalized with next-intl (routing, provider, server components).
- Admin security hardening: `requireAuth` guard, cookie flags, Zod-validated actions.
- Cleanup: dead code removed, missing directives, low-risk debt fixes.
