"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Copy,
  X,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type JobStatus = "Review" | "Saved" | "Approved" | "Applied" | "Rejected";

interface JobRecord {
  id: string;
  external_job_id: string;
  title: string;
  company: string;
  location: string;
  role_type: string;
  salary_text: string;
  match_score: number;
  matched_skills: string[];
  status: JobStatus;
  source_name: string;
  apply_url: string;
  tailored_cover_letter?: string | null;
}

const DEMO_JOBS: JobRecord[] = [
  {
    id: "demo-1",
    external_job_id: "demo-1",
    title: "Graduate Engineer Trainee – Manufacturing",
    company: "Example Manufacturing Ltd.",
    location: "Pune, Maharashtra",
    role_type: "Full-time · GET",
    salary_text: "Not disclosed",
    match_score: 96,
    matched_skills: ["SolidWorks", "GD&T", "Manufacturing"],
    status: "Review",
    source_name: "Demo",
    apply_url: "#",
    tailored_cover_letter:
      "Dear Hiring Team at Example Manufacturing Ltd.,\n\nI am writing to apply for the Graduate Engineer Trainee – Manufacturing role...",
  },
  {
    id: "demo-2",
    external_job_id: "demo-2",
    title: "Junior Mechanical Design Engineer",
    company: "Sample Engineering Systems",
    location: "Bengaluru, Karnataka",
    role_type: "Full-time",
    salary_text: "₹3.6–4.8 LPA",
    match_score: 93,
    matched_skills: ["CAD", "ANSYS", "FEA"],
    status: "Saved",
    source_name: "Demo",
    apply_url: "#",
  },
];

