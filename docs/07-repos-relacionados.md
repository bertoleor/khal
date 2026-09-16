# 07 — Repos relacionados

Búsqueda web (2026-09-15) de repos existentes similares: sistemas de
reservas para salón/estética/peluquería y agenda self-hosted.
Objetivo: saber qué copiar, qué evitar y confirmar que el nombre
KHAL está libre en este nicho.

> Nota: "khal" también es un programa CLI de calendario (Calendario
> CalDAV en terminal), sin relación con este proyecto. En el nicho
> salón/booking no aparece ningún repo llamado "khal": el nombre
> está libre ahí.

## Específicos de salón/estética

| Repo | Stack | Qué mirar | Relación con KHAL |
|------|-------|-----------|-------------------|
| [kenigbolo/openSalon](https://github.com/kenigbolo/openSalon) | Booking + management para belleza/peluquería | Modelo de datos proveedor↔cliente, gestión de servicios | El más cercano en concepto; KHAL es más chico (sin login de clienta, seña por transferencia + WhatsApp) |
| [clawnify/OpenSalon](https://github.com/clawnify/OpenSalon) | Alternativa open-source a Fresha/Salonist | Alcance tipo marketplace (multi-salong) | Alcance opuesto: KHAL es single-estudio, sin marketplace |
| [salonbooking/salonbooking](https://github.com/salonbooking/salonbooking) | Plugin WordPress de reservas | Reglas de agenda (servicios, duraciones, bloqueos) | Referencia de reglas de negocio, no de stack (KHAL: Next.js + Supabase) |
| [salonkee-open-source](https://github.com/salonkee-open-source) | Org open-source (Salonkee) | Cómo una org comercial abre parte del código | Referencia de licensing, no de código directo |
| [DinukaEk/salon-booking-system](https://github.com/DinukaEk/salon-booking-system) | Sistema sólo-staff | Flujo interno de gestión de turnos | KHAL invierte el foco: la clienta se agenda sola |
| [omshukla03/Salon-Appointment-Booking](https://github.com/omshukla03/Salon-Appointment-Booking) | App de turnos de salón | CRUD básico de appointments | Toy-grade; sirve como checklist mínimo, no como base |
| [kashishkushwaha09/Salon-Appointment-Booking-System](https://github.com/kashishkushwaha09/Salon-Appointment-Booking-System) | Reservas online + panel admin + recordatorios/cancelaciones | Recordatorios y cancelaciones | Esas dos features están en el roadmap de KHAL (ver `03-funciones.md`); mirar su enfoque antes de implementar |
| [Div685/Salon-Appointments](https://github.com/Div685/Salon-Appointments) | React + Redux, API de appointments | Separación front/API de turnos | KHAL ya resuelve esto con Server Actions + RPC `create_booking` |
| [xkalepar/beauty-salon-template02](https://github.com/xkalepar/beauty-salon-template02) | Next.js App Router + TS + Tailwind 4 + Prisma/MongoDB, dashboard admin, UploadThing | Template visual moderno de estética con booking + admin | El más cercano en stack; útil como referencia de UI/maquetación (KHAL usa Supabase, no Prisma/Mongo) |
| [Haar (Opencals)](https://opencals.com/blog/templates/haar) | Next.js + Storefront SDK, Stripe, cuentas de cliente, MIT | Booking con staff/sede, checkout multi-paso, SEO, mobile-first | Referencia de calidad "production-ready"; KHAL difiere a propósito (sin Stripe ni cuentas: transferencia + WhatsApp, mercado AR) |

## Infra de agenda genérica (self-hosted)

| Repo | Qué es | Qué mirar |
|------|--------|-----------|
| [calcom/cal.diy](https://github.com/calcom/cal.diy) | Infra de scheduling abierta (Cal.com) | Lógica de disponibilidad/slots como estándar de facto |
| [alextselegidis/easyappointments](https://github.com/alextselegidis/easyappointments) (vía [deepwiki](https://deepwiki.com/alextselegidis/easyappointments)) | Agenda self-hosted clásica (PHP) | Reglas de negocio probadas (servicios, proveedores, bloqueos); stack distinto, sólo referencia |

## Conclusión para KHAL

1. Nada de lo encontrado cubre el combo KHAL: single-estudio AR,
   sin login de clienta, seña por transferencia, confirmación por
   WhatsApp, voseo rioplatense.
2. Referencias que más rinden: `openSalon` (modelo), `beauty-salon-template02`
   (UI Next.js), `Haar` (calidad de booking), `Easy!Appointments` (reglas).
3. Nombre "khal" sin colisiones en este nicho (**UNVERIFIED** contra
   búsqueda exhaustiva de marcas; sólo búsqueda web GitHub/general).
