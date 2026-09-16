# 05 — Marketing y tono

Fuente: `DOCS/reporte-... §2`, auditoría 2026-09-14, mensajes i18n
(`apps/*/messages/es.json` + `en.json`), proposal (landing link-in-bio).

## Posicionamiento

Estudio de estética (pestañas/uñas/cejas) con reserva autónoma desde el
celular: "Elegí tu servicio y agendá tu turno." Diferencial: sin llamados ni
DM — catálogo claro, horario real, seña por transferencia, confirmación por
WhatsApp.

## Estructura i18n

- `next-intl` en ambas apps, rutas `[locale]`, `locales: ['es','en']`,
  default `es` (`i18n/routing.ts`).
- Paridad verificada 2026-09-14: web 48/48 + admin 39/39 claves idénticas
  es/en, **sin drift**.
- Gaps: mensajes `error.*`/`notFound.*` duplicados entre apps (mantenimiento
  manual); `lang="es"` genérico en vez de `es-AR`.

## Tono es-AR (voseo, verificado 100% coherente)

- Imperativos voseantes: "Elegí", "Agendá", "Revisá", "Transferí", "enviá".
- Inglés neutral.
- Único defecto duro: `payment.whatsappMessage` abre con `"Hola!"` sin `¡`.
  Menor: capitalización inconsistente en `book`.
- Sin revisión formal dedicada de tono (pendiente 21-content).

## Copys clave (web es)

| Momento | Copy |
|---|---|
| Catálogo | "Elegí tu servicio y agendá tu turno." |
| Reserva | "Elegí el día" / "Elegí el horario" |
| Pago | "Transferí {amount} y enviá el comprobante por WhatsApp para confirmar tu turno." |
| Error | Un mensaje por código (`duplicate`/`conflict`/`unavailable`/`blacklisted`), friendly + CTA |
| Admin | "Subir 10% a seleccionados", "Quitar de lista negra", "Bloqueos de agenda: Feriados, vacaciones o cierres que se restan de la disponibilidad." |

## Canales

- **WhatsApp:** comprobante de seña (`wa.me` pre-llenado vía
  `buildWhatsAppLink`) + recordatorio 24h por WhatsApp Business API vía n8n
  (pendiente provisioning).
- **Telegram:** alertas a la dueña (turno nuevo / confirmación).
- **Landing link-in-bio** (en spec, por construir): logo, hamburguesa,
  quick-link cards, CTA primario.
- Sin captura online hasta decidir MP vs manual-only (ver doc 06).
