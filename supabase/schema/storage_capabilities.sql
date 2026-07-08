-- Storage bucket + policies for admin-managed Imkoniyatlar videos.
--
-- Bucket `capabilities` holds the video files (videos/<uuid>.mp4) and their
-- posters (posters/<uuid>.jpg). It is PUBLIC-READ because these are marketing
-- clips served openly on the Capabilities page (signed URLs would add per-render
-- round-trips and expiry breakage for no confidentiality benefit). WRITES are
-- locked to admins (public.is_admin()).
--
-- Depends on public.is_admin() from supabase/schema/admins.sql (run that first).
-- Idempotent. Run in: Supabase Dashboard → SQL Editor.

-- 1. Create the bucket (public read) with server-side size + MIME limits so
--    oversize / wrong-type uploads are rejected even if a client bypasses its
--    own checks. 100 MB cap matches the client-side guard in src/lib/videos.ts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'capabilities',
  'capabilities',
  true,
  104857600, -- 100 MB
  array['video/mp4','video/webm','image/jpeg','image/png','image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. RLS on storage.objects, scoped to this bucket.
--    Public read; admin-only insert/update/delete.
drop policy if exists "Public read capabilities" on storage.objects;
create policy "Public read capabilities"
  on storage.objects
  for select
  using (bucket_id = 'capabilities');

drop policy if exists "Admins upload capabilities" on storage.objects;
create policy "Admins upload capabilities"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'capabilities' and public.is_admin());

drop policy if exists "Admins update capabilities" on storage.objects;
create policy "Admins update capabilities"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'capabilities' and public.is_admin())
  with check (bucket_id = 'capabilities' and public.is_admin());

drop policy if exists "Admins delete capabilities" on storage.objects;
create policy "Admins delete capabilities"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'capabilities' and public.is_admin());
