"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, isConfigured, type Job, type Run } from "@/lib/supabase";
import styles from "./dashboard.module.css";

type Stage = "Review" | "Shortlisted" | "Applied" | "Interview" | "Passed";
const STAGES: Stage[] = ["Review", "Shortlisted", "Applied", "Interview", "Passed"];
const STORE_KEY = "mechcareer:stages:v1";

const SAMPLE_JOBS: Job[] = [
  {
    id: "s1", title: "Design Engineer – Body in White", company: "Sample Motors", location: "Pune",
    salary_text: "₹55,000/mo", match_score: 93, matched_skills: ["Automotive", "BIW", "CAD", "GD&T", "Creo"],
    source_name: "Sample", apply_url: "#", posted_at: new Date().toISOString(),
    tailored_cover_letter: "Dear Hiring Team,\n\nThis is sample data. Connect Supabase to see real jobs.\n\nSincerely,\nManas Mallik",
  },
  {
    id: "s2", title: "Mechanical Design Engineer", company: "Sample Components", location: "Bhubaneswar",
    salary_text: "Not disclosed", match_score: 84, matched_skills: ["CAD", "SolidWorks", "Sheet Metal"],
    source_name: "Sample", apply_url: "#", posted_at: new Date(Date.now() - 4 * 864e5).toISOString(), tailored_cover_letter: null,
  },
  {
    id: "s3", title: "Graduate Engineer Trainee – Mechanical", company: "Sample Industries", location: "Chennai",
    salary_text: "₹40,000/mo", match_score: 77, matched_skills: ["Graduate Engineer Trainee", "Manufacturing"],
    source_name: "Sample", apply_url: "#", posted_at: new Date(Date.now() - 11 * 864e5).toISOString(), tailored_cover_letter: null,
  },
];

function daysAgo(iso: string | null) {
  if (!iso) return "date unknown";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
}

