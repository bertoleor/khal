-- Khal — 0009 rollback: restaurar los grants `anon` previos (emergencias ONLY).
--
-- Revierte 0009_revoke_anon_grants.sql devolviendo el estado pre-migración
-- (anon ALL en las 13 tablas tocadas). WARNING: esto re-introduce el hallazgo
-- H2 del audit ORN-168 — RLS vuelve a ser la única barrera. Solo para rollback
-- de emergencia donde el 0009 mismo deba deshacerse; aparear con fix posterior.
--
-- Nota 0008: si 0008 (global_settings anon select) ya se aplicó, el re-grant
-- de SELECT en global_settings restaura también su superficie de pagos.
--
-- No borra la fila del ledger: supabase_migrations es el history del CLI;
-- borrar filas a mano desincroniza `supabase db push` (misma convención que
-- el down de 0006).

begin;

-- Grupo A — restaurar ALL (estado pre-0009).
grant all on public.services to anon;
grant all on public.providers to anon;
grant all on public.business_hours to anon;
grant all on public.provider_schedules to anon;

-- Grupo B — restaurar ALL (estado pre-0009).
grant all on public.appointments to anon;
grant all on public.clients to anon;
grant all on public.organizations to anon;
grant all on public.notes to anon;
grant all on public.tags to anon;
grant all on public.global_settings to anon;
grant all on public.calendar_exceptions to anon;
grant all on public.provider_services to anon;
grant all on public.client_tags to anon;

commit;
