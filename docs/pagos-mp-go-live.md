# Pagos MP — checklist de go-live (G3)

> **Búsqueda:** keywords: `mp, mercado pago, go-live, checkout, webhook, credenciales, g3, back-urls` · clasificación: `operaciones` · estado: canónico · actualizado: 2026-10-20

> Parte de: [[06-estado-gates]] · Relacionados: [[adr/ADR-0002-payment-dual-flow]] · [[supabase-golive-2026-09-28]]

Estado del gate **G3** al 2026-10-20: el flujo dual (MP Checkout Pro +
transferencia manual) está **code-complete y verificado por tests** — incluye
las páginas de retorno `/pago/exito|pendiente|error` que antes no existían y el
webhook endurecido en main (commit 4865376: entrega por query-params, rollback
del claim, manifest corto cuando MP omite `x-request-id`, timeout 8s).
Lo único que falta para cobrar en vivo son **credenciales y configuración del
lado del panel de Mercado Pago** — acciones de la dueña, no del código.

## Qué hay (verificado por la suite, 40/40 verde)

- **Preferencia + checkout**: `createCheckoutPreference` con `back_urls` a
  `/pago/exito`, `/pago/error`, `/pago/pendiente` y `auto_return: approved`.
- **Páginas de retorno**: `/pago/{exito,pendiente,error}` bajo `[locale]`,
  sanitizan los query params que MP agrega (`payment_id` numérico,
  `external_reference` uuid), CTA de WhatsApp fail-soft (sin teléfono
  configurado, no se muestra) y `noindex`.
- **Webhook HMAC** (`/api/webhooks/mercadopago`): firma validada sobre
  `id;x-request-id;ts;data.id`, tolerante al manifest corto, evento claim
  idempotente con rollback, re-fetch del pago contra la API de MP antes de
  confirmar la reserva. Tests: `mercadopago-signature.test.ts` (6) +
  `mercadopago-webhook.test.ts` (8) + `pago-pages.test.tsx` (17).

## Checklist de la dueña (go-live)

1. **Credenciales de producción MP** — panel de developers
   (mercadopago.com.ar/developers/panel → Tu aplicación → Credenciales de
   producción): copiar el **Access Token de producción** (empieza con
   `APP_USR`).
2. **Variables de entorno en el host** donde corre la web (mismos nombres que
   `.env.example`):
   - `MP_ACCESS_TOKEN` — el token APP_USR del paso 1.
   - `MP_WEBHOOK_SECRET` — la **clave secreta para webhooks** del panel MP
     (Sección de webhooks → "Clave secreta"). Sin esta clave el webhook
     rechaza toda notificación.
   - `APP_URL` — la URL pública del deploy (ej. `https://tudominio.com`); de
     acá salen las `back_urls`.
3. **Registrar el webhook en el panel MP**: URL
   `{APP_URL}/api/webhooks/mercadopago` con el evento **Pagos** (payments).
4. **Smoke test**: reservar un turno con pago online, pagar con tarjeta de
   prueba (o un pago real chico) y verificar:
   - el browser vuelve a `/pago/exito?payment_id=...`,
   - la reserva queda **confirmada** sola (el webhook confirma; no hace falta
     tocar nada a mano),
   - en el panel MP → Actividad aparece el cobro.
5. **Fallback**: mientras MP no esté provisionado, el flujo manual
   (alias/CVU + WhatsApp) sigue funcionando igual — es el comportamiento
   actual y no se rompe con nada de esto.

## Qué NO está verificado (hasta hacer el paso 4)

- Credenciales reales contra producción (`MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET`).
- La URL del webhook registrada en el panel de MP.
- Un roundtrip completo en vivo (pago real → webhook → reserva confirmada).

Mientras eso no se haga, G3 sigue **UNVERIFIED en vivo** por honestidad de la
baseline — el código está listo, la decisión de activarlo es de la dueña
(ADR-0002).
