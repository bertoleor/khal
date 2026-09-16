# Design: limpiar-codigo-errores-warnings-tree

## Technical Approach

Five workstreams executed in dependency order: (1) dead file/type cleanup, (2) security hardening with mock auth structurally ready for JWT, (3) admin i18n via next-intl mirroring web's established pattern, (4) error boundaries and structured action responses, (5) SQL migration documentation. All changes preserve existing 33/33 tests.

## Architecture Decisions

| Decision | Option A | Option B | Tradeoff | Choice |
|----------|----------|----------|----------|--------|
| Auth structure | Centralized `requireAuth()` | Per-action inline checks | DRY vs. simplicity | A — single swap point for Supabase |
| Cookie security flags | Hardcode `secure: NODE_ENV === 'production'` | Separate dev/prod config | Complexity vs. correctness | A — simple, correct |
| Admin i18n pattern | Mirror web's next-intl setup exactly | Custom solution | Consistency vs. novelty | A — proven pattern, less risk |
| Error response shape | `{ success, error, details? }` | Throw + catch in components | Contract clarity vs. ergonomics | A — explicit, testable |
| packages/ui handling | Scaffold minimal Button component | Remove from transpilePackages | Justify package vs. delete | A — scaffold minimal (low risk) |
| Zod on actions | Add schema validation per action | Keep FormData + String() casts | Safety vs. effort | A — spec requires it |

## Data Flow

```
Browser → Middleware (cookie check) → Server Component (getTranslations)
                                          ↓
                                   Server Action (requireAuth → Zod validate → business logic)
                                          ↓
                                   { success, error?, details? } → Client Component
```

Auth: `login/page.tsx` sets `khal_role` cookie with flags → middleware reads via `getRole()` → `requireAuth()` in actions reads cookies() + validates → returns `{ userId, role }` context.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/admin/src/index.ts` | Delete | Dead empty export |
| `packages/ui/src/index.ts` | Scaffold | Minimal Button component to justify package |
| `packages/types/src/index.ts` | Modify | Remove UUID, ISODateTime, CurrencyCode, Cents exports |
| `apps/web/src/lib/actions/catalog.ts` | Modify | Add `"use server"` as first line |
| `apps/web/src/config/env.ts` | Modify | Wrap `envSchema.parse()` in try/catch with clear error messages |
| `apps/admin/src/lib/auth.ts` | Modify | Add `requireAuth()` helper, keep `getRole()` for middleware |
| `apps/admin/src/app/login/page.tsx` | Modify | Add cookie security flags (httpOnly, secure, sameSite, maxAge) |
| `apps/admin/src/lib/actions/appointments.ts` | Modify | Add `requireAuth()`, Zod input validation, structured error returns |
| `apps/admin/src/lib/actions/services.ts` | Modify | Add `requireAuth()`, Zod input validation, structured error returns |
| `apps/admin/src/lib/actions/clients.ts` | Modify | Add `requireAuth()`, Zod input validation, structured error returns |
| `apps/admin/src/lib/actions/exceptions.ts` | Modify | Add `requireAuth()`, structured error returns (already has Zod) |
| `apps/admin/package.json` | Modify | Add `next-intl` dependency |
| `apps/admin/next.config.ts` | Modify | Add `next-intl` plugin wrapper |
| `apps/admin/src/i18n/routing.ts` | Create | defineRouting with `es` default locale |
| `apps/admin/src/i18n/request.ts` | Create | getRequestConfig loading admin messages |
| `apps/admin/src/i18n/navigation.ts` | Create | createNavigation from routing |
| `apps/admin/messages/es.json` | Create | All admin Spanish strings extracted |
| `apps/admin/src/app/layout.tsx` | Modify | Wrap with NextIntlClientProvider |
| `apps/admin/src/app/admin/layout.tsx` | Modify | Use `getTranslations()` for nav labels |
| `apps/admin/src/app/admin/page.tsx` | Modify | Use `getTranslations()` for heading |
| `apps/admin/src/app/admin/servicios/page.tsx` | Modify | Use `getTranslations()` for heading/description |
| `apps/admin/src/app/admin/clientes/page.tsx` | Modify | Use `getTranslations()` for heading |
| `apps/admin/src/app/admin/bloqueos/page.tsx` | Modify | Use `getTranslations()` for heading/description |
| `apps/admin/src/components/admin/appointment-list.tsx` | Modify | Use `useTranslations()` hook for all strings |
| `apps/admin/src/components/admin/service-list.tsx` | Modify | Use `useTranslations()` hook for all strings |
| `apps/admin/src/components/admin/client-list.tsx` | Modify | Use `useTranslations()` hook for all strings |
| `apps/admin/src/components/admin/exceptions-list.tsx` | Modify | Use `useTranslations()` hook for all strings |
| `apps/admin/src/app/error.tsx` | Create | Error boundary with styled UI + recovery action |
| `apps/admin/src/app/not-found.tsx` | Create | 404 page with link to dashboard |
| `apps/web/src/app/[locale]/error.tsx` | Create | Error boundary with styled UI + recovery action |
| `apps/web/src/app/[locale]/not-found.tsx` | Create | 404 page with link to home |
| `docs/supabase-migration.md` | Create | Migration guide: schema, RLS, auth mapping, env vars |
| `packages/utils/src/index.ts` | Modify | Add `toIsoDate()` export |
| `packages/utils/src/dates.ts` | Create | `toIsoDate()` implementation |

## Interfaces / Contracts

```typescript
// apps/admin/src/lib/auth.ts — auth result type
interface AuthContext {
  userId: string;       // placeholder until Supabase
  role: "admin" | "anon";
}

