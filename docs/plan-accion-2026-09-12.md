# KHAL — Plan de acción 2026-09-12 (UNVERIFIED)
> Parte de: [[projects/khal/README|README]] · Relacionados: [[KHAL-plan-2026-09-14]] · [[INDICE-PLANS]] · [[06-estado-gates]]

> Fuente: consolidado 2026-09-12 + `docs/reporte-producto-marketing-estilo-2026-09-12.md`. Sin Supabase vivo ni deploy comprobado; mocks en memoria. Nada aplicado sin OK de la dueña.

## Fase 1 — Auth real + DB viva · due 2026-09-19 · dueño: Backend Developer senior + Security Engineer senior
- G1: cookie `khal_role` seteable por cliente → JWT Supabase (aplicar ADR-0001).
- G2: linkear Supabase, aplicar migraciones RLS, verificar contra DB viva.
- G4: reserva real vía RPC `create_booking` (FOR UPDATE + overlap + idempotencia) en vez de mocks.
- **Gate:** login con JWT + booking concurrente sin doble-reserva contra DB viva.

## Fase 2 — Pagos: MP o manual-only · due 2026-09-26 · dueño: Backend Developer senior
- **Decisión humana (dueña):** provisionar `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET` o declarar manual-only.
- Si MP: crear páginas `/pago/exito|error|pendiente` (hoy `back_urls` apuntan a rutas inexistentes); verificar webhook HMAC en vivo.
- Si manual: blanquear transferencia + WhatsApp como flujo oficial en copy.
- **Gate:** pago de prueba punta a punta en el camino elegido.

## Fase 3 — Contenido/estilo + legales · due 2026-10-03 · dueño: Content/SEO senior + QA senior
- LICENSE (gap P1); test de paridad de claves es/en; revisión formal de tono es-AR (voseo hoy coherente pero sin revisión).
- Auditoría a11y completa (keyboard/contraste); deduplicar mensajes `error.*`/`notFound.*` entre web y admin.
- **Gate:** `pnpm build` 8/8 + 33/33 tests verdes + LICENSE presente.
