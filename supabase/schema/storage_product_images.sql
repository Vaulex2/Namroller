-- Storage bucket + policies for admin-managed product catalog images.
--
-- Bucket `product-images` holds product stills uploaded from ProductsPanel.
-- It is PUBLIC-READ (marketing images, same reasoning as the `capabilities`
-- bucket) with WRITES locked to admins (public.is_admin()).
--
-- Depends on public.is_admin() from supabase/schema/admins.sql (run that first).
-- Idempotent. Run in: Supabase Dashboard → SQL Editor.

-- 1. Create the bucket (public read) with server-side size + MIME limits so
--    oversize / wrong-type uploads are rejected even if a client bypasses its
--    own checks. 5 MB cap matches the client-side guard in src/lib/products.ts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. RLS on storage.objects, scoped to this bucket.
--    Public read; admin-only insert/update/delete.
drop policy if exists "Public read product-images" on storage.objects;
create policy "Public read product-images"
  on storage.objects
  for select
  using (bucket_id = 'product-images');

drop policy if exists "Admins upload product-images" on storage.objects;
create policy "Admins upload product-images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins update product-images" on storage.objects;
create policy "Admins update product-images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins delete product-images" on storage.objects;
create policy "Admins delete product-images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
