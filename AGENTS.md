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
