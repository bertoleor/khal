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

## UC-002: Reservar turno con seña ⭐ CRÍTICO — v2 (2026-10-20)

| Campo | Descripción |
|--------|-------------|
| ID | UC-002 |
| Name | Reservar turno con seña manual + retención 12 h |
| Actors | Clienta, Sistema (Supabase), WhatsApp, Bot Telegram (aviso a la dueña) |
| Preconditions | Servicio activo con precio definido · Horario disponible existe · Config de seña activa (monto o %, editable) · Términos del estudio definidos (editables por la dueña) |

**Main Flow:**
1. Clienta toca "Reservar" en detalle de servicio (`/servicios/[id]/reservar`) — el precio de la seña ya es visible en el detalle
2. Tira de fechas horizontal (reel, próximos 30 días, disponibles resaltados)
3. Selecciona fecha → time slots aparecen (horarios tomados se muestran tachados)
4. Selecciona horario disponible
5. Completa datos: nombre, WhatsApp, y **checkbox "vengo con pestañas de otro lugar"** (⚑ flag → visible para la dueña en cola y ficha)
6. Ve resumen + **casilla de términos obligatoria** (resumen corto + "ver todo"): sin maquillaje · tolerancia 15 min · cambios con 24 h · seña no reembolsable · avisar trabajo externo
7. Toca "Confirmar — reserva por 12 h" (la promesa de retención va en el botón)
8. Sistema crea booking (RPC `create_booking`) con status `pending_deposit` + **hold de 12 horas** (`hold_expires_at`); el slot queda tomado para otros — nadie más lo puede agarrar
9. Bot notifica a la dueña: datos de la clienta + flag ⚑ + mensaje listo para reenviar pidiendo el comprobante
10. Clienta ve pantalla de seña (estilo recibo): monto, alias con botón COPIAR, CBU alternativo, barra de countdown de las 12 h, y **un solo CTA: "Enviar comprobante por WhatsApp"** (la transferencia es manual — no hay pagos en la app)
11. Pantalla de estado: badge PENDIENTE DE CONFIRMACIÓN + countdown + "qué pasa ahora" en 3 pasos (la dueña valida → mensaje de confirmación → recordatorio 24 h)

**Alternative Flows:**
- Horario tomado entre pasos 4-7 (race condition): sistema refresca slots, muestra "Ese horario recín se tomó", clienta elige otro sin perder sus datos
- **Doble-tap en confirmar (idempotencia):** una sola reserva se crea — el botón se bloquea al confirmar
- Cliente ya tiene turno activo ese día: warning "Ya tenés un turno el [fecha]" con opción de continuar o cancelar
- Error de red al confirmar: mensaje de error con retry, booking no se crea
- Fecha sin slots: la tira la marca como no disponible
- **Comprobante nunca llega:** a las 12 h el turno se libera solo (status `released`); el bot avisó a la dueña antes de vencer; si el comprobante llega tarde y el slot sigue libre, la dueña puede re-confirmar a mano (la última palabra es suya — ver UC-007)
- **Reprogramar con menos de 24 h:** la app no lo permite self-service — deriva al WhatsApp de la dueña, que decide caso por caso

**Postconditions:** Booking creado con status `pending_deposit` y hold de 12 h. La clienta ve el estado con countdown y la vía de seña por WhatsApp. La dueña recibió la alerta del bot y ve el turno en su cola de señas. NINGÚN turno está confirmado hasta que la dueña aprueba el comprobante (UC-007).

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

---

## UC-007: Dueña aprueba, rechaza o libera señas ⭐ (v2)

| Campo | Descripción |
|--------|-------------|
| ID | UC-007 |
| Name | Cola de comprobantes — la dueña decide |
| Actors | Dueña, Sistema, Bot Telegram, WhatsApp |
| Preconditions | Existe booking `pending_deposit` con hold activo · Comprobante reenviado por WhatsApp (o ausente) |

