-- Price-inquiry ("Ask the price") requests from the product detail page.
-- Consumed by src/lib/quotes.ts (submitQuote) → submit-quote edge function.
--
-- Writes are server-side only: the public anon key has NO insert path. The
-- submit-quote edge function verifies a Cloudflare Turnstile token and inserts
-- with the service role (which bypasses RLS). The rows are PRIVATE — there is
-- intentionally NO select policy (sales reads them via the dashboard / Telegram
-- notification). Length/format bounds live in table CHECK constraints below so
-- they are enforced on every insert path, including the service role.
-- Idempotent: safe to run on a fresh project or an existing one.
-- Run in: Supabase Dashboard → SQL Editor, or via `supabase db query`.

create table if not exists public.quote_requests (
  id           uuid        primary key default gen_random_uuid(),
  product_id   text,
  product_name text,
  name         text        not null,
  phone        text        not null,
  email        text,
  quantity     text,
  address      text,
  note         text,
  lang         text,
  source       text,
  status       text        not null default 'new',
  created_at   timestamptz not null default now()
);

-- Defense-in-depth validation, enforced regardless of insert path. Added via a
-- DO block so re-running (or running on a table that predates them) is a no-op
-- rather than a "constraint already exists" error.
do $$
begin
  -- Column added after the initial release; `create table if not exists` above
  -- won't add it to a pre-existing table, so patch it in here.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quote_requests' and column_name = 'address'
  ) then
    alter table public.quote_requests add column address text;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_requests_address_len') then
    alter table public.quote_requests add constraint quote_requests_address_len
      check (address is null or char_length(address) <= 300);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_requests_name_len') then
    alter table public.quote_requests add constraint quote_requests_name_len
      check (char_length(name) between 1 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_requests_phone_len') then
    alter table public.quote_requests add constraint quote_requests_phone_len
      check (char_length(phone) between 3 and 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_requests_email_len') then
    alter table public.quote_requests add constraint quote_requests_email_len
      check (email is null or char_length(email) <= 160);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_requests_quantity_len') then
    alter table public.quote_requests add constraint quote_requests_quantity_len
      check (quantity is null or char_length(quantity) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_requests_note_len') then
    alter table public.quote_requests add constraint quote_requests_note_len
      check (note is null or char_length(note) <= 2000);
  end if;
  -- Lifecycle: new ("to be viewed") -> accepted (after the phone call; price
  -- becomes settable from here on, any time) -> completed ("finished"). There
  -- is no "cancelled" status — an unwanted inquiry is hard-deleted instead
  -- (quote_events and its projects row cascade away with it). Dropped and
  -- re-added on every run so extending the pipeline is a re-run, not a manual
  -- migration. Transition LEGALITY (which status may follow which) is
  -- enforced in the admin-quotes edge function; this CHECK only pins the
  -- value set.
  alter table public.quote_requests drop constraint if exists quote_requests_status_valid;
  alter table public.quote_requests add constraint quote_requests_status_valid
    check (status in ('new','accepted','completed'));

  -- Assignment: which admin owns the inquiry (email denormalized for display —
  -- auth.users is not readable from the client).
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quote_requests' and column_name = 'assigned_to'
  ) then
    alter table public.quote_requests add column assigned_to uuid
      references auth.users (id) on delete set null;
    alter table public.quote_requests add column assigned_email text;
  end if;

  -- Digits-only phone for repeat-customer detection ("+998 90 123-45-67" and
  -- "998901234567" match). Generated, so it can never drift from `phone`.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quote_requests' and column_name = 'phone_normalized'
  ) then
    alter table public.quote_requests add column phone_normalized text
      generated always as (regexp_replace(phone, '\D', '', 'g')) stored;
  end if;

  -- Links to a client-generated draft UUID used to group photos/videos
  -- uploaded to the `quote-attachments` storage bucket BEFORE this row
  -- exists (see supabase/schema/storage_quote_attachments.sql). Null when the
  -- submitter attached nothing.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quote_requests' and column_name = 'attachments_draft_id'
  ) then
    alter table public.quote_requests add column attachments_draft_id uuid;
  end if;
end $$;

-- RLS is mandatory on any table reachable through the Data API.
alter table public.quote_requests enable row level security;

-- No insert/select/update/delete policy for anon or authenticated. With RLS
-- enabled and no policy, the public Data API can neither read nor write this
-- table; only the service-role edge function (which bypasses RLS) can insert.
drop policy if exists "Anyone can submit a quote request" on public.quote_requests;

-- Newest first for the sales dashboard.
create index if not exists quote_requests_created_at_idx
  on public.quote_requests (created_at desc);

-- Status-filtered lists and stat counts in the admin panel.
create index if not exists quote_requests_status_idx
  on public.quote_requests (status);

-- Repeat-customer lookup ("other inquiries from this phone").
create index if not exists quote_requests_phone_normalized_idx
  on public.quote_requests (phone_normalized);
