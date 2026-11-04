# Feature: khal-security-hardening

## Objective
Production hardening of khal web and admin apps: rate limiting, CSRF, security headers, audit logging, admin photo upload, stable idempotency keys, HTML sanitization, CORS policy.

## Branch
main

## Delivery Strategy
ask-on-risk

## Test Runner
pnpm test (vitest)

## Specs

### S1: Rate Limiting + CSRF Protection (P0)
- Rate limiting on all API routes (/api/*, /admin/*) with tiered limits
- CSRF protection on all state-changing forms (booking, admin CRUD, login)
- Login/OTP endpoints: strict limits (5 req/min per IP)
- Booking endpoints: moderate limits (10 req/min per user)
- Admin endpoints: moderate limits (30 req/min per user)
- Return 429 with Retry-After header
- Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

### S2: Security Headers (P1)
- CSP: script-src 'self' 'unsafe-inline' 'unsafe-eval' (for Tiptap), style-src 'self' 'unsafe-inline', img-src 'self' data: blob:, font-src 'self', connect-src 'self' https://epykihchzlbbptrvvawg.supabase.co
- HSTS: max-age=31536000; includeSubDomains; preload
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

### S3: Admin Photo Upload (P1)
- Implement Supabase Storage upload in uploadServicePhoto
- MIME type validation (image/*), max 4MB
- Return public URL from Supabase Storage

### S4: Audit Logging (P1)
- Write to audit_logs table on: booking create/confirm/cancel, admin service CRUD, client blacklist, login attempts
- Fields: actor_id, action, entity, entity_id, before_snapshot, after_snapshot, created_at

### S5: Server-Side Pagination (P2)
- fetchServices accepts offset/limit params
- ServiceManager loads 12 initial, "Load More" fetches next page

### S6: Stable Idempotency Keys (P2)
- Booking form generates stable key per submission (not per render)
- Store in sessionStorage, reuse on retry

### S7: HTML Sanitization (P3)
- DOMPurify on Tiptap HTML output before render
- Allow safe tags only: p, br, strong, em, u, s, ul, ol, li

### S8: CORS Policy (P3)
- API routes: allow *.vercel.app origin, credentials: include
- Webhooks: allow Mercado Pago IPs only

## Tasks

| ID | Specs | Route | Commit |
|----|-------|-------|--------|
| T1 | S1 | inline | 988f45a |
| T2 | S2 | inline |        |
| T3 | S3 | inline | (already done) |
| T4 | S4 | inline | 05001e7 |
| T5 | S5 | inline | 41e7c99 |
| T6 | S6 | inline | 5d189f1 |
| T7 | S7 | inline | e35f381 |
| T8 | S8 | inline |        |

## Log

L1: User requested all security hardening tasks with ODD+TDD
