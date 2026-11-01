-- 6.36 Release Candidate. Run after 001_game_sessions.sql and 002_ai_review_limits.sql.
-- Global quota across Vercel instances, enforced atomically by PostgreSQL.
-- Existing game sessions and witness testimonies are NOT changed by this migration.
create or replace function public.ps_allow_interview(p_session_id uuid,p_ip_hash text)
returns boolean
language plpgsql security invoker set search_path=public as $$
declare
  session_bucket text;
  ip_bucket text;
  session_window timestamptz := to_timestamp(floor(extract(epoch from now())/60)*60);
  ip_window timestamptz := to_timestamp(floor(extract(epoch from now())/3600)*3600);
  a_count integer;
  b_count integer;
begin
  if p_session_id is null or p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;
  session_bucket:='interview-session:'||p_session_id::text;
  ip_bucket:='interview-ip:'||p_ip_hash;
  -- Fixed lock order (session first, IP second) serializes concurrent quota
  -- checks for the same session/IP without incrementing a rejected request.
  perform pg_advisory_xact_lock(hashtextextended(session_bucket,0));
  perform pg_advisory_xact_lock(hashtextextended(ip_bucket,0));
  select request_count into a_count from public.ps_ai_review_usage
    where bucket_key=session_bucket and window_start=session_window;
  select request_count into b_count from public.ps_ai_review_usage
    where bucket_key=ip_bucket and window_start=ip_window;
  if coalesce(a_count,0)>=25 or coalesce(b_count,0)>=150 then return false; end if;
  insert into public.ps_ai_review_usage(bucket_key,window_start,request_count)
    values (session_bucket,session_window,1)
    on conflict(bucket_key,window_start) do update
      set request_count=ps_ai_review_usage.request_count+1;
  insert into public.ps_ai_review_usage(bucket_key,window_start,request_count)
    values (ip_bucket,ip_window,1)
    on conflict(bucket_key,window_start) do update
      set request_count=ps_ai_review_usage.request_count+1;
  return true;
end;
$$;
revoke execute on function public.ps_allow_interview(uuid,text) from public,anon,authenticated;
grant execute on function public.ps_allow_interview(uuid,text) to service_role;
-- Periodic maintenance, e.g. through pg_cron if available:
-- delete from public.ps_ai_review_usage where window_start < now() - interval '7 days';
