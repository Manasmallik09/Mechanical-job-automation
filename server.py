#!/usr/bin/env python3
"""MechCareer local app: Python standard library + SQLite, no cloud services."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime
import sqlite3, json, os, csv, io, webbrowser

ROOT=Path(__file__).resolve().parent
DATA=ROOT/"data"; DATA.mkdir(exist_ok=True)
DB=DATA/"mechcareer.sqlite3"
HOST="127.0.0.1"; PORT=int(os.environ.get("MECHCAREER_PORT","8765"))
SCHEMA="""
CREATE TABLE IF NOT EXISTS jobs(
 id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,company TEXT NOT NULL,
 location TEXT DEFAULT '',salary TEXT DEFAULT '',job_type TEXT DEFAULT 'Full-time',
 source TEXT DEFAULT 'Manual',apply_url TEXT DEFAULT '',posted_date TEXT DEFAULT '',
 deadline TEXT DEFAULT '',match_score INTEGER DEFAULT 0 CHECK(match_score BETWEEN 0 AND 100),
 status TEXT NOT NULL DEFAULT 'Saved',notes TEXT DEFAULT '',
 created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS activity(id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER,
 action TEXT NOT NULL,detail TEXT DEFAULT '',created_at TEXT NOT NULL,
 FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL);
"""
STATUSES={"Saved","Shortlisted","Preparing","Applied","Interview","Rejected","Closed"}
def clean_http_url(value):
 value=str(value or "").strip()
 if not value:return ""
 from urllib.parse import urlparse
 parsed=urlparse(value)
 if parsed.scheme not in ("http","https") or not parsed.netloc:
  raise ValueError("Job URL must begin with http:// or https://.")
 return value
def safe_csv_cell(value):
 value="" if value is None else str(value)
 return "'"+value if value.startswith(("=","+","-","@","\t","\r")) else value
def stamp(): return datetime.now().astimezone().isoformat(timespec="seconds")
def dbopen():
 d=sqlite3.connect(DB,timeout=10); d.row_factory=sqlite3.Row
 d.execute("PRAGMA foreign_keys=ON"); d.execute("PRAGMA journal_mode=WAL"); return d
def init():
 with dbopen() as d:
  d.executescript(SCHEMA)
  defaults={"target_salary":"35000","locations":"India-wide","employment":"Full-time, Graduate Engineer Trainee","include_roles":"Mechanical Design, Manufacturing, Production, Quality, Maintenance, FEA, CFD, R&D","exclude_terms":"aerospace, UAV, defence, defense, aircraft","daily_review_limit":"20"}
  for k,v in defaults.items(): d.execute("INSERT OR IGNORE INTO settings VALUES(?,?)",(k,v))
HTML = r"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MechCareer Local</title><style>
:root{--bg:#f3f5f8;--paper:#fff;--ink:#192b42;--muted:#7c8ba0;--line:#e5eaf0;--blue:#2865d6;--nav:#101d2d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 "Segoe UI",Arial,sans-serif}button,input,select,textarea{font:inherit}button{cursor:pointer}.shell{min-height:100vh;display:flex}.side{width:230px;background:var(--nav);color:#eaf0f8;padding:23px 15px;display:flex;flex-direction:column;flex-shrink:0}.brand{font-size:18px;font-weight:750;padding:4px 8px 32px}.brand small{display:block;color:#8fa2ba;font-size:9px;letter-spacing:1.5px}.navlabel{font-size:9px;letter-spacing:1.5px;color:#72849b;padding:0 12px 10px}.nav{display:grid;gap:5px}.nav button{border:0;background:none;color:#a8b6c8;text-align:left;border-radius:8px;padding:11px 12px;font-weight:600}.nav button.active,.nav button:hover{background:#1d3451;color:#fff}.side-note{margin-top:auto;padding:12px;border:1px solid #2b4059;border-radius:9px;color:#91a3b9;font-size:10px}.side-note b{display:block;color:#dbe7f6}.main{min-width:0;flex:1}.top{height:64px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 30px}.local{font-size:11px;color:#64758b}.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#24a16e;margin-right:6px}.content{max-width:1450px;margin:auto;padding:29px 30px}.welcome{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:20px}.eyebrow{font-size:9px;letter-spacing:1.4px;font-weight:700;color:#4775c5;margin-bottom:8px}.welcome h1{font-size:25px;letter-spacing:-.7px;margin:0}.welcome p{font-size:12px;color:var(--muted);margin:7px 0 0}.btn{border:0;border-radius:7px;background:var(--blue);color:white;padding:10px 14px;font-weight:700;font-size:11px}.btn.secondary{background:#fff;border:1px solid #dce3ec;color:#53647b}.notice{display:none;padding:10px 13px;border:1px solid #e3eaf2;background:#fff;border-radius:8px;margin-bottom:15px;color:#687990;font-size:11px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:16px}.stat,.panel{background:var(--paper);border:1px solid var(--line);border-radius:10px}.stat{padding:16px}.stat label{color:var(--muted);font-size:10px}.stat strong{display:block;font-size:25px;margin-top:5px}.stat small{font-size:10px;color:#a0aaba}.grid{display:grid;grid-template-columns:1.6fr 1fr;gap:15px;margin-bottom:15px}.panel{padding:18px}.panelhead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:15px}.panel h2{font-size:14px;margin:0}.panelhead p{font-size:10px;color:#929eae;margin:4px 0 0}.linkbtn{border:0;background:none;color:var(--blue);font-size:10px;font-weight:700}.criteria{display:flex;flex-wrap:wrap;gap:7px}.tag{background:#f0f4fa;border:1px solid #e6ecf4;border-radius:5px;padding:6px 8px;font-size:9px;color:#62738c}.muted{color:#9aa6b5;font-size:10px}.toolbar{display:flex;gap:9px;margin-bottom:14px;flex-wrap:wrap}.field,select,textarea{width:100%;border:1px solid #dfe6ef;border-radius:7px;padding:9px 10px;background:#fff;color:var(--ink);font-size:11px}.search{flex:1;min-width:190px}.filter{width:175px}.tablewrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:740px}th{text-align:left;font-size:9px;color:#9aa6b5;letter-spacing:.7px;padding:10px;border-bottom:1px solid var(--line)}td{font-size:10px;color:#66778e;padding:12px 10px;border-bottom:1px solid #eff2f6;vertical-align:middle}td b{display:block;color:#30435e;font-size:11px}td small{display:block;color:#9aa6b5;margin-top:3px}.pill{display:inline-block;border-radius:20px;padding:4px 8px;font-size:9px;font-weight:700;background:#eef3fb;color:#5274a8;white-space:nowrap}.pill.Applied,.pill.Interview{background:#e9f7f0;color:#16845b}.pill.Rejected{background:#fff0f0;color:#b64a4a}.pill.Shortlisted,.pill.Preparing{background:#fff5e7;color:#b7791f}.mini{border:1px solid #dfe6ef;background:#fff;border-radius:5px;padding:5px 7px;font-size:9px;color:#52647b;margin-right:4px}.empty{text-align:center;padding:35px 12px;color:#8b98a9;font-size:12px}.formgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.formgrid label,.settings label{display:grid;gap:5px;font-size:10px;color:#61718a;font-weight:700}.span2{grid-column:span 2}.modalback{position:fixed;inset:0;background:#10203399;display:none;place-items:center;padding:18px;z-index:5}.modal{width:min(100%,620px);max-height:92vh;overflow:auto;background:#fff;border-radius:12px;padding:22px}.modalhead{display:flex;justify-content:space-between;margin-bottom:17px}.modalhead h2{font-size:17px;margin:0}.modalhead p{font-size:10px;color:var(--muted);margin:5px 0}.close{border:0;background:none;font-size:22px}.modalfoot{display:flex;justify-content:flex-end;gap:8px;margin-top:17px}.settings{display:grid;gap:14px;max-width:650px}.settings label textarea{min-height:60px}.activity{display:grid;gap:12px}.activity div{border-left:2px solid #d9e4f4;padding-left:11px}.activity b{font-size:10px}.activity small{display:block;color:#9aa6b5;font-size:9px;margin-top:3px}footer{display:flex;justify-content:space-between;gap:10px;color:#a1abba;font-size:9px;padding:23px 2px}.hidden{display:none!important}@media(max-width:950px){.content{padding:23px 18px}.grid{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.side{width:64px;padding:18px 7px}.brand{padding:0 3px 24px}.brand small,.navlabel,.nav button span,.side-note{display:none}.nav button{text-align:center;padding:12px 3px}.top{height:55px;padding:0 12px}.content{padding:18px 11px}.welcome{align-items:flex-start;flex-direction:column}.welcome h1{font-size:21px}.welcome .btn{width:100%}.stats{gap:8px}.stat{padding:12px}.stat strong{font-size:22px}.formgrid{grid-template-columns:1fr}.span2{grid-column:auto}footer{flex-direction:column}.filter{width:100%}}
</style></head><body><div class="shell"><aside class="side"><div class="brand">⚙ MechCareer<small>LOCAL JOB WORKSPACE</small></div><div class="navlabel">WORKSPACE</div><nav class="nav"><button class="active" data-view="overview">▦ <span>Overview</span></button><button data-view="jobs">▤ <span>Job tracker</span></button><button data-view="applications">✓ <span>Applications</span></button><button data-view="settings">⚙ <span>Preferences</span></button></nav><div class="side-note"><b>Private by design</b>Records live in SQLite on this computer. Server binds to localhost.</div></aside>
<section class="main"><header class="top"><div>MechCareer / <b id="crumb">Overview</b></div><div class="local"><i class="dot"></i> Running locally · SQLite</div></header><main class="content"><div class="welcome"><div><div class="eyebrow">MECHANICAL ENGINEERING CAREER WORKSPACE</div><h1 id="heading">Your job search, in control.</h1><p>Organise verified opportunities and track applications. No fake vacancy listings.</p></div><button class="btn" id="addBtn">＋ Add a job</button></div><div class="notice" id="notice"></div>
<section id="overview"><div class="stats"><div class="stat"><label>Jobs saved</label><strong id="sTotal">0</strong><small>Records in your database</small></div><div class="stat"><label>To review</label><strong id="sReview">0</strong><small>Saved, shortlisted, preparing</small></div><div class="stat"><label>Applications sent</label><strong id="sApplied">0</strong><small>Marked by you</small></div><div class="stat"><label>Interviews</label><strong id="sInterview">0</strong><small>Interview stage</small></div></div><div class="grid"><div class="panel"><div class="panelhead"><div><h2>Recently added opportunities</h2><p>Only jobs you add appear here.</p></div><button class="linkbtn" data-goto="jobs">View all →</button></div><div id="recent"></div></div><div class="panel"><div class="panelhead"><div><h2>Search preferences</h2><p>Your targeting rules</p></div><button class="linkbtn" data-goto="settings">Edit</button></div><div class="criteria" id="criteria"></div><p class="muted">Salary target is a preference, not an assumed salary.</p></div></div><div class="panel"><div class="panelhead"><div><h2>Recent activity</h2></div></div><div class="activity" id="activity"></div></div></section>
<section id="jobs" class="hidden"><div class="panel"><div class="panelhead"><div><h2>Job tracker</h2><p>Search, filter and update verified opportunities.</p></div><button class="btn" id="addBtn2">＋ Add job</button></div><div class="toolbar"><input class="field search" id="q" placeholder="Search role, company or location"><select class="field filter" id="statusFilter"><option value="">All statuses</option><option>Saved</option><option>Shortlisted</option><option>Preparing</option><option>Applied</option><option>Interview</option><option>Rejected</option><option>Closed</option></select></div><div id="jobTable"></div></div></section>
<section id="applications" class="hidden"><div class="panel"><div class="panelhead"><div><h2>Application pipeline</h2><p>Track applications after you submit them yourself.</p></div></div><div id="applicationTable"></div></div></section>
<section id="settings" class="hidden"><div class="panel"><div class="panelhead"><div><h2>Search preferences</h2><p>Stored in your local SQLite database.</p></div></div><form class="settings" id="settingsForm"><label>Minimum monthly salary target (₹)<input class="field" name="target_salary" type="number" min="0"></label><label>Locations<textarea class="field" name="locations"></textarea></label><label>Employment types<textarea class="field" name="employment"></textarea></label><label>Preferred core mechanical roles<textarea class="field" name="include_roles"></textarea></label><label>Excluded terms<textarea class="field" name="exclude_terms"></textarea></label><label>Daily preparation limit<input class="field" name="daily_review_limit" type="number" min="1" max="100"></label><div><button class="btn">Save preferences</button> <button type="button" class="btn secondary" id="exportBtn">Export jobs CSV</button></div></form><p class="muted">No Supabase, Vercel, cloud database or external API is used. Job discovery and employer application pages need internet and are not automated.</p></div></section><footer><span>MechCareer · Local-first job workspace</span><span>Nothing is submitted without your own action.</span></footer></main></section></div>
<div class="modalback" id="modalBack"><div class="modal"><div class="modalhead"><div><h2 id="modalTitle">Add a job opportunity</h2><p>Enter a vacancy checked on the employer's official site.</p></div><button class="close" id="closeModal">×</button></div><form id="jobForm"><input type="hidden" name="id"><div class="formgrid"><label>Job title *<input class="field" name="title" required maxlength="180"></label><label>Company *<input class="field" name="company" required maxlength="160"></label><label>Location<input class="field" name="location"></label><label>Monthly salary<input class="field" name="salary" placeholder="₹35,000 or Not disclosed"></label><label>Employment type<select class="field" name="job_type"><option>Full-time</option><option>Graduate Engineer Trainee</option><option>Internship</option><option>Contract</option><option>Part-time</option></select></label><label>Status<select class="field" name="status"><option>Saved</option><option>Shortlisted</option><option>Preparing</option><option>Applied</option><option>Interview</option><option>Rejected</option><option>Closed</option></select></label><label>Match score (0–100)<input class="field" name="match_score" type="number" min="0" max="100" value="0"></label><label>Posted date<input class="field" name="posted_date" type="date"></label><label class="span2">Official job URL<input class="field" name="apply_url" type="url" placeholder="https://company.com/careers/job-id"></label><label>Deadline<input class="field" name="deadline" type="date"></label><label>Source<input class="field" name="source" placeholder="Company careers page"></label><label class="span2">Notes<textarea class="field" name="notes"></textarea></label></div><div class="modalfoot"><button type="button" class="btn secondary" id="cancelModal">Cancel</button><button class="btn">Save job</button></div></form></div></div>
<script>
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];let jobs=[],settings={},activity=[];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(path,opts={}){const r=await fetch(path,{headers:{"Content-Type":"application/json"},...opts});if(!r.ok)throw Error((await r.json()).error||"Request failed");return r.headers.get("content-type")?.includes("json")?r.json():r.text()}
function msg(t){const n=$("#notice");n.textContent=t;n.style.display="block";setTimeout(()=>n.style.display="none",4500)}
function nav(v){$$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===v));["overview","jobs","applications","settings"].forEach(x=>$("#"+x).classList.toggle("hidden",x!==v));$("#crumb").textContent=v[0].toUpperCase()+v.slice(1);$("#heading").textContent=({overview:"Your job search, in control.",jobs:"Track every opportunity.",applications:"Your application pipeline.",settings:"Set your search preferences."})[v];if(v==="jobs")renderJobs();if(v==="applications")renderApps()}
function badge(s){return '<span class="pill '+esc(s)+'">'+esc(s)+'</span>'}
function table(items){if(!items.length)return '<div class="empty">No records yet. Add a verified job to get started.</div>';return '<div class="tablewrap"><table><thead><tr><th>ROLE / COMPANY</th><th>LOCATION</th><th>SALARY</th><th>MATCH</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>'+items.map(j=>'<tr><td><b>'+esc(j.title)+'</b><small>'+esc(j.company)+' · '+esc(j.job_type)+'</small></td><td>'+esc(j.location||"—")+'</td><td>'+esc(j.salary||"Not disclosed")+'</td><td>'+(j.match_score?j.match_score+"%":"—")+'</td><td>'+badge(j.status)+'</td><td><button class="mini" data-edit="'+j.id+'">Edit</button>'+(j.apply_url?'<button class="mini" data-open="'+j.id+'">Open</button>':'')+'<button class="mini" data-delete="'+j.id+'">Delete</button></td></tr>').join("")+'</tbody></table></div>'}
function renderJobs(){let q=$("#q").value.toLowerCase(),st=$("#statusFilter").value;$("#jobTable").innerHTML=table(jobs.filter(j=>(!st||j.status===st)&&[j.title,j.company,j.location].join(" ").toLowerCase().includes(q)))}
function renderApps(){$("#applicationTable").innerHTML=table(jobs.filter(j=>["Applied","Interview","Rejected","Closed"].includes(j.status)))}
function render(){jobs.sort((a,b)=>b.id-a.id);$("#sTotal").textContent=jobs.length;$("#sReview").textContent=jobs.filter(j=>["Saved","Shortlisted","Preparing"].includes(j.status)).length;$("#sApplied").textContent=jobs.filter(j=>j.status==="Applied").length;$("#sInterview").textContent=jobs.filter(j=>j.status==="Interview").length;$("#recent").innerHTML=table(jobs.slice(0,5));$("#criteria").innerHTML=[settings.target_salary?"₹"+Number(settings.target_salary).toLocaleString("en-IN")+"/month target":"Salary target unset",settings.locations,settings.employment,settings.include_roles,settings.exclude_terms].filter(Boolean).map(x=>'<span class="tag">'+esc(x)+'</span>').join("");$("#activity").innerHTML=activity.length?activity.map(a=>'<div><b>'+esc(a.action)+'</b><small>'+esc(a.detail||"")+' · '+esc(a.created_at||"")+'</small></div>').join(""):'<div class="empty">No activity yet.</div>';renderJobs();renderApps()}
async function refresh(){let d=await api("/api/dashboard");jobs=d.jobs;settings=d.settings;activity=d.activity;render();let f=$("#settingsForm");Object.keys(settings).forEach(k=>{if(f.elements[k])f.elements[k].value=settings[k]})}
function openModal(j){let f=$("#jobForm");f.reset();f.elements.id.value=j?.id||"";$("#modalTitle").textContent=j?"Edit job":"Add a job opportunity";if(j)Object.keys(j).forEach(k=>{if(f.elements[k])f.elements[k].value=j[k]??""});$("#modalBack").style.display="grid"}
function closeModal(){$("#modalBack").style.display="none"}
$("#addBtn").onclick=$("#addBtn2").onclick=()=>openModal();$("#closeModal").onclick=$("#cancelModal").onclick=closeModal;$("#modalBack").onclick=e=>{if(e.target.id==="modalBack")closeModal()};
$("#jobForm").onsubmit=async e=>{e.preventDefault();let v=Object.fromEntries(new FormData(e.target).entries());v.match_score=Number(v.match_score||0);try{await api(v.id?"/api/jobs/"+v.id:"/api/jobs",{method:v.id?"PATCH":"POST",body:JSON.stringify(v)});closeModal();await refresh();msg(v.id?"Job updated.":"Job saved in local SQLite.")}catch(err){msg(err.message)}};
document.addEventListener("click",async e=>{let b=e.target.closest("button");if(!b)return;if(b.dataset.view)nav(b.dataset.view);if(b.dataset.goto)nav(b.dataset.goto);if(b.dataset.edit){let j=jobs.find(x=>x.id===Number(b.dataset.edit));if(j)openModal(j)}if(b.dataset.open){let j=jobs.find(x=>x.id===Number(b.dataset.open));if(j?.apply_url)window.open(j.apply_url,"_blank","noopener")}if(b.dataset.delete&&confirm("Delete this job?")){try{await api("/api/jobs/"+b.dataset.delete,{method:"DELETE"});await refresh();msg("Job deleted.")}catch(err){msg(err.message)}}});
$("#q").oninput=renderJobs;$("#statusFilter").onchange=renderJobs;$$(".nav button").forEach(b=>b.onclick=()=>nav(b.dataset.view));$$("[data-goto]").forEach(b=>b.onclick=()=>nav(b.dataset.goto));
$("#settingsForm").onsubmit=async e=>{e.preventDefault();try{settings=await api("/api/settings",{method:"PUT",body:JSON.stringify(Object.fromEntries(new FormData(e.target).entries()))});render();msg("Preferences saved locally.")}catch(err){msg(err.message)}};
$("#exportBtn").onclick=()=>window.location="/api/export.csv";refresh().catch(e=>msg("Could not load local database: "+e.message));
</script></body></html>"""
class Handler(BaseHTTPRequestHandler):
 def log_message(self,fmt,*args): print("%s - %s"%(self.address_string(),fmt%args))
 def send(self,status,body,ctype="application/json; charset=utf-8",extra=None):
  data=body if isinstance(body,bytes) else body.encode("utf-8")
  self.send_response(status);self.send_header("Content-Type",ctype);self.send_header("Content-Length",str(len(data)));self.send_header("X-Content-Type-Options","nosniff");self.send_header("X-Frame-Options","DENY");self.send_header("Referrer-Policy","no-referrer");self.send_header("Permissions-Policy","camera=(), microphone=(), geolocation=()");self.send_header("Cache-Control","no-store")
  for k,v in (extra or {}).items():self.send_header(k,v)
  self.end_headers();self.wfile.write(data)
 def js(self,status,obj):self.send(status,json.dumps(obj,ensure_ascii=False))
 def body(self):
  n=int(self.headers.get("Content-Length","0"))
  if n>100000:raise ValueError("Request too large")
  obj=json.loads(self.rfile.read(n).decode() or "{}")
  if not isinstance(obj,dict):raise ValueError("Expected JSON object")
  return obj
 def do_GET(self):
  p=urlparse(self.path).path
  if p in ("/","/index.html"):return self.send(200,HTML,"text/html; charset=utf-8")
  if p=="/api/dashboard":
   with dbopen() as d:
    jobs=[dict(r) for r in d.execute("SELECT * FROM jobs ORDER BY id DESC")]
    settings={r["key"]:r["value"] for r in d.execute("SELECT key,value FROM settings")}
    activity=[dict(r) for r in d.execute("SELECT * FROM activity ORDER BY id DESC LIMIT 8")]
   return self.js(200,{"jobs":jobs,"settings":settings,"activity":activity})
  if p=="/api/export.csv":
   with dbopen() as d:rows=d.execute("SELECT * FROM jobs ORDER BY id").fetchall()
   out=io.StringIO();w=csv.writer(out);w.writerow(rows[0].keys() if rows else ["id","title","company","location","salary","status"])
   for r in rows:w.writerow([safe_csv_cell(x) for x in r])
   return self.send(200,out.getvalue(),"text/csv; charset=utf-8",{"Content-Disposition":'attachment; filename="mechcareer-jobs.csv"'})
  return self.js(404,{"error":"Not found"})
 def do_POST(self):
  try:
   if urlparse(self.path).path!="/api/jobs":return self.js(404,{"error":"Not found"})
   v=self.body();title=str(v.get("title","")).strip();company=str(v.get("company","")).strip()
   if not title or not company:return self.js(400,{"error":"Job title and company are required."})
   score=int(v.get("match_score") or 0)
   if not 0<=score<=100:return self.js(400,{"error":"Match score must be 0–100."})
   status=str(v.get("status") or "Saved")
   if status not in STATUSES:return self.js(400,{"error":"Invalid application status."})
   apply_url=clean_http_url(v.get("apply_url",""))
   keys=["location","salary","job_type","source","apply_url","posted_date","deadline"]
   vals=[title,company]+[apply_url if k=="apply_url" else str(v.get(k,"")).strip() for k in keys]+[score,status,str(v.get("notes","")).strip(),stamp(),stamp()]
   with dbopen() as d:
    cur=d.execute("INSERT INTO jobs(title,company,location,salary,job_type,source,apply_url,posted_date,deadline,match_score,status,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",vals)
    jid=cur.lastrowid;d.execute("INSERT INTO activity(job_id,action,detail,created_at) VALUES(?,?,?,?)",(jid,"Job added",title+" — "+company,stamp()))
   return self.js(201,{"id":jid})
  except Exception as e:return self.js(400,{"error":str(e)})
 def do_PATCH(self):
  try:
   p=urlparse(self.path).path.strip("/").split("/")
   if len(p)!=3 or p[:2]!=["api","jobs"]:return self.js(404,{"error":"Not found"})
   jid=int(p[2]);v=self.body();allowed={"title","company","location","salary","job_type","source","apply_url","posted_date","deadline","match_score","status","notes"}
   u={k:v[k] for k in v if k in allowed}
   if "status" in u and str(u["status"]) not in STATUSES:return self.js(400,{"error":"Invalid application status."})
   if "apply_url" in u:u["apply_url"]=clean_http_url(u["apply_url"])
   if "match_score" in u:
    try:u["match_score"]=int(u["match_score"])
    except (TypeError,ValueError):return self.js(400,{"error":"Match score must be a number from 0 to 100."})
    if not 0<=u["match_score"]<=100:return self.js(400,{"error":"Match score must be 0–100"})
   if not u:return self.js(400,{"error":"No fields supplied"})
   u["updated_at"]=stamp()
   with dbopen() as d:
    old=d.execute("SELECT title,status FROM jobs WHERE id=?",(jid,)).fetchone()
    if not old:return self.js(404,{"error":"Job not found"})
    d.execute("UPDATE jobs SET "+",".join(k+"=?" for k in u)+" WHERE id=?",list(u.values())+[jid])
    d.execute("INSERT INTO activity(job_id,action,detail,created_at) VALUES(?,?,?,?)",(jid,"Job updated",old["title"]+" · "+str(u.get("status",old["status"])),stamp()))
   return self.js(200,{"ok":True})
  except Exception as e:return self.js(400,{"error":str(e)})
 def do_PUT(self):
  try:
   if urlparse(self.path).path!="/api/settings":return self.js(404,{"error":"Not found"})
   v=self.body();allowed={"target_salary","locations","employment","include_roles","exclude_terms","daily_review_limit"}
   with dbopen() as d:
    for k,val in v.items():
     if k in allowed:d.execute("INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",(k,str(val)))
    result={r["key"]:r["value"] for r in d.execute("SELECT key,value FROM settings")}
   return self.js(200,result)
  except Exception as e:return self.js(400,{"error":str(e)})
 def do_DELETE(self):
  p=urlparse(self.path).path.strip("/").split("/")
  if len(p)!=3 or p[:2]!=["api","jobs"]:return self.js(404,{"error":"Not found"})
  try:jid=int(p[2])
  except ValueError:return self.js(400,{"error":"Invalid job ID"})
  with dbopen() as d:
   cur=d.execute("DELETE FROM jobs WHERE id=?",(jid,))
   if not cur.rowcount:return self.js(404,{"error":"Job not found"})
   d.execute("INSERT INTO activity(action,detail,created_at) VALUES(?,?,?)",("Job deleted","Job #"+str(jid),stamp()))
  return self.js(200,{"ok":True})
def main():
 init();url="http://"+HOST+":"+str(PORT)
 print("MechCareer ready: "+url);print("SQLite database: "+str(DB));print("Press Ctrl+C to stop.")
 try:webbrowser.open(url)
 except Exception:pass
 ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
if __name__=="__main__":main()
