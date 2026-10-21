# UC-002: Reservar turno — State Diagram

```mermaid
stateDiagram-v2
    [*] --> IdlePicker
    state IdlePicker {
        [*] --> FechaVacia
        FechaVacia --> FechaElegida: tap fecha
        FechaElegida --> SlotsCargando: fetch slots
        SlotsCargando --> SlotsCargados: slots listos
        SlotsCargando --> SlotsVacios: 0 disponibles
        SlotsVacios --> FechaElegida: cambiar fecha
        SlotsCargados --> HorarioElegido: tap slot
    }

    IdlePicker --> Formulario: horario seleccionado
    state Formulario {
        [*] --> Vaciando
        Vaciando --> Validando: tap Confirmar
        Validando --> Vaciando: datos inválidos (nombre/WhatsApp faltante)
        Validando --> Creando: datos OK
    }

    Formulario --> CreandoReserva: RPC create_booking
    state CreandoReserva {
        [*] --> Enviando
        Enviando --> Success: booking creado
        Enviando --> Conflict: slot tomado (409)
        Enviando --> ServerError: 5xx / timeout
        Conflict --> Resolviendo: mostrar mensaje
        Resolviendo --> [*]: volver a slots
        ServerError --> [*]: mostrar retry
    }

    CreandoReserva --> ReservaConfirmada: status=pending_deposit + hold 12h
    state ReservaConfirmada {
        [*] --> MostrarRecibo
        MostrarRecibo --> CopiarAlias: tap COPIAR
        MostrarRecibo --> WhatsAppAbierto: tap "enviar comprobante"
    }

    ReservaConfirmada --> EsperandoComprobante: comprobante reenviado a la dueña
    state EsperandoComprobante {
        [*] --> Pendiente12h
        Pendiente12h --> Confirmada: dueña APROBA (UC-007)
        Pendiente12h --> Liberada: 12h sin comprobante (auto-release)
        Pendiente12h --> Rechazada: dueña RECHAZA (externo/mala praxis)
    }
    Liberada --> [*]: slot vuelve a estar disponible
    Rechazada --> [*]: mensaje con tacto + slot liberado

    Confirmada --> Completada: día del turno, servicio hecho
    Confirmada --> NoShow: 15 min de tolerancia agotados
    Confirmada --> Reprogramada: la dueña coordina (>=24h antes, vía WhatsApp)
    Completada --> [*]: arranca el reloj del retoque (18 días, UC-009)
```
