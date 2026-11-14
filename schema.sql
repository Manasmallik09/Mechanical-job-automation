-- Run this only after creating a Supabase project.
-- This creates owner-scoped tables. RLS prevents users from reading other users' rows.
create extension if not exists pgcrypto;

create table if not exists public.job_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  company text not null,
  location text,
  salary_text text,
  job_url text,
  source text,
  posted_at date,
  match_score integer check (match_score between 0 and 100),
  status text not null default 'saved',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.application_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.job_opportunities(id) on delete set null,
  status text not null default 'draft',
  approval_required boolean not null default true,
  submitted_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  verified_by_user boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.job_opportunities enable row level security;
alter table public.application_records enable row level security;
alter table public.saved_answers enable row level security;

create policy "Users manage their own jobs" on public.job_opportunities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own applications" on public.application_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own saved answers" on public.saved_answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private document bucket: create a bucket named "private-documents" in Storage
-- and enable authenticated-only access. Add owner-folder policies before uploading.
