-- Per-key (function + IP) fixed-window rate limiting for the public
-- submit-* edge functions.
--
-- Same posture as public.admins / quote_requests: RLS on, ZERO policies, so
-- the table is unreachable via the Data API for anyone. The only way in is
-- public.rate_limit_hit() (SECURITY DEFINER), called by the submit-quote /
-- submit-review edge functions with the service-role key. This is
-- defense-in-depth on top of Cloudflare Turnstile, not a replacement for it.
--
-- One row per (scope, ip) pair, updated in place on every hit -- growth is
-- bounded by distinct IPs seen, not by request volume.
--
-- Idempotent. Run in: Supabase Dashboard -> SQL Editor, or via Supabase MCP
-- apply_migration (see handoff-security.md for how this project deploys).

create table if not exists public.rate_limits (
  key          text primary key,
  count        int         not null default 1,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

-- RLS on, zero policies => no Data API read/write path for anyone.
drop policy if exists "no public access to rate_limits" on public.rate_limits;

-- Atomic check-and-increment for a fixed window: single upsert statement, so
-- concurrent requests for the same key serialize on Postgres's row lock
-- instead of racing a read-then-write. Returns true if this call is within
-- budget (and records it), false if the caller should be rejected.
create or replace function public.rate_limit_hit(p_key text, p_window_seconds int, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case
      when public.rate_limits.window_start <= now() - make_interval(secs => p_window_seconds)
        then 1
      else public.rate_limits.count + 1
    end,
    window_start = case
      when public.rate_limits.window_start <= now() - make_interval(secs => p_window_seconds)
        then now()
      else public.rate_limits.window_start
    end
  returning count into v_count;
  return v_count <= p_limit;
end;
$$;

-- Only the service role (the submit-* edge functions) may call this. Nobody
-- else has a legitimate reason to, and anon/authenticated access would let a
-- caller probe or influence another key's window.
revoke execute on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant  execute on function public.rate_limit_hit(text, int, int) to service_role;
