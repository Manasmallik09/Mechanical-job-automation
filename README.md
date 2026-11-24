# MechCareer — Mechanical Career Workspace

This repository now brings together two related projects while preserving the existing Python application:

1. **GitHub Pages career dashboard** — static browser-based opportunity tracker at the repository root.
2. **Mechanical design portfolio** — integrated under `/portfolio/`, based on the existing Mechanical-Design-poerfolio project.
3. **Python + SQLite desktop/local application** — the original local-first application remains available through `py -3 server.py`.

## GitHub Pages

The root `index.html` is the public career dashboard. The portfolio is available at `/portfolio/`.

To enable/verify Pages: GitHub repository → Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

The static dashboard stores job records and preferences in the current browser's localStorage. It supports adding/editing/deleting records, search/filter, status tracking, CSV export and JSON backup/import. **It does not sync records between devices and does not submit applications.** Do not store passwords, OTPs, sensitive identity data or private documents in it.

## Local Python + SQLite application

The existing local application is preserved:
- Windows: double-click `start.bat`, or run `py -3 server.py`.
- Open `http://127.0.0.1:8765`.
- Data is stored locally in `data/mechcareer.sqlite3`.
- Optional Playwright browser assistant: follow `start_browser_assist.bat` and the approval-first instructions below.

The Python app binds only to localhost. It is not a public cloud server.

## Browser-assisted application preparation

1. Copy `application_profile.example.json` to `application_profile.json` on your computer.
2. Fill it locally and keep it out of Git.
3. Run `start_browser_assist.bat`, open an official employer application URL, and review every field.
4. The helper deliberately does not click final submit buttons or handle passwords, OTPs, CAPTCHAs or security checks.

## Candidate targeting

- B.Tech Mechanical Engineering, 2026; VSSUT Burla; CGPA 8.02.
- Around five months' mechanical design experience.
- India-wide core mechanical opportunities; preferred salary ₹45,000/month, minimum target ₹35,000/month.
- Exclude aerospace, UAV, drone, defence, aircraft and aviation vacancies.
- Exclude LinkedIn listings and applications.

## Privacy and safety

- Never commit `data/`, `application_profile.json`, `.browser-profile/`, credentials, CVs or certificates.
- Existing `.gitignore` and local Python application remain in place.
- Verify vacancies on employer career pages; a saved record is not proof that a vacancy is live.
- Mark applications as submitted only after a positive employer confirmation or sent-message record.

## Project layout

- `index.html`, `dashboard.css`, `dashboard.js` — GitHub Pages dashboard.
- `portfolio/index.html` — integrated mechanical design portfolio.
- `server.py`, `tests/`, `browser_assist.py`, `start*.bat` — original local application.
