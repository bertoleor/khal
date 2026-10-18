# Khal — Use Cases

> **Fuente:** Extracción de features existentes en khal (apps/web + apps/admin) + reglas de negocio del owner (seña 30%, WhatsApp-first, sin MP checkout).
> **Fecha:** 2026-10-17 · **Skill:** ux-flow-designer v1.0.0 · **Proyecto:** khal (lash artist booking)

---

## UC-001: Explorar catálogo de servicios

| Campo | Descripción |
|--------|-------------|
| ID | UC-001 |
| Name | Explorar catálogo |
| Actors | Clienta |
| Preconditions | La lash artist publicó al menos 1 servicio activo |

**Main Flow:**
1. Clienta llega a la home (`/`)
2. Ve hero con tagline + grid de servicios (nombre, foto, precio, duración)
3. Toca una tarjeta de servicio
4. Ve detalle del servicio (`/servicios/[id]`): foto, descripción, precio, duración
5. Toca "Reservar" → va a UC-002

**Alternative Flows:**
- Catálogo vacío (0 servicios activos): grid muestra empty state "Próximamente"
- Servicio inactivo: no aparece en el grid
- Locale incorrecto: redirect a locale default (es-AR)

**Postconditions:** Clienta tiene contexto del servicio antes de reservar.

---

## UC-002: Reservar turno con seña ⭐ CRÍTICO

| Campo | Descripción |
|--------|-------------|
| ID | UC-002 |
| Name | Reservar turno con seña 30% |
| Actors | Clienta, Sistema (Supabase), WhatsApp |
| Preconditions | Servicio activo con precio definido · Horario disponible existe · Config de seña activa (30%) |

**Main Flow:**
1. Clienta toca "Reservar" en detalle de servicio (`/servicios/[id]/reservar`)
2. Ve date picker con próximos 30 días (días con disponibilidad resaltados)
3. Selecciona fecha → time slots para esa fecha aparecen
4. Selecciona horario disponible
5. Completa datos: nombre, WhatsApp, notas opcionales
6. Ve resumen: servicio, fecha, horario, precio total, seña 30% (monto)
7. Toca "Confirmar reserva"
8. Sistema crea booking en Supabase (RPC `create_booking`)
9. Ve pantalla de confirmación con: código de reserva, detalle del turno, monto de seña, botón de WhatsApp para coordinar pago + confirmar asistencia

**Alternative Flows:**
- Horario tomado entre pasos 4-7 (race condition): sistema refresca slots, muestra "Ese horario acaba de tomarse", clienta elige otro
- Cliente ya tiene turno activo ese día: warning "Ya tenés un turno el [fecha]" con opción de continuar o cancelar
- Error de red al confirmar: mensaje de error con retry, booking no se crea
- Fecha sin slots: date picker la marca como no disponible

**Postconditions:** Booking creado con status `pending_deposit`. Clienta tiene código de reserva y link de WhatsApp. La lash artist ve el turno en su calendario admin.

---

## UC-003: Admin login OTP

| Campo | Descripción |
|--------|-------------|
| ID | UC-003 |
| Name | Login admin con OTP |
| Actors | Lash Artist (Admin), Sistema (Supabase Auth) |
| Preconditions | Admin tiene cuenta creada con email verificado |

**Main Flow:**
1. Admin va a `/login`
2. Ingresa email
3. Sistema envía código OTP (6 dígitos) al email via Supabase Auth
4. Admin ingresa código
5. Sistema valida código (`shouldCreateUser: false`)
6. Redirect a `/admin` (dashboard)

**Alternative Flows:**
- Código incorrecto: mensaje de error, 3 intentos antes de lockout temporal
- Código expirado: "El código expiró, te enviamos uno nuevo"
- Email no registrado: mensaje genérico (no revela si el email existe)

**Postconditions:** Sesión activa. Admin puede acceder a todas las páginas `/admin/*`.

---

## UC-004: Admin gestiona catálogo de servicios

| Campo | Descripción |
|--------|-------------|
| ID | UC-004 |
| Name | Gestionar catálogo (CRUD + fotos + Tiptap) |
| Actors | Lash Artist (Admin) |
| Preconditions | Sesión admin activa (UC-003) |

**Main Flow:**
1. Dashboard → "Servicios"
2. Ve lista de servicios (nombre, precio, duración, estado activo/inactivo)
3. Toca "Nuevo servicio" o edita uno existente
4. Editor: nombre, descripción (Tiptap rich text), precio, duración, foto (upload a Supabase Storage, bucket `service-photos`, max 4MB)
5. Guarda → servicio aparece en lista
6. Toggle activo/inactivo: inactivo no aparece en catálogo público

**Alternative Flows:**
- Foto > 4MB: error "La foto supera 4MB, comprimila"
- Upload falla: error con retry
- Servicio con bookings activos se desactiva: bookings existentes se mantienen, nuevos no se aceptan
- Soft delete: servicio eliminado pasa a `deleted_at`, no se borra físicamente

**Postconditions:** Catálogo público refleja los cambios inmediatamente.

---

## UC-005: Admin gestiona bloqueos de horario

| Campo | Descripción |
|--------|-------------|
| ID | UC-005 |
| Name | Bloquear horarios (vacaciones, feriados) |
| Actors | Lash Artist (Admin) |
| Preconditions | Sesión admin activa |

**Main Flow:**
1. Dashboard → "Bloqueos"
2. Ve calendario con bloqueos existentes
3. Toca fecha → selecciona rango horario o día completo
4. Agrega nota opcional ("Vacaciones en Mar del Plata")
5. Guarda bloqueo
6. Los slots bloqueados desaparecen del date picker público

**Alternative Flows:**
- Bloqueo solapa con booking existente: warning "Tenés 2 turnos en ese rango" con opción de verlos o contactar clientas por WhatsApp

**Postconditions:** Clientas no pueden reservar en horarios bloqueados.

---

## UC-006: Admin gestiona clientes

| Campo | Descripción |
|--------|-------------|
| ID | UC-006 |
| Name: | Ver historial de clientas |
| Actors | Lash Artist (Admin) |
| Preconditions | Sesión admin activa · Al menos 1 booking existe |

**Main Flow:**
1. Dashboard → "Clientes"
2. Ve lista: nombre, WhatsApp, última visita, total de visitas
3. Toca una clienta → detalle: historial de turnos, notas internas
4. Botón WhatsApp para contactar directo

**Alternative Flows:**
- Cliente sin bookings: muestra "Sin turnos todavía"
- Buscar por nombre: filter en tiempo real

**Postconditions:** Admin tiene visibilidad completa de su cartera de clientas.