// All Server Actions return this shape:
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; details?: Record<string, string>[] };

// requireAuth() throws if unauthenticated, returns AuthContext
async function requireAuth(): Promise<AuthContext>;
```

## Translation Key Structure

```json
{
  "nav": { "agenda": "Agenda", "clientes": "Clientes", "servicios": "Servicios", "bloqueos": "Bloqueos" },
  "auth": { "login": "Entrar como administradora", "title": "Khal · Admin" },
  "appointments": { "title": "Agenda de hoy", "empty": "No hay turnos para hoy.", "status": { "pendiente": "Pendiente", "confirmado": "Confirmar", ... } },
  "services": { "title": "Servicios", "description": "Seleccioná servicios...", "show": "Mostrar", "hide": "Ocultar", "bulkIncrease": "Subir 10% a seleccionados" },
  "clients": { "title": "Clientes", "empty": "No hay clientas aún.", "blacklist": "Bloquear", "unblacklist": "Quitar de lista negra" },
  "exceptions": { "title": "Bloqueos de agenda", "description": "Feriados, vacaciones...", "empty": "No hay bloqueos definidos.", "add": "Bloquear día", "types": { "holiday": "Feriado", ... } },
  "errors": { "unauthenticated": "No autenticado", "forbidden": "Acceso denegado", "validation": "Error de validación", "internal": "Error interno" },
  "notFound": { "title": "Página no encontrada", "back": "Volver al inicio" }
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `requireAuth()` mock behavior, `toIsoDate()`, env error messages | Existing vitest infrastructure |
| Integration | Server Actions return correct ActionResult shape | Existing 33/33 tests must pass unchanged |
| E2E | Admin login → cookie flags → action execution | Manual verification (no E2E infra yet) |

## Migration / Rollout

No database migration required. The `docs/supabase-migration.md` documents the *future* migration path. All changes are backward-compatible — existing tests pass without modification. The `requireAuth()` helper is the single swap point for Supabase JWT verification.

## Open Questions

- [ ] Should `packages/ui` scaffold a Button component or be removed from `transpilePackages` entirely? (Scaffold chosen — lower risk)
- [ ] Admin i18n: single `es.json` file or split by feature? (Single file chosen — admin has <50 strings)
