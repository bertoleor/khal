# Flujo del admin — operación del estudio (apps/admin)

> **Fecha:** 2026-10-15 · **Autor:** 24-gentle (hermes) · **Motivo:** documentar el panel de administración: auth, entidades operables y estado real de cada pantalla
> **Búsqueda:** keywords: `admin, panel, staff, jwt, turnos, clientes, excepciones` · clasificación: `product` · estado: `vigente`
> **Resumen:** El panel interno (apps/admin): modelo de auth fail-closed por JWT, las cuatro entidades operables (turnos, servicios, clientas, excepciones) y el gap actual de acceso (sin form de login hasta provisionar staff). Para ventas, onboarding y QA.
> **Parte de:** [[README]] · Relacionados: [[adr/ADR-0001-auth-provisoria]], [[06-estado-gates]], [[flujo-cliente]], [[SECURITY]]

## Acceso (fail-closed)

```mermaid
flowchart LR
    A["Staff abre /admin"] --> B{JWT Supabase con app_metadata.role}
    B -->|role staff| C["Panel operativo"]
    B -->|sin token / rol invalido| D["Acceso denegado — no hay fallback"]
```

- **ADR-0001 (aplicada, ORN-79):** el mock de cookie fue eliminado; la única vía es el JWT de Supabase con claim `app_metadata.role`. Sin token válido el acceso se niega — **fail-closed**, no hay login alternativo.
- **Login real (2026-10-16, khal-admin-100-operable):** `/login` tiene formulario Supabase real — flujo primario por **código mágico OTP** (`signInWithOtp` con `shouldCreateUser:false`; solo emails de staff provisionados reciben código) y flujo secundario por contraseña. Cuenta de la dueña provisionada (`bertoletti3011@gmail.com`, `role=admin`, org del seed) — el código llega a su propio email, ninguna credencial transita por chat.
- Deploy: proyecto Vercel propio `khal-admin` (deploy en push a main, Root Directory `apps/admin`), separado del storefront.

## Entidades operables (componentes verificados en `apps/admin/src/components/admin/`)

| Pantalla | Componente | Qué hace |
|---|---|---|
| Turnos | `appointment-list.tsx` | Lista de turnos con transiciones de estado (pendiente → confirmado / no-show) |
| Servicios | `service-manager.tsx` | CRUD completo del catálogo contra la DB viva: **editor de texto enriquecido Tiptap** para la descripción, **subida de fotos** al bucket `service-photos` (Supabase Storage, pública, máx 4MB) con preview y quitado, precios en pesos con validación zod inline (montos, duración, seña), búsqueda y orden, toggle de visibilidad, **soft delete** (`deleted_at`, conserva los turnos agendados) y aumento bulk +10% |
| Clientas | `client-list.tsx` | Lista con LTV por clienta y toggle de blacklist (la clienta bloqueada recibe `error.blacklisted` al intentar reservar) |
| Excepciones | `exceptions-list.tsx` | Alta de horarios bloqueados (feriados, vacaciones) que restan slots en la web pública |

Las cuatro escriben vía server actions (`requireAuth` → zod → Supabase bajo RLS `services_member_all` org-scoped); los antiguos mock stores de servicios quedaron fuera (clients/exceptions siguen con sus acciones existentes).

## Convenciones de calidad que el admin ya cumple

- Ring de foco visible en TODOS los botones (contrato ORN-59 H2, testeado en `apps/web/test/a11y-p2-contract.test.ts`).
- `aria-current` en la navegación activa (hallazgo P2 corregido).
- Estados semánticos con color + texto (badge de no-show, servicio oculto), nunca color solo.
- UI todavía en tema claro original — el dark brand se aplicó solo a la web pública (pendiente P2).

## Evidencia

- `apps/admin/src/components/admin/` — los 4 componentes con sus contratos a11y.
- `docs/adr/ADR-0001-auth-provisoria.md` — decisión de auth aplicada (status: superseded → implementada).
- Tests de contrato: `apps/web/test/a11y-p2-contract.test.ts` (ring) y `apps/web/test/a11y-fixes.test.tsx`.
