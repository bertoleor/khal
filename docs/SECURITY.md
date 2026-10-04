# Security Policy — KHAL

> **Búsqueda:** keywords: `khal, seguridad, security policy, rls, jwt, supabase, mercadopago, webhook, fail-closed` · clasificación: `seguridad` · estado: `canónico` · actualizado: 2026-10-03
> Relacionados: [[README|índice docs]] · [[adr/ADR-0001-auth-provisoria|ADR-0001]] · [[supabase-migration]] · [[../README|README raíz]]

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main    | ✅        |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, email **bertoleor@github.com** (or open a private security advisory on GitHub).

We will acknowledge receipt within 48 hours and provide a timeline for fix within 5 business days.

## Security Measures Implemented (verificado contra el código — 2026-10-03)

- **Authentication**: Supabase Auth (`@supabase/ssr` server client per request). El mock cookie `khal_role` fue **eliminado por completo** (ORN-79, commit d0c3402) — ninguna cookie granta acceso.
- **Authorization (admin)**: fail-closed en `requireAuth()` (`apps/admin/src/lib/auth.ts`): cualquier error (env, red, sesión inválida) deniega. El rol sale del claim JWT `app_metadata.role` (nunca `user_metadata`), con allow-list SQL `current_role()` → `admin` / `manager` (migración `0002_auth_roles.sql`). Edge middleware solo redirige requests sin cookies de sesión Supabase; la autorización real es server-side en cada action.
- **Database**: RLS en 17/17 tablas (migraciones `0001`–`0005`, verificadas contra DB viva 2026-09-28 — `supabase-golive-2026-09-28.md`). Escrituras de guest solo vía RPC `create_booking` (SECURITY DEFINER, validación de solapamientos + horario de negocio en DB). `security_logs` append-only + `processed_events` para idempotencia de webhooks.
- **Payments**: Mercado Pago **Checkout Pro** — delegación total: KHAL no toca datos de tarjeta (cero superficie PCI). Preferencia creada server-side (`apps/web/src/lib/actions/payment.ts`); webhook `/api/webhooks/mercadopago` con verificación de firma HMAC (x-signature/x-request-id) + confirmación condicional `status='pendiente'` (idempotente frente a retries de MP).
- **Webhooks (workers)**: HMAC-SHA256 con comparación timing-safe + idempotencia por event-id + circuit breaker fail-fast (`apps/api-workers/src/webhook.ts`, `circuit-breaker.ts`).
- **Validación**: Zod en todos los bordes (env al booteo fail-closed `apps/web/src/config/env.ts`, webhooks, actions) + TypeScript strict.
- **Secretos**: sin secrets hardcodeados; `.env*` ignorado por `.gitignore` (solo `.env.example` trackeado, sin valores); gitleaks 8.30.1 en pre-commit (receipt de este commit).
- **Pre-commit**: lint-staged (prettier + eslint `--max-warnings 0` sobre staged) + gitleaks.

## Aspiracional — declarado pero NO implementado (no lo cites como vigente)

- **Rate limiting (Upstash)**: `UPSTASH_REDIS_REST_URL/TOKEN` existen en `.env.example` y `apps/api-workers/src/env.ts`, pero no hay runtime de rate-limit en el código de apps. Sin implementar.
- **CSP con nonce / headers HSTS / X-Frame-Options**: no presentes en `next.config.ts` de web ni admin a esta fecha.
- **Turnstile**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY` en env contract, widget no cableado en UI.
- **Sentry**: solo `SENTRY_DSN` en env contract, SDK no integrado.
- **Rotación de `SUPABASE_SERVICE_ROLE_KEY` cada 90 días (SEC-02)**: política declarada en env example; sin automatización.
- **QStash / n8n / Telegram/WhatsApp**: scaffold en `docs/automations.md`, provisioning pendiente de credenciales.

## Security Contacts

- Primary: @bertoleor