function Dial({ value }: { value: number }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <svg className={styles.dial} viewBox="0 0 56 56" role="img" aria-label={`Match score ${value} out of 100`}>
      <circle cx="28" cy="28" r={r} className={styles.dialTrack} />
      <circle cx="28" cy="28" r={r} className={styles.dialFill} strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 28 28)" />
      <text x="28" y="33" textAnchor="middle" className={styles.dialText}>{value}</text>
    </svg>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stages, setStages] = useState<Record<string, Stage>>({});
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState(75);
  const [stage, setStage] = useState<Stage | "All">("All");
  const [sort, setSort] = useState<"score" | "newest">("score");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Load stage tracking from this browser only.
  useEffect(() => {
    try { setStages(JSON.parse(localStorage.getItem(STORE_KEY) || "{}")); } catch { /* storage empty or blocked */ }
  }, []);

  useEffect(() => {
    (async () => {
      if (!supabase) { setJobs(SAMPLE_JOBS); setLoading(false); return; }
      const [j, r] = await Promise.all([
        supabase.from("jobs").select("*").order("match_score", { ascending: false }).limit(500),
        supabase.from("automation_runs").select("*").order("ran_at", { ascending: false }).limit(1),
      ]);
      if (j.error) setError(j.error.message);
      setJobs((j.data as Job[]) || []);
      setRun(((r.data as Run[]) || [])[0] || null);
      setLoading(false);
    })();
  }, []);

  // "/" focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const stageOf = (id: string): Stage => stages[id] || "Review";
  const setStageFor = (id: string, s: Stage) => {
    const next = { ...stages, [id]: s };
    setStages(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: jobs.length };
    STAGES.forEach((s) => (c[s] = 0));
    jobs.forEach((j) => (c[stageOf(j.id)] += 1));
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, stages]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs
      .filter((j) => j.match_score >= minScore)
      .filter((j) => stage === "All" || stageOf(j.id) === stage)
      .filter((j) => !q || [j.title, j.company, j.location, ...(j.matched_skills || [])].join(" ").toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "score"
          ? b.match_score - a.match_score
          : new Date(b.posted_at || 0).getTime() - new Date(a.posted_at || 0).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, query, minScore, stage, sort, stages]);

  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(""), 1600); } catch { /* clipboard blocked */ }
  };

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div>
          <h1 className={styles.title}>MechCareer</h1>
          <p className={styles.sub}>
            {run
              ? `Last run ${new Date(run.ran_at).toLocaleString()} · ${run.jobs_matched} of ${run.jobs_fetched} jobs matched`
              : isConfigured ? "No automation run recorded yet." : "Showing sample jobs. Add your Supabase keys to see real ones."}
          </p>
        </div>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search jobs</span>
          <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, company, city or skill  (press /)" />
          {query && <button onClick={() => setQuery("")} aria-label="Clear search">Clear</button>}
        </label>
      </header>

      <nav className={styles.stages} aria-label="Application stage">
        {(["All", ...STAGES] as const).map((s) => (
          <button key={s} onClick={() => setStage(s)} aria-pressed={stage === s}
            className={stage === s ? styles.stageOn : styles.stage}>
            {s} <span>{counts[s] ?? 0}</span>
          </button>
        ))}
      </nav>

      <section className={styles.controls}>
        <label>
          Minimum match <b>{minScore}</b>
          <input type="range" min={50} max={99} value={minScore} onChange={(e) => setMinScore(+e.target.value)} />
        </label>
        <label>
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value as "score" | "newest")}>
            <option value="score">Best match</option>
            <option value="newest">Newest</option>
          </select>
        </label>
        <p className={styles.count}>{visible.length} of {jobs.length} jobs</p>
      </section>

      {error && <p className={styles.error}>Couldn’t load jobs: {error}. Check the Supabase URL, key and read policy.</p>}
      {loading && <p className={styles.empty}>Loading jobs…</p>}
      {!loading && !error && visible.length === 0 && (
        <p className={styles.empty}>
          No jobs match these filters. Lower the minimum match, clear the search, or pick “All”.
        </p>
      )}

      <ul className={styles.list}>
        {visible.map((j) => {
          const open = openId === j.id;
          const st = stageOf(j.id);
          return (
            <li key={j.id} className={`${styles.card} ${open ? styles.cardOpen : ""}`} data-stage={st}>
              <button className={styles.row} onClick={() => setOpenId(open ? null : j.id)} aria-expanded={open}>
                <Dial value={j.match_score} />
                <span className={styles.main}>
                  <strong>{j.title}</strong>
                  <span>{j.company} · {j.location} · {j.salary_text || "Not disclosed"}</span>
                </span>
                <span className={styles.badge}>{st}</span>
              </button>

              {open && (
                <div className={styles.detail}>
                  <p className={styles.meta}>Posted {daysAgo(j.posted_at)} via {j.source_name || "unknown source"}</p>
                  <ul className={styles.skills}>
                    {(j.matched_skills || []).map((s) => <li key={s}>{s}</li>)}
                  </ul>

                  <div className={styles.stageRow} role="group" aria-label="Move to stage">
                    {STAGES.map((s) => (
                      <button key={s} onClick={() => setStageFor(j.id, s)} aria-pressed={st === s}
                        className={st === s ? styles.pickOn : styles.pick}>{s}</button>
                    ))}
                  </div>

                  {j.tailored_cover_letter ? (
                    <div className={styles.letter}>
                      <pre>{j.tailored_cover_letter}</pre>
                      <button onClick={() => copy(j.id, j.tailored_cover_letter!)}>
                        {copied === j.id ? "Copied" : "Copy cover letter"}
                      </button>
                    </div>
                  ) : (
                    <p className={styles.meta}>Cover letters are drafted for jobs scoring 85 or more.</p>
                  )}

                  <a className={styles.apply} href={j.apply_url} target="_blank" rel="noopener noreferrer">
                    Open the application page
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className={styles.foot}>Stages are saved in this browser only. They don’t sync between devices.</p>
    </main>
  );
}
