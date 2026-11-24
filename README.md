# MechCareer — Mechanical Career Workspace

This repository now brings together two related projects while preserving the existing Python application:

1. **GitHub Pages career dashboard** — static browser-based opportunity tracker at the repository root.
2. **Mechanical design portfolio** — integrated under `/portfolio/`, based on the existing Mechanical-Design-poerfolio project.
3. **Python + SQLite desktop/local application** — the original local-first application remains available through `py -3 server.py`.

## GitHub Pages

The root `index.html` is the public career dashboard. The portfolio is available at `/portfolio/`.

To enable/verify Pages: GitHub repository → Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

The static dashboard stores a local copy in browser localStorage and can synchronise job records and salary preferences between devices using your own Supabase project. It supports adding/editing/deleting records, search/filter, status tracking, CSV export and JSON backup/import. Cloud sync requires the one-time setup below. The dashboard does not submit applications. Do not store passwords, OTPs, sensitive identity data or private documents in it.

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

## Private cloud sync (one-time setup)

1. Create a project at [Supabase](https://supabase.com/dashboard). Keep the database project private.
2. In the Supabase dashboard, open **SQL Editor → New query**. Paste and run the complete `supabase/schema.sql` file from this repository.
3. Open **Project Settings → API** (or API Keys). Copy the **Project URL** and the **public anon/publishable key**. Never use or share the service-role/secret key.
4. Open the deployed career dashboard, scroll to **Private Cloud Sync**, enter the URL and public key, and select **Save connection**.
5. Create an account with your email and a strong unique password. If email confirmation is enabled, confirm the email first, then sign in.
6. Sign in with the same account on your other devices. The dashboard will merge local and cloud records and upload the merged workspace. Use **Sync now** after switching devices if needed.

Security notes:
- Supabase Row Level Security policies restrict each user to rows where `user_id = auth.uid()`.
- The public anon/publishable key is designed to be used in a browser; the service-role key must never be placed in GitHub Pages or client-side code.
- The project URL/key are stored in that browser's local storage. The login password is handled by Supabase Auth and is not stored by this dashboard.
- Current merge behaviour: per-job latest `updated` timestamp wins; preferences use latest `updatedAt`. Deletions are local until synchronised; the current simple sync does not propagate deletion tombstones to other devices. For now, sync after editing and avoid deleting the same record concurrently on multiple devices.
- The browser dashboard cloud store and the existing local SQLite application are separate. This change does not expose the local SQLite database to the internet.
- Configure your Supabase Auth email confirmation and password recovery settings in the Supabase dashboard. You are responsible for protecting access to your Supabase account.
