-- Storage bucket + policies for client-submitted quote attachments (photos /
-- short videos, e.g. of the site/product a buyer wants rollers for).
--
-- Bucket `quote-attachments` is PRIVATE (not public-read) — uploaded files
-- can show a client's premises and are treated as the same sensitivity class
-- as the phone/address already on quote_requests. Anonymous visitors may
-- INSERT only (write-only "drop box"): there is no anon select/update/delete,
-- so once uploaded a file cannot be listed, read, or overwritten by anyone
-- but an admin. Files are grouped by a client-generated draft UUID, uploaded
-- BEFORE the quote_requests row exists (see quote_requests.attachments_draft_id
-- in supabase/schema/quote_requests.sql), then linked to the row by the
-- submit-quote edge function.
--
-- Depends on public.is_admin() from supabase/schema/admins.sql (run that first).
-- Idempotent. Run in: Supabase Dashboard → SQL Editor, or via Supabase MCP
-- apply_migration (see handoff-quote-attachments.md for how this project deploys).

-- 1. Create the bucket (private) with server-side size + MIME limits so
--    oversize / wrong-type uploads are rejected even if a client bypasses its
--    own checks. 60 MB cap covers the largest allowed type (video).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quote-attachments',
  'quote-attachments',
  false,
  62914560, -- 60 MB
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. RLS on storage.objects, scoped to this bucket.
drop policy if exists "Anon upload quote-attachments" on storage.objects;
create policy "Anon upload quote-attachments"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'quote-attachments');

drop policy if exists "Admins read quote-attachments" on storage.objects;
create policy "Admins read quote-attachments"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'quote-attachments' and public.is_admin());

drop policy if exists "Admins delete quote-attachments" on storage.objects;
create policy "Admins delete quote-attachments"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'quote-attachments' and public.is_admin());
