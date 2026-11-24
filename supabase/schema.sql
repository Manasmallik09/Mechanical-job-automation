-- MechCareer private cloud sync schema
-- Run this entire script in Supabase Dashboard > SQL Editor.
-- Each signed-in user can access only their own rows.

create table if not exists public.career_workspace (
  user_id uuid not null references auth.users(id) on delete cascade,
  record_key text not null check (record_key in ('jobs', 'prefs')),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, record_key)
);

alter table public.career_workspace enable row level security;

drop policy if exists "Users can read their own career workspace" on public.career_workspace;
create policy "Users can read their own career workspace"
  on public.career_workspace for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own career workspace" on public.career_workspace;
create policy "Users can insert their own career workspace"
  on public.career_workspace for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own career workspace" on public.career_workspace;
create policy "Users can update their own career workspace"
  on public.career_workspace for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own career workspace" on public.career_workspace;
create policy "Users can delete their own career workspace"
  on public.career_workspace for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.career_workspace to authenticated;
