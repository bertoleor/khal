# KHAL — Code Review Rules (GGA)
Stack: Next 15.5 / React 19 / TS strict / Tailwind v4 / Supabase / zod.
Canon: `E:/Hermes/AGENTS.md` (Gentleman gates rigen en este repo).

## General
REJECT if:
- Hardcoded secrets or credentials
- `any` type or missing types on exported functions
- Empty catch blocks
- `console.log` in production code (use logger)

## Frontend
REJECT if:
- `style=` inline or hardcoded hex in className (use Tailwind + `cn()`)
- Missing `lang="es-AR"` semantics or broken i18n parity es/en
- `!important` in CSS

## Pagos
REJECT if:
- Card data logged or stored
- Webhook without HMAC verification
- Non-idempotent charge path

## Response Format
FIRST LINE must be exactly:
STATUS: PASSED
or
STATUS: FAILED

If FAILED, list: `file:line - rule violated - issue`

## Docs del proyecto — rutas canónicas (set infaltables v2)

> Convención de flota: `E:/Hermes/docs/sistema/docs-infaltables-proyectos.md` — raíz = lo que las herramientas consumen; `docs/` = biblioteca con nombre fijo.

- **Raíz:** `README.md` · `AGENTS.md` · `SECURITY.md` · `CONTRIBUTING.md` · `CHANGELOG.md` · `ARCHITECTURE.md` · `LICENSE`
- **`docs/`:** `docs/DESIGN.md` · `docs/API.md` · `docs/DATABASE.md` · `docs/marca.md` · `docs/plan-accion-YYYY-MM-DD.md` · `docs/runbooks/`

Pendientes en este proyecto (audit 19-writer 2026-10-19): `SECURITY.md` en raíz (hoy `docs/SECURITY.md` — mover, ORN-220) · `docs/marca.md` (≈ `docs/04-branding-identidad.md`) · `docs/runbooks/` (ORN-217) · `DESIGN.md` dup en raíz (higiene, ORN-224)