**Main Flow:**
1. La cola de señas ordena por urgencia (vence primero arriba) con countdown y flag ⚑ visible
2. Dueña abre el detalle: foto del comprobante, datos de la clienta, monto esperado, hace cuánto reservó
3. APROBAR (tecla A): status → `confirmed` · dispara el mensaje "turno confirmado" listo para reenviar por WhatsApp
4. La ficha de la clienta se actualiza; el turno pasa a la agenda como confirmado

**Alternative Flows:**
- RECHAZAR (R): status → `rejected` (mala praxis, externo no aceptado) · dispara mensaje con tacto · slot se libera
- LIBERAR (L): status → `released` sin mensaje de rechazo (solo aviso de liberación)
- PEDIR DE NUEVO (W): re-envía el pedido de comprobante a la clienta
- 12 h vencidas sin comprobante: auto-release — el bot avisó antes; si el comprobante llega tarde y el slot sigue libre, la dueña re-confirma a mano

**Postconditions:** Booking en estado final del caso; mensaje correspondiente generado; ficha y agenda actualizadas.

---

## UC-008: Bot de Telegram informa a la dueña (v2)

| Campo | Descripción |
|--------|-------------|
| ID | UC-008 |
| Name | Canal bot — alertas y digests |
| Actors | Bot Telegram, Dueña, Sistema |
| Preconditions | Bot configurado (on/off y destinataria desde Configuración) |

**Main Flow:**
1. Nueva reserva: alerta instantánea — datos de la clienta + flag ⚑ + hold hasta cuándo + mensaje listo para reenviar pidiendo comprobante
2. Cada mañana: digest de la agenda de hoy y mañana + pendientes de seña
3. Vencimiento próximo: nudge ("se libera en 3 horas — re-confirmar o dejar que se libere")
4. Seguimiento: cada 2 días, clientas pendientes de respuesta o con retoque pronto (18 días)

**Alternative Flows:**
- Bot caído: el panel es la fuente de verdad — todo sigue visible; el bot es aviso, no origen

**Postconditions:** La dueña está informada sin abrir el panel; nada se pierde si el bot falla.

---

## UC-009: Ciclo de mensajes a clientas — retención (v2)

| Campo | Descripciñn |
|--------|-------------|
| ID | UC-009 |
| Name | Lifecycle: del cuestionario al retoque de 18 días |
| Actors | Dueña, Clienta (vía WhatsApp), Sistema |

**Main Flow (mensajes, redactados en docs/ux-flows/v2-flujos-completos.html §07):**
1. Bienvenida + "turno a confirmar" (reserva creada)
2. "Turno confirmado ✓" (seña aprobada — dispara UC-007)
3. Recordatorio 24 h antes (reduce no-shows — el mensaje que más plata salva)
4. Post-servicio: cuestionario "cómo te quedaron"
5. +18 días del turno completado: recordatorio de retoque (motor de recompra)
6. No-show (15 min + 1): mensaje con tacto — seña no reembolsable + cómo reprogramar

**Postconditions:** Ficha de clienta con el historial del ciclo; rellenos agendados; dueña nunca tipea de cero.

---

## UC-010: Dueña gestiona contenido editable — alias, seña, redes, términos (v2)

| Campo | Descripciñn |
|--------|-------------|
| ID | UC-010 |
| Name | Configuración — el negocio cambia sin depender de nadie |
| Actors | Dueña, Sistema |

**Main Flow:**
1. Configuración → secciones: Alias & CBU · Seña (monto o %) · Redes sociales · Términos · Bot
2. Edita y guarda → impacto en vivo en la app (alias y monto en la pantalla de seña; redes en el footer; términos en `/politicas` y en la casilla del reservar)
3. El editor de términos tiene preview en vivo de lo que ve la clienta

**Alternative Flows:**
- Término nuevo con reserva en curso: aplica a reservas nuevas — no retroactivo
- Seña cambia de monto a %: el porcentaje se calcula sobre el precio vigente del servicio

**Postconditions:** Contenido gestionado por la dueña; cero dependencia técnica para cambios de negocio.
