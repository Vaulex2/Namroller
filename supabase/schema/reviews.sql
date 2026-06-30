-- Reviews table for the home-page testimonials section.
-- Consumed by src/lib/reviews.ts (fetchReviews / addReview).
-- Public read + public (anonymous) insert, shown immediately (no moderation).
-- Run in: Supabase Dashboard → SQL Editor, or via `supabase db query`.

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null,
  role       text,
  text       text        not null,
  rating     int         not null default 5 check (rating between 1 and 5),
  image      text,
  created_at timestamptz not null default now()
);

-- RLS is mandatory on any table reachable through the Data API.
alter table public.reviews enable row level security;

-- Anyone may read published reviews.
drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews"
  on public.reviews
  for select
  to anon, authenticated
  using (true);

-- Anyone may submit a review. WITH CHECK enforces basic length/rating bounds
-- (lightweight abuse guard; add captcha / rate-limiting for production).
drop policy if exists "Anyone can submit a review" on public.reviews;
create policy "Anyone can submit a review"
  on public.reviews
  for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 120
    and char_length(text) between 1 and 2000
    and (role is null or char_length(role) <= 120)
    and rating between 1 and 5
  );

-- Newest first for fetchReviews().
create index if not exists reviews_created_at_idx
  on public.reviews (created_at desc);
