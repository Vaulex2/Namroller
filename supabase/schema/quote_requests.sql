-- Price-inquiry ("Ask the price") requests from the product detail page.
-- Consumed by src/lib/quotes.ts (submitQuote).
-- Insert-only for the public: anonymous visitors may submit an inquiry, but the
-- rows are PRIVATE — there is intentionally NO public select policy (unlike
-- reviews). Sales reads them via the dashboard / Telegram notification.
-- Run in: Supabase Dashboard → SQL Editor, or via `supabase db query`.

create table if not exists public.quote_requests (
  id           uuid        primary key default gen_random_uuid(),
  product_id   text,
  product_name text,
  name         text        not null,
  phone        text        not null,
  email        text,
  quantity     text,
  note         text,
  lang         text,
  source       text,
  status       text        not null default 'new',
  created_at   timestamptz not null default now()
);

-- RLS is mandatory on any table reachable through the Data API.
alter table public.quote_requests enable row level security;

-- Anyone may submit a price request. WITH CHECK enforces basic length bounds
-- (lightweight abuse guard; add captcha / rate-limiting for production).
-- No select/update/delete policy → the anon key cannot read inquiries back.
drop policy if exists "Anyone can submit a quote request" on public.quote_requests;
create policy "Anyone can submit a quote request"
  on public.quote_requests
  for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 120
    and char_length(phone) between 3 and 40
    and (email is null or char_length(email) <= 160)
    and (quantity is null or char_length(quantity) <= 120)
    and (note is null or char_length(note) <= 2000)
  );

-- Newest first for the sales dashboard.
create index if not exists quote_requests_created_at_idx
  on public.quote_requests (created_at desc);
