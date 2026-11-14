 "use client";

import { useMemo, useState } from "react";
import {
  Activity, Archive, Bell, BriefcaseBusiness, CalendarDays, Check, ChevronDown,
  CircleHelp, ClipboardCheck, Clock3, FileText, Filter, Gauge, LayoutDashboard,
  LogOut, Menu, Plus, Search, Settings, ShieldCheck, SlidersHorizontal,
  Sparkles, Target, TrendingUp, UploadCloud, UserRound, X
} from "lucide-react";

type Job = {
  id: number; title: string; company: string; location: string; salary: string;
  type: string; posted: string; match: number; status: string; category: string;
};

const initialJobs: Job[] = [
  { id: 1, title: "Graduate Engineer Trainee – Manufacturing", company: "Example Manufacturing Ltd.", location: "Pune, Maharashtra", salary: "Not disclosed", type: "Full-time · GET", posted: "Sample entry", match: 96, status: "Review", category: "Production" },
  { id: 2, title: "Junior Mechanical Design Engineer", company: "Sample Engineering Systems", location: "Bengaluru, Karnataka", salary: "₹3.6–4.8 LPA", type: "Full-time", posted: "Sample entry", match: 93, status: "Saved", category: "Design" },
  { id: 3, title: "Quality Engineer – Fresher", company: "Illustrative Components Pvt. Ltd.", location: "Chennai, Tamil Nadu", salary: "Not disclosed", type: "Full-time", posted: "Sample entry", match: 91, status: "Review", category: "Quality" },
];

