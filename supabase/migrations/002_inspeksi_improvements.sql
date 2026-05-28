-- =========================================================
-- 002 — Perbaikan Pengisian Inspeksi
-- =========================================================
-- 1. Kolom is_answered untuk membedakan item yang sudah benar-benar
--    diisi inspektor vs default "na" saat order dibuat.
-- 2. Status checklist boleh NULL agar item ad-hoc baru bisa dibuat
--    tanpa status awal.
-- 3. Bucket Supabase Storage untuk foto inspeksi (public read).
-- =========================================================

-- 1. Tambah kolom is_answered (default false)
alter table public.inspection_checklist_values
  add column if not exists is_answered boolean default false not null;

-- 2. Boleh NULL untuk status (item ad-hoc belum diisi)
alter table public.inspection_checklist_values
  alter column status drop not null;

-- 3. Bucket Storage untuk foto inspeksi
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inspection-photos',
  'inspection-photos',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
) on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 4. Policy minimum: siapa pun bisa baca (bucket public),
--    service role tetap bypass RLS untuk insert/update.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'inspection_photos_public_read'
  ) then
    create policy "inspection_photos_public_read"
      on storage.objects for select
      using (bucket_id = 'inspection-photos');
  end if;
end$$;
