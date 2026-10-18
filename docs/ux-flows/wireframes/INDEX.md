# Wireframes — Screen Inventory

| Screen | File | Use Cases | Key elements | Outgoing links |
|--------|------|-----------|---------------|----------------|
| Home | [home.html](./home.html) | UC-001 | Hero + catálogo grid (3 servicios) | servicio-detalle.html |
| Detalle Servicio | [servicio-detalle.html](./servicio-detalle.html) | UC-001, UC-002 | Foto, precio, duración, seña, CTA "Reservar" | home.html, reservar.html |
| Reservar | [reservar.html](./reservar.html) | UC-002 ⭐ | Date picker (30 días), time slots, form datos, resumen con seña | servicio-detalle.html, confirmacion.html |
| Confirmación | [confirmacion.html](./confirmacion.html) | UC-002 ⭐ | Código reserva, detalle, seña, WhatsApp CTA | home.html |
| Admin Login | [admin-login.html](./admin-login.html) | UC-003 | Email + OTP 6 dígitos | admin-dashboard.html |
| Admin Dashboard | [admin-dashboard.html](./admin-dashboard.html) | UC-003-006 | Stats (turnos hoy, señas pendientes), menú módulos | admin-servicios.html, admin-login.html |
| Admin Servicios | [admin-servicios.html](./admin-servicios.html) | UC-004 | Lista con badges activo/inactivo, botón "+ Nuevo", editor Tiptap + foto 4MB | admin-dashboard.html |

**Path de navegación del flujo crítico:**
```
home.html → servicio-detalle.html → reservar.html → confirmacion.html → (WhatsApp)
```

**Abrí `home.html` en un browser y navegá con taps** — todo el flujo es clickable.
