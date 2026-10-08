-- Khal — 0009: hardening de grants `anon` en tablas public (audit H2, P3).
--
-- [t_d56e1e7e / ORN-168 H2] La DB viva nació con `anon` ALL (SELECT/INSERT/UPDATE/
-- DELETE/TRUNCATE/REFERENCES/TRIGGER) en TODAS las tablas public: RLS es hoy la
-- única barrera. Si una policy se rompe o una tabla nace sin policies, anon tiene
-- privilegio de base completo. Este fix reduce esa superficie a lo que la
-- superficie pública real declara (defense in depth):
--
--   * Tablas de superficie pública solo-lectura (services, providers,
--     business_hours, provider_schedules): se mantiene SELECT; se revoca
--     UPDATE/DELETE/TRUNCATE (y INSERT/REFERENCES/TRIGGER, que anon tampoco usa).
--   * Tablas internas sin superficie pública (appointments, clients,
--     organizations, notes, tags, global_settings, calendar_exceptions,
--     provider_services, client_tags): REVOKE ALL — el storefront anon jamás
--     las toca directo (verificado contra apps/web main 2026-10-08: solo
--     services SELECT + rpc create_booking; el webhook MP usa service_role).
--
-- Fuera de scope (intencional, ver comentario del card): audit_logs,
-- security_logs, processed_events, failed_webhooks_log (superficie insert-only
-- propia de webhooks/logs) — follow-up de hardening aparte.
--
-- ACOPLAMIENTO 0008 (khal/t_f3bec8b8, in-flight): 0008 crea la policy
-- `global_settings_anon_select` (3 payment keys del storefront). Esa policy
-- necesita GRANT SELECT para funcionar por PostgREST: quien aplique 0008
-- DEBE re-grantear SELECT a anon en global_settings (su policy es
-- explícitamente SELECT-only, sin write path).
--
-- No toca policies RLS existentes. No toca grants de funciones (create_booking
-- es SECURITY DEFINER: corre como postgres y no depende de grants de tabla de
-- anon; EXECUTE en funciones queda como está).
--
-- Idempotente por naturaleza: REVOKE sobre privilegios ya ausentes es no-op.
--
-- Down: 0009_revoke_anon_grants.down.sql (re-grants originales para rollback
-- de emergencia; NO borra la fila del ledger).
--
-- Numeración: el ticket decía 0007 pero 0007 (business_hours_guard) y 0008
-- (global_settings anon select) ya existen en ramas in-flight — renumerado a
-- 0009 para no colisionar versiones en supabase_migrations.schema_migrations.

begin;

-- ---------------------------------------------------------------------------
-- Grupo A — superficie pública solo-lectura: quedan con SELECT únicamente.
-- ---------------------------------------------------------------------------

revoke insert, references, update, delete, trigger, truncate
  on public.services from anon;

revoke insert, references, update, delete, trigger, truncate
  on public.providers from anon;

revoke insert, references, update, delete, trigger, truncate
  on public.business_hours from anon;

revoke insert, references, update, delete, trigger, truncate
  on public.provider_schedules from anon;

-- ---------------------------------------------------------------------------
-- Grupo B — tablas internas: anon no necesita nada.
-- ---------------------------------------------------------------------------

revoke all privileges
  on public.appointments from anon;

revoke all privileges
  on public.clients from anon;

revoke all privileges
  on public.organizations from anon;

revoke all privileges
  on public.notes from anon;

revoke all privileges
  on public.tags from anon;

revoke all privileges
  on public.global_settings from anon;

revoke all privileges
  on public.calendar_exceptions from anon;

revoke all privileges
  on public.provider_services from anon;

revoke all privileges
  on public.client_tags from anon;

-- ---------------------------------------------------------------------------
-- Ledger (convención 0003..0006 de este repo: solo version; verificado contra
-- information_schema.columns de la DB viva — version text NOT NULL, el resto
-- nullable).
-- ---------------------------------------------------------------------------

insert into supabase_migrations.schema_migrations (version)
values ('0009')
on conflict (version) do nothing;

commit;
