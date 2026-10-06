# Reporte de producto, marketing y estilo — KHAL — 2026-09-12
> Parte de: [[projects/khal/README|README]] · Relacionados: [[INDICE-REPORTS]] · [[04-branding-identidad]] · [[05-marketing-tono]]

> TODO UNVERIFIED. Nada borrado. Basado en lectura del código real (`apps/web`, `apps/admin`, `packages/*`) + `docs/auditoria-nocturna-2026-09-12.md` + `package.json`. Provider nvidia. No hay proyecto Supabase vivo ni deploy comprobado; los datos del catálogo y de disponibilidad son mocks en memoria.

---

## 1. Producto

**Qué es.** Agenda virtual de turnos para un estudio de estética (pestañas / uñas / cejas). Monorepo pnpm + Turbo (Next.js 15.5.6, React 19, Tailwind v4) con dos apps (`web` pública, `admin` para la dueña) y 6 packages compartidos.

**Flujo de cliente (web):** catálogo → detalle de servicio → reserva (día + horario + datos) → seña → WhatsApp.

**Catálogo (`apps/web/src/lib/mocks/services.ts`) — mock en memoria, pendiente link a Supabase:**

| Servicio | Precio (ARS) | Duración | Buffer | Seña | Visible |
|---|---|---|---|---|---|
| Lifting de Pestañas | $45.000 | 60' | 15' | 30% (3000bp) | ✅ |
| Esmaltado Semipermanente | $38.000 | 75' | 15' | fija $15.000 | ✅ |
| Diseño de Cejas | $28.000 | 45' | 10' | — (full) | ✅ |
| Spa de Uñas Completo | $55.000 | 90' | 15' | — | ❌ (`is_visible: false`) |

**Disponibilidad (`packages/db/src/availability.ts`).** Slots computados al vuelo (`computeAvailableSlots`), nunca pre-generados. Horario de negocio en `apps/web/src/lib/mocks/schedule.ts`: lun–sáb 09:00–18:00, domingo cerrado (`weekday === 0` devuelve `null`); bloqueos de "hoy" también mockeados.

**Reserva (`apps/web/src/lib/actions/booking.ts`).** Server action con Zod en el borde. Llama a la RPC `create_booking` (SECURITY DEFINER, con overlap + idempotencia por clave UUID). Sin env de Supabase → devuelve `unavailable` amigable (sin mock de doble reserva).

**Pagos.** Dos caminos, ambos sin verificar contra un proveedor real:
1. **Manual (hoy operativo):** transferencia por alias/CBU + comprobante por WhatsApp (`PaymentStep` + `buildWhatsAppLink`). Datos de cobro mockeados en `settings.ts` (alias `khal.estudio`).
2. **Mercado Pago (código listo, SIN credenciales):** `lib/mercadopago.ts` integra Checkout Pro por REST puro (sin SDK), `external_reference` con el id de turno, webhook con HMAC-SHA256 (`verifyMercadoPagoSignature`, `timingSafeEqual`) y confirmación por re-fetch del pago (`getMercadoPagoPayment`, nunca confía en el body del webhook). `createCheckoutPreference` en `actions/payment.ts` calcula el monto server-side (el cliente no puede tocar el precio). Sin `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET` → cae al flujo manual.

**Admin (`apps/admin`).** Agenda del día, clientes (LTV, no-show, lista negra), servicios (mostrar/ocultar, suba 10% por inflación) y bloqueos de agenda (feriado/vacaciones/evento/bloqueo). Datos también mockeados en memoria.

**Máquina de estados de turno (`packages/validations/src/index.ts`).** `pendiente → confirmado/cancelado/no_asistio`, sin saltos arbitrarios (`canTransitionAppointment`).

---

## 2. Marketing

**Internacionalización.** `next-intl` en ambas apps con rutas `[locale]` y `locales: ['es', 'en']`, `defaultLocale: 'es'` (`i18n/routing.ts`). Mensajes en `messages/es.json` y `messages/en.json`.

**Tono.** El español usa voseo rioplatense ("Elegí tu servicio", "Agendá", "Revisá", "enviá el comprobante"). Coherente en web y admin. El inglés es neutral. **Sin revisión formal de tono es-AR dedicada** (queda pendiente por 21-content).

