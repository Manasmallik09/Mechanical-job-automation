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

# Skills Manas actually lists on his CV, plus automotive keywords for target roles.
SKILL_WEIGHTS = {
    "solidworks": 16,
    "creo": 16,
    "fusion 360": 10,
    "autocad": 8,
    "cad": 12,
    "gd&t": 12,
    "dfm": 10,
    "sheet metal": 12,
    "injection mold": 12,
    "plastic": 8,
    "bom": 6,
    "ansys": 14,
    "cfd": 12,
    "fea": 14,
    "mechanical design": 15,
    "design engineer": 12,
    "r&d": 8,
    "graduate engineer trainee": 10,
    "automotive": 14,
    "vehicle": 10,
    "body in white": 14,
    "biw": 14,
    "bodyshell": 12,
    "chassis": 12,
    "powertrain": 10,
    "ev": 8,
    "manufacturing": 8,
}

# Aerospace/defence removed from exclusions only if you want those roles back.
EXCLUDED_TERMS = [
    "sales",
    "telecaller",
    "bpo",
    "recruiter",
    "civil engineer",
    "software developer",
]

PREFERRED_LOCATIONS = {"bhubaneswar": 8, "odisha": 5, "pune": 3, "chennai": 3, "bengaluru": 3, "bangalore": 3}

DISPLAY_NAMES = {"gd&t": "GD&T", "dfm": "DFM", "bom": "BOM", "cad": "CAD", "cfd": "CFD", "fea": "FEA",
                 "biw": "BIW", "ev": "EV", "r&d": "R&D"}


def score_job(title: str, description: str, location: str):
    combined = f"{title} {description}".lower()
    if any(re.search(rf"\b{re.escape(t)}\b", combined) for t in EXCLUDED_TERMS):
        return 0, []

    score = 35
    matched = []
    for skill, weight in SKILL_WEIGHTS.items():
        if re.search(rf"(?<!\w){re.escape(skill)}(?!\w)", combined):
            score += weight
            matched.append(DISPLAY_NAMES.get(skill, skill.title()))

    loc = (location or "").lower()
    for place, bonus in PREFERRED_LOCATIONS.items():
        if place in loc:
            score += bonus
            break

    return min(score, 99), sorted(set(matched))


def build_cover_letter(title: str, company: str, matched_skills: list[str]) -> str:
    skills_str = ", ".join(matched_skills[:5]) if matched_skills else "SolidWorks, Creo and GD&T"
    return (
        f"Dear Hiring Team at {company},\n\n"
        f"I am writing to apply for the {title} position. I am a mechanical design engineer working on "
        f"UAV systems, with hands-on experience in {skills_str}, DFM, sheet metal and injection mold design, "
        f"and bill-of-materials ownership.\n\n"
        f"My team won AIR 1 for Best Design Report at SAE DDC 2025, and I completed a summer internship at DRDO. "
        f"I would welcome the chance to discuss how my design background can contribute to {company}.\n\n"
        f"Sincerely,\nManas Mallik"
    )


def fetch_adzuna_india():
    if not (ADZUNA_APP_ID and ADZUNA_APP_KEY):
        print("Adzuna credentials missing; skipping Adzuna feed.")
        return []

    queries = [
        "mechanical design engineer",
        "automotive design engineer",
        "CAD design engineer creo solidworks",
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
        try:
            resp = requests.get(url, params=params, timeout=20)
            if resp.ok:
                results.extend(resp.json().get("results", []))
            else:
                print(f"Adzuna '{q}' returned {resp.status_code}")
        except requests.RequestException as exc:
            print(f"Adzuna '{q}' failed: {exc}")
    return results


def run():
    raw_jobs = fetch_adzuna_india()
    matched_count = 0

    for item in raw_jobs:
        title = re.sub(r"<[^>]+>", "", item.get("title", ""))
        desc = item.get("description", "")
        company = (item.get("company") or {}).get("display_name", "Unknown Company")
        location = (item.get("location") or {}).get("display_name", "India")
        apply_url = item.get("redirect_url", "")
        ext_id = f"adzuna_{item.get('id')}"

        score, matched_skills = score_job(title, desc, location)
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
            "title": title,
            "company": company,
            "location": location,
            "salary_text": salary_text,
            "salary_min_monthly": monthly_salary,
            "match_score": score,
            "matched_skills": matched_skills,
            "source_name": "Adzuna India",
            "apply_url": apply_url,
            "tailored_cover_letter": cover_letter,
            "posted_at": item.get("created", datetime.now(timezone.utc).isoformat()),
        }
        # "status" is left out so re-runs don't overwrite a status set elsewhere.
        supabase.table("jobs").upsert(payload, on_conflict="external_job_id").execute()
        matched_count += 1

    supabase.table("automation_runs").insert({
        "run_slot": datetime.now(timezone.utc).strftime("%H:%M UTC"),
        "jobs_fetched": len(raw_jobs),
        "jobs_matched": matched_count,
        "status": "success" if raw_jobs else "no_data",
    }).execute()
    print(f"Completed: {matched_count} matched jobs synced out of {len(raw_jobs)} fetched.")


if __name__ == "__main__":
    run()
