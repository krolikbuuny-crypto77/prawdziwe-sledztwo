-- RC58 opt-in; execute once before APINEX_DISTRIBUTED_QUEUE_ENABLED=true.
-- A shared, serialized scheduling queue for ALL APINEX models, game and tester.
-- Assumes one service role connects to the same Supabase project across Vercel instances.
create table if not exists public.ps_apinex_call_schedule (
  id int primary key default 1 check (id = 1),
  next_at timestamptz not null default clock_timestamp()
);
insert into public.ps_apinex_call_schedule(id,next_at) values(1,clock_timestamp()) on conflict (id) do nothing;
alter table public.ps_apinex_call_schedule enable row level security;
revoke all on public.ps_apinex_call_schedule from public,anon,authenticated;
grant select,update on public.ps_apinex_call_schedule to service_role;
create or replace function public.ps_reserve_apinex_call(p_scope text, p_interval_ms integer, p_max_wait_ms integer)
returns integer language plpgsql security invoker set search_path=public as $$
declare
  now_at timestamptz;
  scheduled timestamptz;
  wait_ms integer;
begin
  if p_scope not in ('game','tester') or p_interval_ms<1000 or p_interval_ms>60000
    or p_max_wait_ms<0 or p_max_wait_ms>15000 then return -1; end if;
  -- SELECT FOR UPDATE serializes all Vercel instances, not just each process.
  perform pg_advisory_xact_lock(71105800);
  now_at:=clock_timestamp();
  select greatest(next_at,now_at) into scheduled from public.ps_apinex_call_schedule where id=1 for update;
  if scheduled is null then return -1; end if;
  wait_ms:=greatest(0,ceil(extract(epoch from (scheduled-now_at))*1000)::integer);
  if wait_ms>p_max_wait_ms then return -1; end if;
  update public.ps_apinex_call_schedule set next_at=scheduled+make_interval(secs=>p_interval_ms / 1000.0) where id=1;
  return wait_ms;
end;$$;
revoke execute on function public.ps_reserve_apinex_call(text,integer,integer) from public,anon,authenticated;
grant execute on function public.ps_reserve_apinex_call(text,integer,integer) to service_role;
-- Propagate upstream Retry-After to every Vercel instance using this project.
create or replace function public.ps_defer_apinex_calls(p_seconds integer)
returns boolean language plpgsql security invoker set search_path=public as $$
begin
  if p_seconds<1 or p_seconds>300 then return false; end if;
  perform pg_advisory_xact_lock(71105800);
  update public.ps_apinex_call_schedule
    set next_at=greatest(next_at,clock_timestamp()+make_interval(secs=>p_seconds)) where id=1;
  return found;
end;$$;
revoke execute on function public.ps_defer_apinex_calls(integer) from public,anon,authenticated;
grant execute on function public.ps_defer_apinex_calls(integer) to service_role;
