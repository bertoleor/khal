# KHAL — Supabase go-live: seed + create_booking verification

> **Fecha:** 2026-09-28 · **Autor:** loop nocturno orquestador (rol 06-DBA) · **Issue:** ORN-80 · **Estado:** verificado contra DB viva

## Qué se hizo

1. **`supabase/seed.sql` (nuevo)** — seed de producción idempotente: 1 organización, 4 providers, 4 servicios (mismos UUIDs del mock `apps/web/src/lib/mocks/services.ts`), 4 offerings, 6 business_hours (Lun-Sáb 09:00-18:00), 3 global_settings (alias/CVU/whatsapp). Aplicado a la DB viva `epykihchzlbbptrvvawg` (ref de `project-map.md`, token t2).
2. **`0006_fix_create_booking_search_path.sql` (+ `.down.sql`) (nuevo)** — fix del bug P0 encontrado al ejercitar el RPC: `0003` fijó `set search_path = public` en `create_booking`, pero pgcrypto vive en el schema `extensions` en Supabase hosted → `digest()` fallaba con 42883 en todo booking que pasaba la validación de servicio. Los tests T1/T2 (`invalid`) no lo detectaban porque salen en el paso 1, antes del hash de phone.
3. **Suite E2E del RPC contra DB viva** (scripts abajo, no versionados): matriz completa ejecutada 2026-09-28, DB dejada en estado seed puro (0 appointments, 0 clients, 0 exceptions).

## Verificación (evidencia, 2026-09-28)

| Test | Input | Resultado esperado | Resultado real |
|---|---|---|---|
| T1 | service_id inexistente | `invalid` | `{'ok': false, 'code': 'invalid'}` ✓ |
| T2 | servicio oculto (Spa de Uñas) | `invalid` | `{'ok': false, 'code': 'invalid'}` ✓ |
| TT3 | fecha pasada | `invalid` | `{'ok': false, 'code': 'invalid'}` ✓ |
| T4 | happy path +30d 10:00 + idempotency key | `ok` + booking_id | `{'ok': true, 'code': 'ok', 'booking_id': '285c534c…'}` ✓ |
| T5 | misma idempotency key re-enviada | mismo booking_id | mismo id ✓ |
| T6 | mismo slot, key distinta | `conflict` | `{'ok': false, 'code': 'conflict'}` ✓ |
| T7 | mismo phone, slot distinto | `duplicate` | `{'ok': false, 'code': 'duplicate'}` ✓ |
| T8 | calendar exception (block) cubriendo el slot | `unavailable` | `{'ok': false, 'code': 'unavailable'}` ✓ |
| T8b | mismo día fuera del bloqueo | `ok` | `{'ok': true, 'code': 'ok'}` ✓ |

**Métricas post-seed:** organizations=1, providers=4, services=4 (3 visibles), provider_services=4, business_hours=6, global_settings=3. Idempotencia del seed verificada por doble ejecución (mismos counts).

**Métricas post-0006:** `proconfig = search_path=public, extensions`, ledger de migraciones 0001→0006, RLS intacto (18 tablas con RLS, 0 sin).

## Detalles técnicos (el porqué)

- **Bug 42P10 en el primer intento de seed:** `business_hours` no tiene unique en `(organization_id, day_of_week)` — solo el pkey en `id`. El seed usa UUIDs determinísticos por día (`20000000-…-000N`) con `on conflict (id) do nothing`.
- **Bug 42883 (0003):** SECURITY DEFINER con `search_path = public` oculta `extensions.digest`. El fix agrega `extensions` al search_path de la función. En hosted Supabase `CREATE` en `public` está revocado a anon/authenticated, así que no hay riesgo de shadowing de `digest()`.
- **T8 casi falso-negativo dos veces:** (1) mi primer INSERT de exception omitió `exception_type`/`title` NOT NULL → 23502 silencioso; (2) el slot 10:00 ART+30d coincidía con un appointment de test previo no limpiado → `conflict` real, no `unavailable`. Lección: al probar `unavailable`, usar phone nunca usado Y fecha sin appointments previos.

## Qué sigue

- **ORN-80 remainder:** la web sigue leyendo el catálogo desde mocks (`apps/web/src/lib/actions/catalog.ts` — `getCatalog`/`getService`). El swap a queries Supabase tipadas es el siguiente slice (los UUIDs ya coinciden 1:1, cero migración de datos).
- **Deploy:** migraciones 0001-0006 + seed ya viven en la DB de producción (aplicadas vía Management API). El repo queda como fuente de verdad; cualquier re-deploy con `supabase db push` es idempotente.
- **Admin:** crear staff en Supabase Auth con `app_metadata.role` (ORN-79 remainder) para operar el catálogo desde el admin.
