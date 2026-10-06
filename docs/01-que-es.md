# 01 — Qué es KHAL
> Parte de: [[projects/khal/README|README]] · Relacionados: [[PRD-khal-minimo]] · [[KHAL-plan-2026-09-14]] · [[docs/proyectos/khal|khal]]

**KHAL — Virtual Appointment Agenda.** Agenda virtual de turnos para un
estudio de estética (pestañas / uñas / cejas). La clienta se agenda sola
desde el celular; la dueña gestiona todo desde un backoffice.

## Para quién

- **Clienta:** ve el catálogo, elige servicio, día y horario, deja sus datos
  (nombre/teléfono/email, sin contraseña) y deja la seña por transferencia,
  mandando el comprobante por WhatsApp.
- **Dueña (admin):** ve la agenda del día, gestiona clientes, servicios,
  precios y bloqueos (feriados/vacaciones/cierres).

## Propuesta de valor

- Reserva en <200ms de request; lo pesado (recordatorios, alertas) va
  asíncrono y nunca frena a la clienta.
- Sin doble-reserva: la RPC `create_booking` usa `FOR UPDATE` + control de
  overlap + idempotencia (**UNVERIFIED** contra DB viva).
- Dinero en centavos enteros (sin errores de float), fechas UTC con zona
  de negocio fija `America/Argentina/Buenos_Aires`.
- Bilingüe es/en con `es` por defecto y voseo rioplatense en español.

## Flujo punta a punta (web)

`catálogo → detalle de servicio → reserva (día + horario + datos) → seña → WhatsApp`

1. Catálogo (`apps/web/src/app/[locale]/page.tsx` + `CatalogGrid`).
2. Detalle (`servicios/[id]`).
3. Reserva (`reservar/page.tsx` + `SlotPicker` + `BookingForm`, Zod en el borde).
4. Seña: transferencia a alias/CBU + botón copiar + link `wa.me` pre-llenado
   (`PaymentStep` + `buildWhatsAppLink`).
5. Confirmación por WhatsApp (la dueña valida el comprobante).

## Estado actual (honesto)

- **Operativo hoy (mock):** flujo manual con datos en memoria
  (`apps/web/src/lib/mocks/*`: servicios, schedule, settings con alias
  `khal.estudio`, CBU y WhatsApp provisorios).
- **Código listo, sin verificar:** Mercado Pago (preferencia + webhook HMAC +
  re-fetch del pago), auth JWT Supabase (ADR-0001, fallback a cookie mock
  `khal_role`), RLS y RPC `create_booking` (migraciones en
  `supabase/migrations/0001-0003`, sin proyecto vivo linkeado).
- Sin URL productiva verificada, sin `LICENSE`.
