-- RC57.10. OPTIONAL, additive schema: no edits to ps_game_sessions, witness logs or saves.
-- Before setting APINEX_SHARED_QUOTA_ENABLED=true in Vercel, run this once in Supabase SQL Editor.
-- Quota counts REAL HTTP attempts to Apinex across game and admin tester (not user questions).
create table if not exists public.ps_apinex_call_usage (
  id bigint generated always as identity primary key,
  attempted_at timestamptz not null default clock_timestamp(),
  scope text not null check(scope in ('game','tester'))
);
create index if not exists ps_apinex_usage_time_idx on public.ps_apinex_call_usage(attempted_at);
alter table public.ps_apinex_call_usage enable row level security;
revoke all on public.ps_apinex_call_usage from public,anon,authenticated;
grant select,insert,delete on public.ps_apinex_call_usage to service_role;
create or replace function public.ps_take_apinex_slot(p_scope text, p_max_calls integer default 18)
returns boolean language plpgsql security invoker set search_path=public as $$
declare
  moment timestamptz;
  number_of_calls integer;
  tester_calls integer;
begin
  if p_scope not in ('game','tester') or p_max_calls < 1 or p_max_calls > 60 then return false; end if;
  -- One lock for all models, sessions and Vercel instances using this Supabase project.
  perform pg_advisory_xact_lock(71105710);
  moment:=clock_timestamp();
  select count(*),count(*) filter(where scope='tester') into number_of_calls,tester_calls
    from public.ps_apinex_call_usage where attempted_at>moment-interval '60 seconds';
  if number_of_calls>=p_max_calls then return false; end if;
  -- Tester cannot consume the entire allowance; reserve at least half for gameplay.
  if p_scope='tester' and tester_calls>=greatest(1,p_max_calls/2) then return false; end if;
  insert into public.ps_apinex_call_usage(scope,attempted_at) values(p_scope,moment);
  -- Bounded cleanup, independently of deployment and not affecting current minute.
  delete from public.ps_apinex_call_usage where attempted_at<moment-interval '1 hour';
  return true;
end;
$$;
revoke execute on function public.ps_take_apinex_slot(text,integer) from public,anon,authenticated;
grant execute on function public.ps_take_apinex_slot(text,integer) to service_role;