const navItems = [
  ["Overview", LayoutDashboard], ["Jobs", BriefcaseBusiness], ["Applications", ClipboardCheck],
  ["Resume & Documents", FileText], ["Saved Answers", Check], ["Reports", TrendingUp],
  ["Notifications", Bell], ["Settings", Settings],
] as const;

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [jobs, setJobs] = useState(initialJobs);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("Demo workspace — sample jobs are illustrative, not verified vacancies.");
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const filteredJobs = useMemo(() => jobs.filter(j =>
    (filter === "All" || j.status === filter) &&
    `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(query.toLowerCase())
  ), [jobs, filter, query]);

  const approve = (id: number) => {
    setJobs(old => old.map(j => j.id === id ? { ...j, status: "Approved for preparation" } : j));
    setNotice("Marked for application preparation. Nothing has been submitted.");
  };
  const addJob = () => {
    if (!newTitle.trim() || !newCompany.trim()) return;
    setJobs(old => [{ id: Date.now(), title: newTitle, company: newCompany, location: newLocation || "Not specified", salary: "Not disclosed", type: "Full-time", posted: "Added by you", match: 0, status: "Saved", category: "Other" }, ...old]);
    setNewTitle(""); setNewCompany(""); setNewLocation(""); setShowAdd(false);
    setNotice("Job saved to your local demo list. Connect the database to persist it.");
    setActive("Jobs");
  };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Gauge size={21}/></div><div><b>MechCareer</b><span>JOB WORKSPACE</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>{navItems.map(([label, Icon]) => <button key={label} className={`nav-link ${active === label ? "active" : ""}`} onClick={() => { setActive(label); setMobileNav(false); }}><Icon size={18}/><span>{label}</span>{label === "Applications" && <i className="nav-count">4</i>}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="privacy-card"><ShieldCheck size={18}/><div><b>Private workspace</b><span>Connect secure sign-in before adding personal documents.</span></div></div>
          <button className="profile-row" onClick={() => setActive("Settings")}><div className="avatar">ME</div><div><b>Mechanical Engineer</b><span>Profile setup pending</span></div><ChevronDown size={15}/></button>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={21}/></button>
          <div className="crumb">Workspace <span>/</span> <b>{active}</b></div>
          <div className="top-actions"><span className="today"><CalendarDays size={15}/> 11 Nov 2026</span><button className="icon-btn" aria-label="Help"><CircleHelp size={18}/></button><button className="icon-btn notification-btn" aria-label="Notifications"><Bell size={18}/><i/></button><div className="avatar small">ME</div></div>
        </header>

        <div className="content">
          <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> YOUR CAREER COMMAND CENTRE</div><h1>{active === "Overview" ? "Good evening. Let’s move your career forward." : active}</h1><p className="subhead">{active === "Overview" ? "Keep your mechanical engineering job search organised, focused and under your control." : "Manage this part of your mechanical engineering job search workspace."}</p></div><button className="primary-btn" onClick={() => setShowAdd(true)}><Plus size={17}/> Add a job</button></div>

          {notice && <div className="notice"><span className="notice-dot"/>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15}/></button></div>}

          {active === "Overview" && <>
            <div className="stats-grid">
              <Stat icon={<BriefcaseBusiness/>} label="Jobs in workspace" value={String(jobs.length)} helper="Sample + manually added" tone="blue"/>
              <Stat icon={<ClipboardCheck/>} label="Pending review" value={String(jobs.filter(j => j.status === "Review").length)} helper="Needs your decision" tone="orange"/>
              <Stat icon={<Check/>} label="Approved to prepare" value={String(jobs.filter(j => j.status === "Approved for preparation").length)} helper="Not submitted" tone="green"/>
              <Stat icon={<Target/>} label="Daily preparation cap" value="20" helper="Applications per day" tone="purple"/>
            </div>
            <div className="section-grid">
              <div className="panel priority-panel"><div className="panel-heading"><div><h2>Priority job matches</h2><p>Review suitable roles before preparing applications.</p></div><button className="text-btn" onClick={() => setActive("Jobs")}>View all <span>→</span></button></div><JobTable jobs={filteredJobs.slice(0,3)} onApprove={approve}/></div>
              <div className="panel progress-panel"><div className="panel-heading"><div><h2>Setup progress</h2><p>Complete the foundation before using live features.</p></div><span className="progress-number">1/5</span></div><div className="progress-track"><i/></div><div className="setup-list"><SetupItem done label="Create dashboard workspace" detail="Local interface ready"/><SetupItem label="Connect private database" detail="Supabase setup required"/><SetupItem label="Add and verify your profile" detail="Resume not uploaded yet"/><SetupItem label="Enable job discovery" detail="Sources and compliance review"/><SetupItem label="Configure reports" detail="08:00 and 19:00 IST"/></div></div>
            </div>
            <div className="bottom-grid">
              <div className="panel schedule-panel"><div className="panel-heading"><div><h2>Search schedule</h2><p>Planned report times (not active yet).</p></div><span className="pill pending">Not scheduled</span></div><div className="schedule-times"><div><Clock3 size={17}/><b>08:00 AM</b><span>Morning job report</span></div><div><Clock3 size={17}/><b>07:00 PM</b><span>Evening job report</span></div></div></div>
              <div className="panel criteria-panel"><div className="panel-heading"><div><h2>Your job criteria</h2><p>Current search preferences.</p></div><button className="icon-btn" onClick={() => setActive("Settings")}><SlidersHorizontal size={17}/></button></div><div className="criteria-tags"><span>Core mechanical</span><span>India-wide</span><span>Fresher / GET</span><span>Full-time</span><span>90%+ match</span><span>₹35k+/month target</span></div><p className="muted-note">Aerospace, UAV, defence and aircraft roles excluded.</p></div>
            </div>
          </>}

          {active === "Jobs" && <div className="panel jobs-panel"><div className="panel-heading"><div><h2>Job opportunities</h2><p>Only add verified opportunities. Current entries are clearly marked as samples.</p></div><button className="primary-btn compact" onClick={() => setShowAdd(true)}><Plus size={16}/> Add job</button></div><div className="toolbar"><div className="searchbox"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search role, company or location"/></div><div className="filterbox"><Filter size={16}/><select value={filter} onChange={e => setFilter(e.target.value)}><option>All</option><option>Review</option><option>Saved</option><option>Approved for preparation</option></select></div></div><JobTable jobs={filteredJobs} onApprove={approve}/>{filteredJobs.length === 0 && <div className="empty">No matching jobs. Try another search or add a verified role.</div>}</div>}

          {active !== "Overview" && active !== "Jobs" && <div className="panel placeholder-panel"><div className="placeholder-icon"><Activity size={25}/></div><h2>{active} setup</h2><p>This section is included in the dashboard structure. Its secure data workflow will be enabled after database and authentication setup.</p><div className="placeholder-points"><span><Check size={15}/> Private-by-default design planned</span><span><Check size={15}/> No automatic application submission</span><span><Check size={15}/> Your approval required before any submission</span></div><button className="secondary-btn" onClick={() => setActive("Overview")}>Back to overview</button></div>}

          <footer><span>MechCareer · Private job-search workspace</span><span><ShieldCheck size={14}/> Your applications stay under your control</span></footer>
        </div>
      </section>

      {showAdd && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowAdd(false); }}><div className="modal"><div className="modal-head"><div><h2>Add a job opportunity</h2><p>Enter a role you have independently verified.</p></div><button className="icon-btn" onClick={() => setShowAdd(false)}><X size={18}/></button></div><label>Job title<input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Graduate Engineer Trainee"/></label><label>Company<input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Company name"/></label><label>Location<input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="City, state"/></label><div className="modal-note"><ShieldCheck size={16}/> This adds a local demo record only. Database persistence is not configured yet.</div><div className="modal-actions"><button className="secondary-btn" onClick={() => setShowAdd(false)}>Cancel</button><button className="primary-btn" disabled={!newTitle.trim() || !newCompany.trim()} onClick={addJob}>Save job</button></div></div></div>}
    </main>
  );
}

function Stat({icon,label,value,helper,tone}:{icon:React.ReactNode,label:string,value:string,helper:string,tone:string}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-helper">{helper}</div></div>;
}
function SetupItem({done=false,label,detail}:{done?:boolean,label:string,detail:string}) {
  return <div className="setup-item"><span className={`check-circle ${done ? "done" : ""}`}>{done ? <Check size={12}/> : null}</span><div><b>{label}</b><span>{detail}</span></div></div>;
}
function JobTable({jobs,onApprove}:{jobs:Job[],onApprove:(id:number)=>void}) {
  return <div className="table-wrap"><table><thead><tr><th>ROLE / COMPANY</th><th>LOCATION</th><th>SALARY</th><th>MATCH</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{jobs.map(job=><tr key={job.id}><td><b className="job-title">{job.title}</b><span className="company">{job.company} · {job.type}</span></td><td>{job.location}</td><td>{job.salary}</td><td>{job.match ? <span className="match">{job.match}%</span> : "—"}</td><td><span className={`status ${job.status === "Review" ? "review" : job.status === "Saved" ? "saved" : "approved"}`}>{job.status}</span></td><td>{job.status === "Review" ? <button className="approve-btn" onClick={()=>onApprove(job.id)}>Approve to prepare</button> : <span className="muted-action">—</span>}</td></tr>)}</tbody></table></div>;
}
