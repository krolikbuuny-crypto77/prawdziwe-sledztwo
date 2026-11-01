-- Uruchomić w SQL Editor jednorazowo. Sekret service_role NIGDY nie trafia do przeglądarki.
create table if not exists public.ps_game_sessions (
  session_id uuid primary key,
  revision integer not null default 0 check (revision >= 0),
  approved_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.ps_game_sessions enable row level security;
revoke all on table public.ps_game_sessions from anon, authenticated;
grant select, insert, update, delete on table public.ps_game_sessions to service_role;
create or replace function public.ps_commit_session(p_session_id uuid,p_expected_revision integer,p_approved_state jsonb)
returns boolean language plpgsql security invoker set search_path=public as $$
begin
  update public.ps_game_sessions
  set approved_state=p_approved_state,revision=revision+1,updated_at=now()
  where session_id=p_session_id and revision=p_expected_revision;
  return found;
end;
$$;
revoke execute on function public.ps_commit_session(uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.ps_commit_session(uuid,integer,jsonb) to service_role;
