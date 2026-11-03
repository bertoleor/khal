# Panel de Administración de Khal

**Versión:** 1.0  
**Última actualización:** 2026-10-30  
**Stack:** Next.js 16.4.1 / React 19 / TypeScript strict / Tailwind v4 / Supabase

---

## Resumen General

El panel de administración de Khal (`apps/admin`) es una aplicación Next.js separada que proporciona a los administradores del estudio una interfaz completa para gestionar:
- Servicios ofrecidos (catálogo v7)
- Citas y reservas de clientes
- Base de datos de clientes
- Bloqueos de horario
- Configuración del sistema

**URL Producción:** `https://khal-estudio.vercel.app/admin`  
**Autenticación:** OTP (6 dígitos por email) + Password fallback  
**Base de datos:** Supabase `epykihchzlbbptrvvawg` (us-west-2)

---

## Arquitectura

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── admin/                 # Rutas protegidas del panel
│   │   │   ├── page.tsx           # Dashboard (stats + últimas reservas)
│   │   │   ├── servicios/         # CRUD servicios
│   │   │   │   ├── page.tsx       # Listado + create
│   │   │   │   └── [id]/          # Detalle/edición
│   │   │   ├── citas/             # Gestión de citas
│   │   │   ├── clientes/          # Listado clientes
│   │   │   ├── bloqueos/          # Bloqueos de horario
│   │   │   └── layout.tsx         # Layout con auth + theme
│   │   ├── login/                 # Login page (público)
│   │   │   └── page.tsx
│   │   └── layout.tsx             # Root layout + providers
│   ├── components/
│   │   ├── admin/                 # Componentes específicos admin
│   │   │   ├── login-form.tsx     # Dual flow: OTP + password
│   │   │   ├── theme-provider.tsx # Re-exporta shared
│   │   │   └── theme-toggle.tsx   # Re-exporta shared
│   │   ├── shared/                # Shared con web app
│   │   └── payment/               # PagoResult component
│   ├── lib/
│   │   ├── actions/               # Server Actions
│   │   │   ├── appointments.ts    # createBooking, getBookingStatus
│   │   │   ├── clients.ts         # getClients, createClient
│   │   │   ├── services.ts        # CRUD + withServiceUpdate
│   │   │   └── settings.ts        # Payment/settings
│   │   ├── auth.ts                # requireAuth middleware
│   │   ├── supabase/              # Browser/Server clients
│   │   ├── pago-page.ts           # buildPagoProps helper
│   │   └── payment-types.ts       # PaymentStatus types
│   ├── i18n/                      # next-intl config (shared)
│   └── lib/payment-types.ts       # Tipos de pago
├── package.json                   # tiptap ^3.30.4 (parcheado XSS)
└── next.config.ts                 # Supabase remote pattern
```

---

## Flujos de Autenticación

### Flujo 1: Código OTP (Default)
1. Usuario ingresa email en `/admin/login`
2. `signInWithOtp` con `shouldCreateUser: false`
3. Supabase envía código de 6 dígitos al email
4. Usuario ingresa código → `verifyOtp`
5. Sesión creada → redirect a `/admin`
6. Middleware `requireAuth` valida en cada request

### Flujo 2: Password (Fallback)
1. Usuario clic "Usar contraseña" en login
2. Ingresa email + password
3. `signInWithPassword`
4. Sesión creada → redirect a `/admin`

### Seguridad
- `shouldCreateUser: false` evita creación de cuentas no autorizadas
- Solo emails provistos pueden recibir códigos
- Rate limiting manejado por Supabase Auth
- Errores mapeados a mensajes amigables (`mapError`)

---

## API Endpoints (Server Actions)

### Servicios (`lib/actions/services.ts`)
| Función | Descripción | Params | Retorna |
|---------|-------------|--------|---------|
| `createService(data)` | Crear servicio | ServiceInput | `{ok, data?, error?}` |
| `updateService(id, data)` | Actualizar servicio | string, Partial<Service> | `{ok, data?, error?}` |
| `deleteService(id)` | Soft delete | string | `{ok, data?, error?}` |
| `toggleVisibility(id, next)` | Toggle visible | string, boolean | `{ok, data?, error?}` |
| `getServices()` | Listar todos | void | Service[] |
| `getService(id)` | Obtener uno | string | Service |

**Patrón compartido:** `withServiceUpdate` helper evita duplicación de auth + supabase + revalidate.

### Citas (`lib/actions/appointments.ts`)
| Función | Descripción | Params | Retorna |
|---------|-------------|--------|---------|
| `createBooking(data)` | Crear reserva | 10 args | `{ok, data?, error?}` |
| `getBookingStatus(id)` | Estado cita v2 | string | BookingStatusV2 |
| `getAppointments(filters)` | Listar citas | AppointmentFilters | Appointment[] |
| `updateAppointment(id, data)` | Actualizar cita | string, Partial | `{ok, data?, error?}` |

**Migración 0016:** `addons` JSONB, `create_booking` 10-arg, `get_booking_status` v2.

### Clientes (`lib/actions/clients.ts`)
| Función | Descripción | Params | Retorna |
|---------|-------------|--------|---------|
| `getClients()` | Listar clientes | void | Client[] |
| `getClient(id)` | Detalle cliente | string | Client |
| `createClient(data)` | Crear cliente | ClientInput | `{ok, data?, error?}` |

**Patrón compartido:** `withAuthTransition` genérico para auth + supabase.

### Configuración (`lib/actions/settings.ts`)
| Función | Descripción |
|---------|-------------|
| `getPaymentSettings()` | Config MPago (decidido fuera) |
| `getGeneralSettings()` | Config general del estudio |

---

## Páginas del Panel

### `/admin` — Dashboard
- **Props:** Stats (servicios, citas, clientes), últimas 5 reservas
- **Auth:** Requiere sesión válida
- **Componentes:** `StatCard`, `RecentBookingsTable`
- **Datos:** `getServices()`, `getAppointments()`, `getClients()`

### `/admin/servicios` — Gestión Servicios
- **Listado:** Tabla con nombre, duración, precio, seña, visible, acciones
- **Crear:** Modal con formulario validado (zod)
- **Editar:** Modal inline con toggle visibility
- **Eliminar:** Soft delete (confirma modal)

### `/admin/servicios/[id]` — Detalle Servicio
- **Vista:** Info completa + historial de citas
- **Acciones:** Toggle visibility, editar, eliminar

### `/admin/citas` — Gestión Citas
- **Filtros:** Estado, fecha, servicio, cliente
- **Tabla:** Cliente, servicio, fecha/hora, estado, acciones
- **Estados:** `pending` → `confirmed` → `completed` / `cancelled`

### `/admin/clientes` — Listado Clientes
- **Tabla:** Nombre, email, teléfono, total citas, última cita
- **Detalle:** Click en fila → modal con historial

### `/admin/bloqueos` — Bloqueos Horario
- **Crear:** Fecha, hora inicio/fin, razón, recurrente
- **Listado:** Próximos 30 días
- **Eliminar:** Con confirmación

---

## Base de Datos (Supabase)

### Tablas Principales (17/17 con RLS ✅)

| Tabla | Descripción | RLS |
|-------|-------------|-----|
| `services` | Catálogo v7 (23 servicios) | ✅ |
| `appointments` | Citas/reservas | ✅ |
| `clients` | Base clientes | ✅ |
| `bookings` | Reservas confirmadas | ✅ |
| `blocked_slots` | Bloqueos horario | ✅ |
| `payment_settings` | Config MP (sin usar) | ✅ |
| `general_settings` | Config general | ✅ |
| `service_ledger` | Migraciones aplicadas | ✅ |

### Migraciones Críticas
- **0016:** `appointments.addons` JSONB, `create_booking` 10-arg, `get_booking_status` v2
- **0017:** Catálogo v7 (23 servicios, $10.000 seña, 60min duración)

### RPC Functions
- `create_booking(10 args)` — Crea reserva con validaciones
- `get_booking_status(id)` — Retorna estado 4-state + duration + addons

---

## Calidad de Código

### Gates Passing ✅
| Herramienta | Resultado |
|-------------|-----------|
| TypeScript | 0 errors |
| Biome | 0 warnings |
| Knip | 0 unused |
| Design-QA | 0 violations (ratchet 4) |
| Spell | 0 issues |
| Pnpm Audit | 0 vulnerabilities |
| JSCPD | 2 clones, 0.28% duplication |

### Refactorización JSCPD (85% reducción)
| Componente | Solución |
|------------|----------|
| Theme provider | `@/shared/theme-provider` |
| Theme toggle | `@/shared/theme-toggle` |
| Action base | `withAuthTransition` |
| Services actions | `withServiceUpdate` |
| Skeleton layouts | `skeletonLayout` |
| i18n/request | `@/shared/i18n/request` |
| Skeleton presentation | `useSkeletonPresentation` |
| Login form | `EmailInput` component |
| Pago result | `PagoResult` component |

---

## Deployment

### Vercel
- **Project:** `khal-estudio`
- **Build Command:** `pnpm exec next build`
- **Output:** `.next`
- **Env Vars:** `APP_URL=https://khal-estudio.vercel.app`

