# UC-002: Reservar turno — Sequence Diagram

```mermaid
sequenceDiagram
    actor Clienta
    participant Web as Web App (Next.js)
    participant SB as Supabase
    participant WA as WhatsApp (wa.me)

    Note over Clienta,Web: Clienta en detalle de servicio
    Clienta->>Web: Tap "Reservar"
    Web->>SB: getAvailableDates(serviceId, 30 días)
    SB-->>Web: fechas con disponibilidad
    Web-->>Clienta: Date picker (días resaltados)

    Clienta->>Web: Selecciona fecha
    Web->>SB: getAvailableSlots(serviceId, fecha)
    SB-->>Web: time slots disponibles
    Web-->>Clienta: Grid de horarios

    Clienta->>Web: Selecciona horario
    Web-->>Clienta: Formulario (nombre, WhatsApp, notas)

    Clienta->>Web: Completa datos + tap Confirmar
    Web->>Web: Valida campos (nombre no vacío, WhatsApp formato AR)

    alt Datos inválidos
        Web-->>Clienta: Errores inline (nombre requerido, WhatsApp inválido)
    end

    Web->>SB: RPC create_booking(serviceId, fecha, horario, nombre, whatsapp)
    activate SB

    alt Slot disponible
        SB->>SB: INSERT booking (status=pending_deposit)
        SB-->>Web: 201 { booking_id, codigo }
        deactivate SB
        Web-->>Clienta: Confirmación (código, detalle, monto seña)
        Clienta->>WA: Tap botón WhatsApp → abre chat con mensaje pre-armado
        Note over WA: Lash artist coordina pago de seña 30%
    else Slot tomado (race condition)
        SB-->>Web: 409 Conflict
        deactivate SB
        Web->>SB: getAvailableSlots(serviceId, fecha)
        SB-->>Web: slots actualizados
        Web-->>Clienta: "Horario recién tomado" + slots frescos
    else Error de red
        SB-->>Web: 5xx / timeout
        deactivate SB
        Web-->>Clienta: Error + botón Retry
    end
```
