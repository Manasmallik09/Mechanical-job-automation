-- 1. Discovered & Manual Mechanical Engineering Jobs
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

-- 2. Scheduled Automation Run Logs (08:00 AM & 07:00 PM IST)
create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  run_slot text not null,
  jobs_fetched integer default 0,
  jobs_matched integer default 0,
  status text default 'success',
  ran_at timestamptz default now()
);

-- 3. Indexes for Fast Dashboard Filtering & Sorting
create index if not exists idx_jobs_match_score on public.jobs (match_score desc);
create index if not exists idx_jobs_status on public.jobs (status);
create index if not exists idx_automation_runs_ran_at on public.automation_runs (ran_at desc);

-- 4. Enable Row-Level Security (RLS)
alter table public.jobs enable row level security;
alter table public.automation_runs enable row level security;

-- 5. Safe Re-Runnable RLS Policies
drop policy if exists "Public read jobs" on public.jobs;
create policy "Public read jobs" on public.jobs for select using (true);

drop policy if exists "Public insert jobs" on public.jobs;
create policy "Public insert jobs" on public.jobs for insert with check (true);

drop policy if exists "Public update jobs" on public.jobs;
create policy "Public update jobs" on public.jobs for update using (true);

drop policy if exists "Public read runs" on public.automation_runs;
create policy "Public read runs" on public.automation_runs for select using (true);
