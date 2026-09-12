# Reporte de producto, marketing y estilo — KHAL — 2026-09-12

## Producto
- Flujo definido: catálogo → reserva → seña manual → WhatsApp.
- Falta captura online de pagos (solo transferencia manual).
- Servicios visibles: lifting de pestañas, esmaltado semipermanente, diseño de cejas.
- Servicio no visible: Spa de Uñas Completo (is_visible: false).
- Catálogo obtenido vía mocks (services.ts) pending Supabase link.
- README y CHANGELOG creados recientemente.

## Marketing
- Mensajes disponibles en español e inglés (web y admin) vía next-intl.
- Falta revisión de tono es-AR (español rioplatense).
- No hay tests de paridad de claves i18n es/en.
- Rutas con [locale] para internacionalización.

## Estilo
- Tailwind v4 utilizado.
- Componentes con aria- parcial (header, slot-picker).
- Falta auditoría a11y completa (keyboard/contraste).
- Error y not-found boundaries implementados.
- Globals.css ajustado para Prettier (quitada tailwindConfig inexistente).

## Conclusiones
- Gates bloqueantes: Auth mock, RLS sin verificar, pagos online, reserva RPC.
- Listo para elegir licencia (MIT o similar) y aplicar parche de dependencias.
- Próximos pasos: decidir proveedor de pagos online, linkear proyecto Supabase, crear RPC de reserva con overlap e idempotencia.