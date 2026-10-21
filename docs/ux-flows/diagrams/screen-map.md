# Khal — Master Screen Map

> Mapa de todas las pantallas de khal (web clienta + admin) con paths de navegación.

```mermaid
graph TD
    subgraph Web["📱 Web Clienta (apps/web)"]
        Home["Home (/)<br/>Hero + Catálogo grid"]
        ServicioDetalle["Detalle Servicio<br/>(/servicios/[id])"]
        ReservarFecha["Reservar: Fecha<br/>(/servicios/[id]/reservar#fecha)"]
        ReservarHorario["Reservar: Horario<br/>(/servicios/[id]/reservar#horario)"]
        ReservarDatos["Reservar: Datos<br/>(/servicios/[id]/reservar#datos)"]
        Confirmacion["Confirmación + Seña (recibo)<br/>alias COPIAR + 12h countdown<br/>CTA único: comprobante x WhatsApp"]
        Estado["Estado del turno<br/>badge PENDIENTE → CONFIRMADA"]
        Politicas["Políticas / Términos<br/>(/politicas) — editables por la dueña"]
    end

    subgraph Admin["🔐 Admin (apps/admin)"]
        Login["Login OTP<br/>(/login)"]
        CodigoOTP["Código OTP<br/>Ingreso 6 dígitos"]
        Dashboard["Hoy / Mañana (/admin)<br/>agenda + cola de señas 12h"]
        Servicios["Servicios<br/>(/admin/servicios)"]
        ServicioEditor["Editor Servicio<br/>Tiptap + Foto upload"]
        Bloqueos["Bloqueos<br/>(/admin/bloqueos)"]
        Clientes["Clientes<br/>(/admin/clientes)"]
        FichaClienta["Ficha clienta<br/>flags ⚑ + notas + alta manual"]
        ColaSenas["Cola de señas<br/>aprobar A / rechazar R / liberar L"]
        Calendario["Calendario semana/mes<br/>pendientes + bloqueos"]
        Settings["Configuración<br/>alias · seña · redes · términos · bot"]
    end

    Home -->|"tap servicio"| ServicioDetalle
    ServicioDetalle -->|"tap Reservar"| ReservarFecha
    ReservarFecha -->|"fecha seleccionada"| ReservarHorario
    ReservarHorario -->|"horario seleccionado"| ReservarDatos
    ReservarDatos -->|"Confirmar"| Confirmacion
    Confirmacion -->|"comprobante enviado"| Estado
    Estado -->|"WhatsApp"| Home

    Login -->|"email enviado"| CodigoOTP
    CodigoOTP -->|"código válido"| Dashboard
    Dashboard --> Servicios
    Servicios --> ServicioEditor
    Dashboard --> Bloqueos
    Dashboard --> Clientes
    Dashboard --> ColaSenas
    Dashboard --> Calendario
    Dashboard --> Settings
    Clientes --> FichaClienta
    ColaSenas -->|"APROBAR"| Dashboard

    Home -.-> Politicas

    classDef webScreen fill:#d1fae5,stroke:#059669,stroke-width:2px
    classDef adminScreen fill:#dbeafe,stroke:#2563eb,stroke-width:2px
    classDef critical fill:#fef3c7,stroke:#d97706,stroke-width:3px

    class Home,ServicioDetalle,Politicas webScreen
    class ReservarFecha,ReservarHorario,ReservarDatos,Confirmacion critical
    class Login,CodigoOTP,Dashboard,Servicios,ServicioEditor,Bloqueos,Clientes adminScreen
```

**Leyenda:**
- 🟢 Verde: pantallas web públicas (implementadas: Home con datos reales)
- 🟡 Amarillo grueso: flujo de reserva — crítico del negocio (skeletons actuales, necesitan implementación)
- 🔵 Azul: admin (implementados: login OTP + servicios funcionan en khal-admin deploy)
