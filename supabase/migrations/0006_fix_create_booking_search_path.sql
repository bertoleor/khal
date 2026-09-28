-- Khal — 0006: fix create_booking search_path (digest 42883 on hosted Supabase).
--
-- Deployed evidence (live DB, 2026-09-28): pgcrypto installs to schema
-- `extensions` on hosted Supabase (pg_extension.extnamespace -> nspname
-- 'extensions'), but 0003 pinned `set search_path = public` on the
-- create_booking SECURITY DEFINER function. Step 3 calls
-- encode(digest(btrim(p_phone), 'sha256'), 'hex') — with public-only
-- search_path that resolves to 42883 "function digest(text, unknown) does
-- not exist". Every booking that passes service/provider validation crashes
-- (invalid-service calls exit at step 1 and hid the bug from smoke tests).
--
-- Fix: add `extensions` to the function-local search_path. Security note:
-- hosted Supabase revokes CREATE on public from anon/authenticated, so no
-- untrusted role can plant a malicious digest() shadow in public; the definer
-- (postgres) still resolves pgcrypto's digest via extensions first-fallback.
--
-- Down: 0006_fix_create_booking_search_path.down.sql.

begin;

alter function public.create_booking(
  uuid, text, text, text, date, integer, uuid, text
) set search_path = public, extensions;

insert into supabase_migrations.schema_migrations (version)
values ('0006')
on conflict (version) do nothing;

commit;