export default function MechCareerDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "queue" | "criteria">("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [jobs, setJobs] = useState<JobRecord[]>(DEMO_JOBS);
  const [loading, setLoading] = useState(true);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<JobRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual job form state
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newSalary, setNewSalary] = useState("Not disclosed");
  const [newUrl, setNewUrl] = useState("");

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      const { data: jobRows, error } = await supabase
        .from("jobs")
        .select("*")
        .order("match_score", { ascending: false });

      if (!error && jobRows && jobRows.length > 0) {
        setJobs(jobRows as JobRecord[]);
      }

      const { data: runRows } = await supabase
        .from("automation_runs")
        .select("ran_at, jobs_matched")
        .order("ran_at", { ascending: false })
        .limit(1);

      if (runRows && runRows.length > 0) {
        const dt = new Date(runRows[0].ran_at).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        });
        setLastRun(`${dt} IST (${runRows[0].jobs_matched} matched)`);
      }

      setLoading(false);
    }

    loadDashboardData();
  }, []);

  async function updateJobStatus(jobId: string, nextStatus: JobStatus) {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: nextStatus } : j)));

    if (isSupabaseConfigured && supabase && !jobId.startsWith("demo-")) {
      await supabase.from("jobs").update({ status: nextStatus }).eq("id", jobId);
    }
  }

  async function handleAddJob(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) return;

    const record: JobRecord = {
      id: `manual-${Date.now()}`,
      external_job_id: `manual-${Date.now()}`,
      title: newTitle.trim(),
      company: newCompany.trim(),
      location: newLocation.trim() || "India",
      role_type: "Full-time",
      salary_text: newSalary.trim() || "Not disclosed",
      match_score: 92,
      matched_skills: ["CAD", "FEA", "Mechanical Design"],
      status: "Review",
      source_name: "Manual Entry",
      apply_url: newUrl.trim() || "#",
      tailored_cover_letter: `Dear Hiring Team at ${newCompany.trim()},\n\nI am excited to apply for the ${newTitle.trim()} position. With expertise in 3D CAD, ANSYS FEA/CFD simulation, and MATLAB workflows, I can add immediate value to your engineering team.\n\nSincerely,\nManas Mallik`,
    };

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from("jobs")
        .insert({
          external_job_id: record.external_job_id,
          title: record.title,
          company: record.company,
          location: record.location,
          salary_text: record.salary_text,
          match_score: record.match_score,
          matched_skills: record.matched_skills,
          status: record.status,
          source_name: record.source_name,
          apply_url: record.apply_url,
          tailored_cover_letter: record.tailored_cover_letter,
        })
        .select()
        .single();

      if (data) {
        setJobs((prev) => [data as JobRecord, ...prev]);
      } else {
        setJobs((prev) => [record, ...prev]);
      }
    } else {
      setJobs((prev) => [record, ...prev]);
    }

    setNewTitle("");
    setNewCompany("");
    setNewLocation("");
    setNewSalary("Not disclosed");
    setNewUrl("");
    setShowAddModal(false);
  }

  function copyCoverLetter(job: JobRecord) {
    if (!job.tailored_cover_letter) return;
    navigator.clipboard.writeText(job.tailored_cover_letter);
    setCopiedId(job.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesTab = activeTab === "queue" ? job.status === "Approved" : true;
      const matchesStatus = statusFilter === "ALL" ? true : job.status === statusFilter;
      const q = searchTerm.toLowerCase();
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q);
      return matchesTab && matchesStatus && matchesQuery;
    });
  }, [jobs, activeTab, statusFilter, searchTerm]);

  const pendingCount = jobs.filter((j) => j.status === "Review").length;
  const approvedCount = jobs.filter((j) => j.status === "Approved").length;
  const setupDoneCount = isSupabaseConfigured ? 4 : 1;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Briefcase size={19} />
          </div>
          <div>
            <b>MechCareer</b>
            <span>JOB WORKSPACE</span>
          </div>
          <button className="mobile-close" onClick={() => setMobileMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav>
          <button
            className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("overview");
              setMobileMenuOpen(false);
            }}
          >
            <LayoutDashboard size={16} /> Overview
          </button>
          <button
            className={`nav-link ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("jobs");
              setMobileMenuOpen(false);
            }}
          >
            <FolderKanban size={16} /> Job Matches
            <i className="nav-count">{jobs.length}</i>
          </button>
          <button
            className={`nav-link ${activeTab === "queue" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("queue");
              setMobileMenuOpen(false);
            }}
          >
            <FileText size={16} /> Prep Queue
            <i className="nav-count">{approvedCount}</i>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-card">
            <ShieldCheck size={16} />
            <div>
              <b>{isSupabaseConfigured ? "Supabase Connected" : "Local Demo Mode"}</b>
              <span>
                {isSupabaseConfigured
                  ? "Automated discovery & sync active."
                  : "Add Supabase keys in GitHub Secrets to activate live sync."}
              </span>
            </div>
          </div>
          <div className="profile-row">
            <div className="avatar">MM</div>
            <div>
              <b>Manas Mallik</b>
              <span>Mechanical Design & FEA</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="mobile-menu" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="crumb">
              Workspace <span>/</span>{" "}
              <b>{activeTab === "overview" ? "Overview" : activeTab === "jobs" ? "Job Matches" : "Prep Queue"}</b>
            </div>
          </div>
          <div className="top-actions">
            <div className="today">
              <Clock size={14} /> {todayFormatted}
            </div>
            <div className="avatar small">MM</div>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">
                <Sparkles size={12} /> YOUR CAREER COMMAND CENTRE
              </div>
              <h1>Mechanical Engineering Job Automation</h1>
              <p className="subhead">
                Automated CAD, FEA/CFD, and Design Engineer discovery with mandatory review before submission.
              </p>
            </div>
            <button className="primary-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={15} /> Add Job Manually
            </button>
          </div>

          {!isSupabaseConfigured && (
            <div className="notice">
              <span className="notice-dot" />
              Demo workspace — connect Supabase environment secrets to load live automated job runs.
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <Briefcase />
              </div>
              <div className="stat-label">Jobs in workspace</div>
              <div className="stat-value">{loading ? "..." : jobs.length}</div>
              <div className="stat-helper">{isSupabaseConfigured ? "Live Supabase sync" : "Sample records"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">
                <Clock />
              </div>
              <div className="stat-label">Pending review</div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-helper">Needs your decision</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <CheckCircle2 />
              </div>
              <div className="stat-label">Approved to prepare</div>
              <div className="stat-value">{approvedCount}</div>
              <div className="stat-helper">Ready for submission</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">
                <FileText />
              </div>
              <div className="stat-label">Daily preparation cap</div>
              <div className="stat-value">20</div>
              <div className="stat-helper">{Math.max(0, 20 - approvedCount)} slots remaining today</div>
            </div>
          </div>

          <div className="section-grid">
            <div className="panel jobs-panel">
              <div className="panel-heading">
                <div>
                  <h2>{activeTab === "queue" ? "Approved Preparation Queue" : "Priority Job Matches"}</h2>
                  <p>Review matched roles, copy tailored cover letters, and approve before applying.</p>
                </div>
              </div>

              <div className="toolbar">
                <div className="searchbox">
                  <Search size={14} />
                  <input
                    placeholder="Search role, company, or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filterbox">
                  <Filter size={13} />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="ALL">All Statuses</option>
                    <option value="Review">Review</option>
                    <option value="Saved">Saved</option>
                    <option value="Approved">Approved</option>
                    <option value="Applied">Applied</option>
                  </select>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ROLE / COMPANY</th>
                      <th>LOCATION</th>
                      <th>SALARY</th>
                      <th>MATCH</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty">
                          No mechanical engineering roles match your current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => (
                        <tr key={job.id}>
                          <td>
                            <b className="job-title">{job.title}</b>
                            <span className="company">
                              {job.company} · {job.role_type}
                            </span>
                          </td>
                          <td>{job.location}</td>
                          <td>{job.salary_text}</td>
                          <td>
                            <span className="match">{job.match_score}%</span>
                          </td>
                          <td>
                            <span className={`status ${job.status.toLowerCase()}`}>{job.status}</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              {job.status !== "Approved" && job.status !== "Applied" && (
                                <button
                                  className="approve-btn"
                                  onClick={() => updateJobStatus(job.id, "Approved")}
                                >
                                  Approve
                                </button>
                              )}
                              {job.tailored_cover_letter && (
                                <button
                                  className="secondary-btn"
                                  style={{ padding: "5px 8px", fontSize: 9 }}
                                  onClick={() => setSelectedCoverLetter(job)}
                                >
                                  Cover Letter
                                </button>
                              )}
                              {job.apply_url && job.apply_url !== "#" && (
                                <a
                                  href={job.apply_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="secondary-btn"
                                  style={{ padding: "5px 8px", fontSize: 9, textDecoration: "none" }}
                                  onClick={() => updateJobStatus(job.id, "Applied")}
                                >
                                  Apply <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Automation Status</h2>
                  <p>Pipeline health & setup progress</p>
                </div>
                <span className="progress-number">{setupDoneCount}/5</span>
              </div>
              <div className="progress-track">
                <i style={{ width: `${(setupDoneCount / 5) * 100}%` }} />
              </div>
              <div className="setup-list">
                <div className="setup-item">
                  <span className="check-circle done">✓</span>
                  <div>
                    <b>Dashboard workspace deployed</b>
                    <span>GitHub Pages static build active</span>
                  </div>
                </div>
                <div className="setup-item">
                  <span className={`check-circle ${isSupabaseConfigured ? "done" : ""}`}>
                    {isSupabaseConfigured ? "✓" : ""}
                  </span>
                  <div>
                    <b>Supabase database connection</b>
                    <span>{isSupabaseConfigured ? "Connected via NEXT_PUBLIC_SUPABASE_URL" : "Secrets pending"}</span>
                  </div>
                </div>
                <div className="setup-item">
                  <span className={`check-circle ${isSupabaseConfigured ? "done" : ""}`}>
                    {isSupabaseConfigured ? "✓" : ""}
                  </span>
                  <div>
                    <b>CAD / FEA / CFD Scoring Engine</b>
                    <span>Weighted keywords active in discover_jobs.py</span>
                  </div>
                </div>
                <div className="setup-item">
                  <span className={`check-circle ${lastRun ? "done" : ""}`}>{lastRun ? "✓" : ""}</span>
                  <div>
                    <b>Automated 08:00 & 19:00 IST runs</b>
                    <span>{lastRun ? `Last run: ${lastRun}` : "Scheduled via GitHub Actions"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bottom-grid">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Search Schedule</h2>
                  <p>Automated discovery windows via GitHub Actions</p>
                </div>
                <span className="pill pending">{isSupabaseConfigured ? "Scheduled" : "Awaiting Secrets"}</span>
              </div>
              <div className="schedule-times">
                <div>
                  <Clock size={15} />
                  <b>08:00 AM</b>
                  <span>Morning IST sync</span>
                </div>
                <div>
                  <Clock size={15} />
                  <b>07:00 PM</b>
                  <span>Evening IST sync</span>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Active Search Criteria</h2>
                  <p>Filter rules applied during automated discovery</p>
                </div>
              </div>
              <div className="criteria-tags">
                <span>Core Mechanical</span>
                <span>3D CAD / SolidWorks / Creo</span>
                <span>ANSYS FEA / CFD</span>
                <span>MATLAB</span>
                <span>India-wide</span>
                <span>Full-time / GET</span>
                <span>₹35k+/month target</span>
              </div>
              <p className="muted-note">
                Aerospace, UAV, defence, aircraft, sales, and civil roles are automatically excluded.
              </p>
            </div>
          </div>

          <footer>
            <span>MechCareer · Automated Mechanical Job Workspace</span>
            <span>Manual review enforced before every application</span>
          </footer>
        </div>
      </section>

      {/* Add Manual Job Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>Add Mechanical Role</h2>
                <p>Save a vacancy and generate a tailored cover letter draft.</p>
              </div>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddJob}>
              <label>
                Role Title *
                <input
                  required
                  placeholder="e.g. Mechanical Design Engineer – FEA"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </label>
              <label>
                Company *
                <input
                  required
                  placeholder="e.g. Tata Technologies"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                />
              </label>
              <label>
                Location
                <input
                  placeholder="e.g. Pune / Bengaluru / Noida"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
              </label>
              <label>
                Salary (Monthly / LPA)
                <input value={newSalary} onChange={(e) => setNewSalary(e.target.value)} />
              </label>
              <label>
                Application URL
                <input
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      {selectedCoverLetter && (
        <div className="modal-backdrop" onClick={() => setSelectedCoverLetter(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>Tailored Cover Letter</h2>
                <p>
                  {selectedCoverLetter.title} — {selectedCoverLetter.company}
                </p>
              </div>
              <button className="icon-btn" onClick={() => setSelectedCoverLetter(null)}>
                <X size={18} />
              </button>
            </div>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                fontSize: 12,
                lineHeight: 1.6,
                background: "#f6f8fb",
                padding: 14,
                borderRadius: 8,
                border: "1px solid #e7edf6",
              }}
            >
              {selectedCoverLetter.tailored_cover_letter}
            </pre>
            <div className="modal-actions" style={{ marginTop: 14 }}>
              <button className="secondary-btn" onClick={() => copyCoverLetter(selectedCoverLetter)}>
                <Copy size={13} /> {copiedId === selectedCoverLetter.id ? "Copied!" : "Copy Text"}
              </button>
              <button className="primary-btn" onClick={() => setSelectedCoverLetter(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
