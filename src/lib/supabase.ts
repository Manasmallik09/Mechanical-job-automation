create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  external_job_id text unique not null,
  title text not null,
  company text not null,
  location text not null,
  role_type text default 'Full-time',
  salary_text text default 'Not disclosed',
  salary_min_monthly integer,
  match_score integer not null check (match_score between 0 and 100),
  matched_skills text[] default '{}',
  status text not null default 'Review' check (status in ('Review', 'Saved', 'Approved', 'Applied', 'Rejected')),
  source_name text not null default 'Manual',
  apply_url text not null default '#',
  tailored_cover_letter text,
  posted_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  run_slot text not null,
  jobs_fetched integer default 0,
  jobs_matched integer default 0,
  status text default 'success',
  ran_at timestamptz default now()
);

alter table public.jobs enable row level security;
alter table public.automation_runs enable row level security;

-- Allow dashboard read and status/insert operations
create policy "Public read jobs" on public.jobs for select using (true);
create policy "Public insert jobs" on public.jobs for insert with check (true);
create policy "Public update jobs" on public.jobs for update using (true);
create policy "Public read runs" on public.automation_runs for select using (true);
