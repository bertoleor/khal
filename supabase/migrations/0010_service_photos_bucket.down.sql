-- Khal — 0010 down: drop the service-photos bucket, its policies and the
-- ledger row. Deleting the bucket cascades its objects (storage.objects FK).
begin;

drop policy if exists "service_photos_public_read" on storage.objects;
drop policy if exists "service_photos_insert" on storage.objects;
drop policy if exists "service_photos_update" on storage.objects;
drop policy if exists "service_photos_delete" on storage.objects;

delete from storage.buckets where id = 'service-photos';

delete from supabase_migrations.schema_migrations where version = '0010';

commit;
