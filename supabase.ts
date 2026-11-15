import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key && !url.includes("YOUR_PROJECT_ID"));

export const supabase = isConfigured ? createClient(url!, key!) : null;

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_text: string | null;
  match_score: number;
  matched_skills: string[] | null;
  source_name: string | null;
  apply_url: string;
  tailored_cover_letter: string | null;
  posted_at: string | null;
};

export type Run = {
  run_slot: string;
  jobs_fetched: number;
  jobs_matched: number;
  status: string;
  ran_at: string;
};
