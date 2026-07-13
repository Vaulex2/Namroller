-- Inquiry pipeline extensions: projects (the money side of an accepted inquiry)
-- and quote_events (append-only timeline: status history, price audit trail,
-- internal notes, assignments).
--
-- Both tables follow the quote_requests posture: RLS enabled with ZERO policies,
-- so the public Data API can neither read nor write them. All access goes through
-- the admin-quotes edge function (service role, behind requireAdmin), which also
-- enforces the status state machine and writes an event row for every mutation.
-- Idempotent: safe to run on a fresh project or an existing one.
-- Run in: Supabase Dashboard → SQL Editor, or via `supabase db query`.
-- Depends on: quote_requests.sql (run that first on a fresh project).

-- A project is auto-created when an inquiry is accepted (one per inquiry). The
-- inquiry's `status` column stays the single source-of-truth pipeline; this row
-- carries what the pipeline description calls "the action that touches money":
-- the current price and who set it, when. Historical prices live in quote_events.
--
-- `status` + `deadline` back the admin Journal (a client-work view distinct
-- from the inquiry pipeline): `in_progress` on creation, flipped to
-- `completed`/back by the same edge-function code path that transitions the
-- inquiry to/from `completed` (which is also what finally writes
-- `completed_at`), or set to `cancelled` directly by an admin when a project
-- falls through mid-work — independent of the inquiry's own status, which has
-- no cancelled state (see quote_requests.sql).
create table if not exists public.projects (
  id              uuid        primary key default gen_random_uuid(),
  quote_id        uuid        not null unique references public.quote_requests (id) on delete cascade,
  price_amount    numeric(14,2),
  price_currency  text,
  priced_by       uuid,
  priced_by_email text,
  priced_at       timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  deadline        date,
  status          text        not null default 'in_progress'
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'projects_price_amount_positive') then
    alter table public.projects add constraint projects_price_amount_positive
      check (price_amount is null or price_amount > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'projects_price_currency_valid') then
    alter table public.projects add constraint projects_price_currency_valid
      check (price_currency is null or price_currency in ('UZS','USD'));
  end if;

  alter table public.projects drop constraint if exists projects_status_valid;
  alter table public.projects add constraint projects_status_valid
    check (status in ('in_progress','completed','cancelled'));

  -- One-time backfill for projects created before this column existed: a
  -- project whose inquiry already reached 'completed' should read as
  -- completed in the Journal too. Guarded so re-running is a no-op.
  update public.projects p
  set status = 'completed', completed_at = coalesce(p.completed_at, now())
  from public.quote_requests q
  where q.id = p.quote_id and q.status = 'completed' and p.status <> 'completed';
end $$;

alter table public.projects enable row level security;

-- Journal filter tabs (in_progress / completed / cancelled) query by status.
create index if not exists projects_status_idx on public.projects (status);

-- The audit trail. One row per admin action on an inquiry:
--   status_change:         from_status → to_status (inquiry pipeline)
--   price_set:             amount + currency (who set what price, when)
--   note:                  body (internal comment, never public)
--   assign:                body = assignee email (or empty when unassigned)
--   deadline_set:          body = new deadline (ISO date), or empty when cleared
--   project_status_change: from_status → to_status (project/Journal stage:
--                          in_progress/completed/cancelled)
-- Written exclusively by the admin-quotes edge function with the caller's
-- verified identity (actor_id/actor_email from the JWT, never client-supplied).
create table if not exists public.quote_events (
  id          uuid        primary key default gen_random_uuid(),
  quote_id    uuid        not null references public.quote_requests (id) on delete cascade,
  actor_id    uuid        not null,
  actor_email text,
  type        text        not null,
  from_status text,
  to_status   text,
  amount      numeric(14,2),
  currency    text,
  body        text,
  created_at  timestamptz not null default now()
);

do $$
begin
  alter table public.quote_events drop constraint if exists quote_events_type_valid;
  alter table public.quote_events add constraint quote_events_type_valid
    check (type in ('status_change','price_set','note','assign','deadline_set','project_status_change'));
  if not exists (select 1 from pg_constraint where conname = 'quote_events_body_len') then
    alter table public.quote_events add constraint quote_events_body_len
      check (body is null or char_length(body) <= 2000);
  end if;
end $$;

alter table public.quote_events enable row level security;

-- Append-only in depth: even if a policy were ever added by mistake, anon and
-- authenticated roles hold no UPDATE/DELETE privilege on the audit trail.
revoke update, delete on public.quote_events from anon, authenticated;

-- Timeline reads are always "all events for one inquiry, oldest first".
create index if not exists quote_events_quote_id_created_at_idx
  on public.quote_events (quote_id, created_at);
