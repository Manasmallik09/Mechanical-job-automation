# MechCareer — Mechanical Job Application Dashboard

A mobile-friendly private-workspace starter for organising a mechanical engineering job search.

## Current state

This repository contains a Next.js dashboard configured for static export and GitHub Pages. It is **not yet a live job-search or application automation service**.

- The included job rows are illustrative sample records, not verified vacancies.
- Adding a job currently stores it in browser memory only; it is not persisted.
- Authentication, database connection, private file storage, live job discovery and scheduled reports are not enabled yet.
- No job application is submitted automatically. User approval must remain mandatory.
- Do not upload a resume, certificates, photograph, or other personal documents until authentication and private storage policies have been configured and tested.

## Requirements

- Node.js 20.9 or newer
- npm
- A GitHub repository
- Optional later: Supabase project and Vercel account

## GitHub Pages deployment

The project is configured to export static files to `out/` with the project-site base path `/Mechanical-job-automation`. The workflow at `.github/workflows/deploy.yml` builds and deploys the site whenever `main` is updated.

In **Settings → Pages**, set **Source** to **GitHub Actions**. Then check the Actions tab for the first successful deployment. The published URL is `https://manasmallik09.github.io/Mechanical-job-automation/`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Upload to GitHub

1. Open your repository: `https://github.com/Manasmallik09/Mechanical-job-automation`
2. Select **Add file → Upload files**.
3. Extract the downloaded ZIP on your computer.
4. Upload the contents of the `mechanical-job-dashboard` folder (not the enclosing folder) to the repository root.
5. Commit to the `main` branch with message `Add MechCareer dashboard starter`.

If GitHub's browser upload is easier, use your Windows PC. Never upload `.env.local`, passwords, API keys, resumes or private documents to this public repository.

## Supabase setup — later phase

1. Create a Supabase project.
2. Copy the project URL and anon/public key into a local `.env.local` file using `.env.example` as a template.
3. In Supabase SQL Editor, review and run `supabase/schema.sql`.
4. Configure email/password authentication.
5. Create a private Storage bucket named `private-documents`, then add and test owner-only policies before uploading files.
6. Add server-side authentication and protected routes before deploying a private production dashboard.

The SQL schema uses row-level security for user-owned records. It does not by itself implement login, route protection, or secure document upload.

## Job-search rules to preserve

- India-wide, full-time and Graduate Engineer Trainee roles.
- Core mechanical engineering roles; exclude aerospace, UAV, defence and aircraft roles.
- ₹35,000/month is the target minimum. If salary is undisclosed, label it undisclosed rather than assuming it meets the target.
- Prioritise 90%+ profile matches and opportunities posted within the last 30 days.
- Prepare up to 20 applications per day for user review.
- Pause when required profile information is missing. Never invent qualifications or work history.
- Never bypass CAPTCHA, access controls, or website terms. Use official or permitted sources.
- Bulk approval is approval to prepare/review, not permission for silent submission.

## Planned phases

1. Secure authentication and private dashboard access.
2. Verified profile and private document storage.
3. Compliant job discovery and source verification.
4. Application preparation queue with explicit user approval.
5. Scheduled reports at 08:00 and 19:00 IST after a scheduler is configured.
6. Backups and operational checks within the selected free-tier limits.

Free tiers and product limits can change. Confirm current provider limits before relying on a service for production.