**Copys clave (web es):**
- Catálogo: "Elegí tu servicio y agendá tu turno."
- Reserva: "Elegí el día" / "Elegí el horario".
- Pago: "Transferí {amount} y enviá el comprobante por WhatsApp para confirmar tu turno."
- Error friendly con códigos semánticos (duplicate / conflict / unavailable / blacklisted), cada uno con mensaje distinto.

**Admin (es):** "Subir 10% a seleccionados", "Quitar de lista negra", "Bloqueos de agenda: Feriados, vacaciones o cierres que se restan de la disponibilidad."

**Gaps de marketing/contenido:**
- Sin test de **paridad de claves** es/en (G7, P2).
- Sin revisión de tono es-AR (G8-adjacent, P2).
- Los mensajes `error.*` y `notFound.*` están duplicados en ambas apps (web y admin) — mantenimiento manual.
- Sin página de confirmación/éxito de pago (URLs `back_urls` de MP apuntan a `/pago/exito`, `/pago/error`, etc., que no existen en el árbol `app/`) — UNVERIFIED.

---

## 3. Estilo

**Stack visual.** Tailwind v4 (`@import 'tailwindcss'` en `globals.css`, sin `tailwind.config` — por eso se quitó la referencia inexistente en `.prettierrc.json`). Paleta minimalista: `slate` (grises) para estructura, `emerald` para acciones de pago/WhatsApp, `amber` (seña pendiente) y `emerald` (confirmada) como estados semánticos.

**Layout.** Mobile-first (`max-w-md` en header), UI de tarjeta (`rounded-2xl border border-slate-200 bg-white`), botones `rounded-full`, dosis de `backdrop-blur` en el header sticky. Interacciones con `active:scale-[0.98]` (catalog) y `focus-visible:outline-2` (accesibilidad de foco).

**Componentes clave:**
- `Header` (brand "Khal", sticky).
- `CatalogGrid` (cards con inicial del servicio como avatar placeholder).
- `SlotPicker` (días + horarios, `aria-pressed` para selección).
- `PaymentStep` (alias/CVU con botón copiar `aria-live="polite"`, link WhatsApp).
- `Field`, `EmptyState` compartidos.

**Accesibilidad (parcial, en verde por `eslint-plugin-jsx-a11y`):**
- `aria-pressed` en selectores de día/horario ✅
- `role="status"` en estados de pago ✅
- `aria-live` en copy ✅
- Foco visible con `focus-visible:outline` ✅
- **Pendiente:** auditoría a11y completa (keyboard / contraste) — G8 P2, UNVERIFIED.

**Manejo de errores visual.** `error.tsx` y `not-found.tsx` en ambas apps, con mensajes i18n y CTA "Intentar de nuevo" / "Ir al inicio".

---

## 4. Conclusiones y estado

**Gates BLOQUEANTES (P0, todos UNVERIFIED):**
- **Auth** mock (`khal_role` cookie) → migrar a JWT Supabase (`app_metadata.role`). Código listo en ADR-0001, fallback cookie activo.
- **RLS** en migración pero sin DB viva linkeada → sin verificar.
- **Pagos online** sin credenciales (MP código listo, activo el flujo manual).
- **RPC `create_booking`** sin Supabase → sin backend real de reserva.

**Nota que corrige la auditoría:** la auditoría nocturna marcaba "sin captura online (solo manual, G3)". El código de Mercado Pago YA existe y está integrado (preferencia + webhook HMAC + re-verificación), pero no está verificado contra un proveedor real. La decisión MP vs manual sigue abierta a nivel de provisioning, no de código.

**P1:** LICENSE (gap legal); paridad i18n; revisión de tono es-AR.
**P2:** deps patch-safe (3); test de claves i18n; auditoría a11y dedicada.

**Próximos pasos sugeridos:** linkear proyecto Supabase (desbloquea G2/G4 y convierte mocks en queries reales), decidir MP como proveedor y provisionar credenciales (desbloquea G3), aplicar ADR-0001 sobre Supabase Auth, agregar LICENSE.