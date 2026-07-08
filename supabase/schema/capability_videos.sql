-- Imkoniyatlar (Capabilities) page videos, managed from the admin panel.
--
-- Rows store STORAGE OBJECT PATHS (not full URLs) in the public `capabilities`
-- bucket — see supabase/schema/storage_capabilities.sql. The frontend builds
-- public URLs at render time via storage.from('capabilities').getPublicUrl(),
-- so the project/bucket can be rotated without a data migration.
--
-- Public visitors can read only PUBLISHED rows (RLS). Admins (public.is_admin())
-- can do everything, including reading unpublished drafts. When this table is
-- empty or Supabase isn't configured, src/pages/Capabilities.jsx falls back to
-- the hardcoded CAP_VIDEOS seed, so the page always renders.
--
-- Idempotent. Run in: Supabase Dashboard → SQL Editor.
-- Depends on public.is_admin() from supabase/schema/admins.sql (run that first).

create table if not exists public.capability_videos (
  id          uuid        primary key default gen_random_uuid(),
  video_path  text        not null,          -- e.g. videos/<uuid>.mp4
  poster_path text,                           -- e.g. posters/<uuid>.jpg
  title       text,
  sort_order  int         not null default 0,
  published   boolean     not null default true,
  created_at  timestamptz not null default now(),
  constraint capability_videos_title_len check (title is null or char_length(title) <= 160),
  constraint capability_videos_video_path_len check (char_length(video_path) between 1 and 400),
  constraint capability_videos_poster_path_len check (poster_path is null or char_length(poster_path) <= 400)
);

-- Ordering for the public grid: published first, then by sort_order, newest last.
create index if not exists capability_videos_order_idx
  on public.capability_videos (published, sort_order, created_at desc);

alter table public.capability_videos enable row level security;

-- Public (and authenticated) may read only published rows.
drop policy if exists "Public read published videos" on public.capability_videos;
create policy "Public read published videos"
  on public.capability_videos
  for select
  to anon, authenticated
  using (published = true);

-- Admins may read/insert/update/delete everything (incl. unpublished drafts).
drop policy if exists "Admins manage videos" on public.capability_videos;
create policy "Admins manage videos"
  on public.capability_videos
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
