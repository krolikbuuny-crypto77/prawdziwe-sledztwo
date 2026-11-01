-- 6.29: URUCHOM JEDNORAZOWO W SQL Editor PRZED wdrożeniem ZIP.
-- Nie usuwa ani nie modyfikuje dotychczasowych zapisów gry.
grant delete on table public.ps_game_sessions to service_role;
create table if not exists public.ps_ai_review_usage (
  bucket_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key(bucket_key,window_start)
);
alter table public.ps_ai_review_usage enable row level security;
revoke all on table public.ps_ai_review_usage from public, anon, authenticated;
grant select, insert, update on table public.ps_ai_review_usage to service_role;

create or replace function public.ps_allow_ai_review(p_session_id uuid, p_ip_hash text)
returns boolean
language plpgsql security invoker set search_path=public as $$
declare
  session_window timestamptz := to_timestamp(floor(extract(epoch from now())/600)*600);
  ip_window timestamptz := to_timestamp(floor(extract(epoch from now())/3600)*3600);
  allowed boolean;
begin
  if p_session_id is null or p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;
  -- 8 analyses per 10-minute interval per game session.
  insert into ps_ai_review_usage(bucket_key,window_start,request_count)
  values ('s:'||p_session_id::text,session_window,1)
  on conflict(bucket_key,window_start) do update
    set request_count=ps_ai_review_usage.request_count+1
    where ps_ai_review_usage.request_count < 8
  returning true into allowed;
  if coalesce(allowed,false) is not true then return false; end if;
  -- 40 analyses per hour per hashed IP, across sessions and Vercel instances.
  allowed := false;
  insert into ps_ai_review_usage(bucket_key,window_start,request_count)
  values ('i:'||p_ip_hash,ip_window,1)
  on conflict(bucket_key,window_start) do update
    set request_count=ps_ai_review_usage.request_count+1
    where ps_ai_review_usage.request_count < 40
  returning true into allowed;
  return coalesce(allowed,false);
end;
$$;
revoke execute on function public.ps_allow_ai_review(uuid,text) from public, anon, authenticated;
grant execute on function public.ps_allow_ai_review(uuid,text) to service_role;

-- Maintenance (optional, run periodically, not part of client):
-- delete from public.ps_ai_review_usage where window_start < now() - interval '7 days';
