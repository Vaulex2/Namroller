-- Admin membership for the NamRoller admin panel.
--
-- There is NO API path to write this table: RLS is enabled with ZERO policies,
-- so anon AND authenticated users (including admins themselves) can neither read
-- nor write it through the Data API. Only the SQL editor / service role can add
-- or remove admins. This is the anti-privilege-escalation core of the panel: a
-- signed-in admin cannot mint another admin through any exposed surface.
--
-- Provisioning (manual, project owner):
--   1. Create the user in Dashboard → Authentication → Users → Add user.
--   2. Grant admin:
--        insert into public.admins (user_id) values ('<uuid from auth.users>');
--   3. Revoke admin:
--        delete from public.admins where user_id = '<uuid>';
--
-- Idempotent: safe to run on a fresh project or an existing one.
-- Run in: Supabase Dashboard → SQL Editor, or via `supabase db query`.

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS on, zero policies => no Data API read/write path for anyone.
alter table public.admins enable row level security;

-- Membership test used by RLS policies on reviews / capability_videos / storage
-- and by the admin edge functions. SECURITY DEFINER so it can read public.admins
-- even though the caller (authenticated) has no SELECT policy on it. It only
-- READS membership — it never writes. `stable` lets the planner cache it per
-- statement. `set search_path = public` pins name resolution so a caller cannot
-- shadow `admins` with a same-named object on their own search_path (this also
-- clears the Supabase `function_search_path_mutable` advisor).
create or replace function public.is_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

-- auth.uid() is null for anon => the function returns false for anon. Anon has
-- no reason to test admin membership, so only authenticated may execute it.
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;
