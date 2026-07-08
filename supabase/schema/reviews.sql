-- Reviews table for the home-page testimonials section.
-- Consumed by src/lib/reviews.ts (fetchReviews reads; addReview → submit-review
-- edge function writes).
--
-- Public READ is limited to APPROVED reviews. Writes are server-side only: the
-- public anon key has NO insert path. The submit-review edge function verifies a
-- Cloudflare Turnstile token and inserts (approved=false) with the service role.
-- New reviews stay hidden until a human flips `approved` to true in the dashboard.
-- Length/range bounds live in table CHECK constraints so they are enforced on
-- every insert path, including the service role.
-- Idempotent: safe to run on a fresh project or an existing one.
-- Run in: Supabase Dashboard → SQL Editor, or via `supabase db query`.

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null,
  role       text,
  text       text        not null,
  rating     int         not null default 5,
  image      text,
  approved   boolean     not null default false,
  created_at timestamptz not null default now()
);

-- Migrate existing deployments: add the moderation column if it predates this file.
alter table public.reviews add column if not exists approved boolean not null default false;
-- To keep any reviews that existed before moderation visible, run once manually:
--   update public.reviews set approved = true;

-- Defense-in-depth validation, enforced regardless of insert path. DO block so
-- re-running is a no-op rather than a "constraint already exists" error.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reviews_name_len') then
    alter table public.reviews add constraint reviews_name_len
      check (char_length(name) between 1 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reviews_text_len') then
    alter table public.reviews add constraint reviews_text_len
      check (char_length(text) between 1 and 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reviews_role_len') then
    alter table public.reviews add constraint reviews_role_len
      check (role is null or char_length(role) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reviews_rating_range') then
    alter table public.reviews add constraint reviews_rating_range
      check (rating between 1 and 5);
  end if;
  -- image is never set by the edge function; if ever populated it must be an https URL.
  if not exists (select 1 from pg_constraint where conname = 'reviews_image_https') then
    alter table public.reviews add constraint reviews_image_https
      check (image is null or image ~ '^https://');
  end if;
end $$;

-- RLS is mandatory on any table reachable through the Data API.
alter table public.reviews enable row level security;

-- Anyone may read APPROVED reviews only. Unapproved rows are invisible to the
-- public Data API (and to fetchReviews, which uses the anon key).
drop policy if exists "Public can read reviews" on public.reviews;
drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
  on public.reviews
  for select
  to anon, authenticated
  using (approved = true);

-- No public insert policy: the anon key cannot write. Only the service-role
-- submit-review edge function (which bypasses RLS) inserts new reviews.
drop policy if exists "Anyone can submit a review" on public.reviews;

-- Admin moderation (panel). Depends on public.is_admin() from
-- supabase/schema/admins.sql (run that first). These are ADDITIVE permissive
-- policies: a signed-in admin's effective SELECT is (approved = true OR
-- is_admin()) => all rows, incl. pending; a non-admin authenticated user still
-- sees approved rows only. Reviews carry no private PII (only a display name the
-- author chose to show), and approved rows are already world-readable, so an
-- admin SELECT-all here adds negligible exposure.
drop policy if exists "Admins read all reviews" on public.reviews;
create policy "Admins read all reviews"
  on public.reviews
  for select
  to authenticated
  using (public.is_admin());

-- Approve = update approved to true; edit is possible but the panel only flips approval.
drop policy if exists "Admins update reviews" on public.reviews;
create policy "Admins update reviews"
  on public.reviews
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Reject = delete the pending row.
drop policy if exists "Admins delete reviews" on public.reviews;
create policy "Admins delete reviews"
  on public.reviews
  for delete
  to authenticated
  using (public.is_admin());

-- Newest first for fetchReviews().
create index if not exists reviews_created_at_idx
  on public.reviews (created_at desc);
