# UC-002: Reservar turno con seña — Flowchart

```mermaid
graph TD
    Start((Clienta en<br/>Detalle Servicio)) --> TapReservar([Tap "Reservar"])
    TapReservar --> Fecha["Date Picker<br/>30 días, días disponibles resaltados"]
    Fecha --> FechaSel{Fecha<br/>seleccionada?}
    FechaSel -->|"todavía no"| Fecha
    FechaSel -->|"sí"| Slots["Time Slots<br/>horarios disponibles para esa fecha"]
    Slots --> SlotSel{Horario<br/>disponible?}
    SlotSel -->|"no hay slots"| NoSlots([Mensaje: "Sin horarios<br/>elegí otra fecha"])
    NoSlots --> Fecha
    SlotSel -->|"sí, selecciona"| Datos["Formulario<br/>nombre + WhatsApp + notas opc."]
    Datos --> DatosValid{Datos<br/>válidos?}
    DatosValid -->|"incompletos"| Datos
    DatosValid -->|"sí"| Resumen["Resumen<br/>servicio + fecha + horario<br/>+ precio + seña 30%"]
    Resumen --> Confirmar([Tap "Confirmar reserva"])
    Confirmar --> RPC{"RPC create_booking<br/>(Supabase)"}
    RPC -->|"slot ya tomado<br/>(race condition)"| RaceError([Error: "Horario recién tomado"])
    RaceError --> Slots
    RPC -->|"error de red"| NetError([Error de red])
    NetError --> Retry([Retry])
    Retry --> RPC
    RPC -->|"success ✓"| Confirm["Confirmación<br/>código + detalle + seña<br/>+ botón WhatsApp"]
    Confirm --> WhatsApp([WhatsApp link<br/>coordinar pago seña])

    classDef screen fill:#e8e8e8,stroke:#999,stroke-width:2px
    classDef decision fill:#fff3cd,stroke:#ffc107,stroke-width:2px
    classDef action fill:#d4edda,stroke:#28a745,stroke-width:1px
    classDef error fill:#f8d7da,stroke:#dc3545,stroke-width:1px
    classDef success fill:#c3e6cb,stroke:#198754,stroke-width:3px

    class Fecha,Slots,Datos,Resumen,Confirm screen
    class FechaSel,SlotSel,DatosValid,RPC decision
    class TapReservar,Confirmar,WhatsApp,Retry action
    class NoSlots,RaceError,NetError error
```
