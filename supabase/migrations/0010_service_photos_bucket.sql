-- Khal — 0010: service-photos storage bucket + staff-only write policies
-- (khal-admin-100-operable T6)
--
-- The admin catalog photo upload needs a home: bucket `service-photos`,
-- public READ (the public URL is what services.photo_path stores), writes
-- only for org staff (admin/manager claims), 4MB cap mirroring the
-- action-level gate. Additive and idempotent: safe to re-run.
--
-- Numbered 0010 (not 0008): the live ledger already holds 0009 (applied from
-- a loop branch, not in main) — versions are a registry, not a sequence.

begin;

-- 1. Bucket: public read, 4MB object cap.
insert into storage.buckets (id, name, public, file_size_limit)
values ('service-photos', 'service-photos', true, 4194304)
on conflict (id) do nothing;

-- 2. Policies on storage.objects (RLS enabled there by platform default).
create policy "service_photos_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'service-photos');

create policy "service_photos_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'service-photos'
    and public.org_role() in ('admin', 'manager')
  );

create policy "service_photos_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'service-photos'
    and public.org_role() in ('admin', 'manager')
  )
  with check (
    bucket_id = 'service-photos'
    and public.org_role() in ('admin', 'manager')
  );

create policy "service_photos_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'service-photos'
    and public.org_role() in ('admin', 'manager')
  );

-- 3. Ledger row so `supabase db push` / drift detection stays in sync.
insert into supabase_migrations.schema_migrations (version)
values ('0010')
on conflict (version) do nothing;

commit;
