import os
import re
import requests
from datetime import datetime, timezone
from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
ADZUNA_APP_ID = os.environ.get("ADZUNA_APP_ID", "")
ADZUNA_APP_KEY = os.environ.get("ADZUNA_APP_KEY", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

SKILL_WEIGHTS = {
    "fea": 18,
    "ansys": 18,
    "apdl": 15,
    "cfd": 16,
    "solidworks": 14,
    "creo": 14,
    "catia": 14,
    "matlab": 12,
    "cad": 12,
    "structural": 12,
    "thermal": 10,
    "gd&t": 10,
    "r&d": 10,
    "mechanical design": 15,
    "design engineer": 12,
    "automotive": 10,
    "propulsion": 12,
    "manufacturing": 8,
    "graduate engineer trainee": 10,
}

EXCLUDED_TERMS = [
    "sales",
    "telecaller",
    "bpo",
    "hr ",
    "recruiter",
    "civil engineer",
    "software developer",
    "aerospace",
    "uav",
    "defence",
    "aircraft",
]

def score_job(title: str, description: str):
    combined = f"{title} {description}".lower()
    if any(term in combined for term in EXCLUDED_TERMS):
        return 0, []

    score = 35
    matched = []
    for skill, weight in SKILL_WEIGHTS.items():
        if re.search(rf"\b{re.escape(skill)}\b", combined):
            score += weight
            matched.append(skill.upper() if len(skill) <= 4 else skill.title())

    return min(score, 99), sorted(list(set(matched)))

def build_cover_letter(title: str, company: str, matched_skills: list[str]) -> str:
    skills_str = ", ".join(matched_skills[:5]) if matched_skills else "3D CAD, Structural FEA, and Mechanical Design"
    return (
        f"Dear Hiring Team at {company},\n\n"
        f"I am writing to express my interest in the {title} position. With hands-on mechanical engineering "
        f"experience in {skills_str}, structural stress modeling, and MATLAB-driven simulation workflows, I bring "
        f"strong CAD-to-simulation execution capability to your engineering team.\n\n"
        f"In my engineering work, I have built parametric FEA validation workflows in ANSYS/APDL, modeled "
        f"high-stress mechanical assemblies with GD&T compliance, and automated design verification routines to "
        f"accelerate product development. I would welcome the opportunity to discuss how my background can contribute "
        f"to {company}.\n\n"
        f"Sincerely,\nManas Mallik"
    )

def fetch_adzuna_india():
    if not (ADZUNA_APP_ID and ADZUNA_APP_KEY):
        print("Adzuna credentials missing; skipping Adzuna feed.")
        return []

    queries = [
        "mechanical design engineer",
        "FEA ANSYS engineer",
        "CFD simulation engineer",
        "graduate engineer trainee mechanical",
    ]
    results = []
    for q in queries:
        url = "https://api.adzuna.com/v1/api/jobs/in/search/1"
        params = {
            "app_id": ADZUNA_APP_ID,
            "app_key": ADZUNA_APP_KEY,
            "results_per_page": 20,
            "what": q,
            "max_days_old": 30,
            "content-type": "application/json",
        }
        resp = requests.get(url, params=params, timeout=20)
        if resp.ok:
            results.extend(resp.json().get("results", []))
    return results

def run():
    raw_jobs = fetch_adzuna_india()
    matched_count = 0

    for item in raw_jobs:
        title = item.get("title", "")
        desc = item.get("description", "")
        company = item.get("company", {}).get("display_name", "Unknown Company")
        location = item.get("location", {}).get("display_name", "India")
        apply_url = item.get("redirect_url", "")
        ext_id = f"adzuna_{item.get('id')}"

        score, matched_skills = score_job(title, desc)
        if score < 75 or not apply_url:
            continue

        salary_min = item.get("salary_min")
        monthly_salary = int(salary_min / 12) if salary_min else None
        if monthly_salary and monthly_salary < 35000:
            continue

        salary_text = f"₹{monthly_salary:,}/mo" if monthly_salary else "Not disclosed"
        cover_letter = build_cover_letter(title, company, matched_skills) if score >= 85 else None

        payload = {
            "external_job_id": ext_id,
            "title": re.sub(r"<[^>]+>", "", title),
            "company": company,
            "location": location,
            "salary_text": salary_text,
            "salary_min_monthly": monthly_salary,
            "match_score": score,
            "matched_skills": matched_skills,
            "status": "Review",
            "source_name": "Adzuna India",
            "apply_url": apply_url,
            "tailored_cover_letter": cover_letter,
            "posted_at": item.get("created", datetime.now(timezone.utc).isoformat()),
        }
        supabase.table("jobs").upsert(payload, on_conflict="external_job_id").execute()
        matched_count += 1

    supabase.table("automation_runs").insert({
        "run_slot": datetime.now(timezone.utc).strftime("%H:%M UTC"),
        "jobs_fetched": len(raw_jobs),
        "jobs_matched": matched_count,
        "status": "success",
    }).execute()
    print(f"Completed: {matched_count} matched jobs synced out of {len(raw_jobs)} fetched.")

if __name__ == "__main__":
    run()
