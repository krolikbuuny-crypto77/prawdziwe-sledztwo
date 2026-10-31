-- RC35. Run ONCE in Supabase SQL Editor before deploying /api/coop.
-- Private room data and display snapshots are never available through anon/authenticated REST.
create table if not exists public.ps_coop_rooms (
 room_id uuid primary key,
 session_id uuid not null unique references public.ps_game_sessions(session_id) on delete cascade,
 code_hash text not null unique check (length(code_hash)=64),
 owner_member uuid not null,
 guest_member uuid,
 controller_member uuid not null,
 version bigint not null default 1 check (version>=0),
 frame jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 constraint ps_coop_distinct_members check (guest_member is null or guest_member<>owner_member)
);
create index if not exists ps_coop_updated_idx on public.ps_coop_rooms(updated_at);
alter table public.ps_coop_rooms enable row level security;
revoke all on public.ps_coop_rooms from public, anon, authenticated;
grant select, insert, update, delete on public.ps_coop_rooms to service_role;
-- Membership validation, CAS frame revisions and access control are enforced in Vercel.
-- Cleanup old inactive rooms operationally after backing up wanted saves.
