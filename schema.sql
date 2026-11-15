-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  external_job_id text unique not null,
  title text not null,
  company text,
  location text,
  salary_text text,
  salary_min_monthly integer,
  match_score integer,
  matched_skills text[],
  status text default 'Review',
  source_name text,
  apply_url text,
  tailored_cover_letter text,
  posted_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  run_slot text not null,
  jobs_fetched integer,
  jobs_matched integer,
  status text,
  ran_at timestamptz default now()
);

create index if not exists idx_jobs_match_score on public.jobs (match_score desc);
create index if not exists idx_automation_runs_ran_at on public.automation_runs (ran_at desc);

alter table public.jobs enable row level security;
alter table public.automation_runs enable row level security;

-- Public read only. The Python script writes with the service key, which bypasses RLS.
drop policy if exists "Public insert jobs" on public.jobs;
drop policy if exists "Public update jobs" on public.jobs;
drop policy if exists "Public read jobs" on public.jobs;
create policy "Public read jobs" on public.jobs for select using (true);

drop policy if exists "Public read runs" on public.automation_runs;
create policy "Public read runs" on public.automation_runs for select using (true);