### Build Pipeline
1. `pnpm install` (workspaces)
2. `next build` (apps/web + apps/admin)
3. TypeScript + Biome checks
4. Deploy to Vercel Edge

### Health Checks
- Vercel preview deploy: ✅
- Production deploy: ✅
- Post-deploy smoke: RPC anon working ✅

---

## Configuración de Desarrollo

### Requisitos
- Node.js 20+
- pnpm 9+
- Supabase CLI (para migraciones locales)

### Variables de Entorno (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://epykihchzlbbptrvvawg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role>  # solo server
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Comandos Útiles
```bash
# Desarrollo
pnpm dev                    # Turbo: web + admin
pnpm dev --filter=apps/admin # Solo admin

# Calidad
pnpm typecheck              # tsc --noEmit
pnpm lint                   # biome check
pnpm test                   # vitest + playwright

# DB
pnpm supabase db push       # Migraciones locales
pnpm supabase gen types     # Types TypeScript
```

---

## Decisiones Técnicas Clave

| Decisión | Razón |
|----------|-------|
| **Next.js 16.4.1** | Estabilidad Server Components, mejor caching |
| **Supabase Auth (OTP)** | Sin passwords, email verificado, `shouldCreateUser: false` |
| **Soft delete** | `deleted_at` + `is_visible=false` preserva historial |
| **Server Actions** | Type-safe, no API routes duplicados, streaming SSR |
| **next-intl** | i18n server-side, routing `[locale]`, messages JSON |
| **Tailwind v4** | CSS-first, JIT nativo, bundle menor |
| **Feature flags** | Próximo: flags para beta features sin deploy |

---

## Troubleshooting

### Login no funciona
1. Verificar `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel
2. Verificar email en Supabase Auth → Users
3. Revisar logs: `supabase.auth.signInWithOtp` error codes

### Build falla en Vercel
1. Verificar `APP_URL` env var configurada
2. Verificar `vercel.json` buildCommand = `pnpm exec next build`
3. Revisar logs de TypeScript/Biome en build

### Citas no aparecen
1. Verificar RLS policies en `appointments`
2. Verificar `create_booking` RPC en Supabase
3. Revisar timezone: DB usa UTC, UI usa America/Argentina/Buenos_Aires

---

## Referencias

- [Supabase Dashboard](https://supabase.com/dashboard/project/epykihchzlbbptrvvawg)
- [Vercel Project](https://vercel.com/dashboard/khal-estudio)
- [GitHub Repo](https://github.com/bertoleor/khal)
- [Migración 0016](supabase/migrations/0016_add_addons_to_appointments.sql)
- [Migración 0017](supabase/migrations/0017_v7_catalog.sql)

---

## Contacto

**Owner:** Dueña del estudio  
**Tech Lead:** Gentle AI on Hermes Agent  
**Último deploy:** 2026-10-30
