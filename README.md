# MechCareer — Local Mechanical Job Workspace

A local-first mechanical engineering job tracker using Python and SQLite, with an optional Playwright browser assistant for preparing employer application forms.

## Current capabilities
- Dashboard with job, review, application and interview counts.
- Add, edit, search, filter and delete job records.
- Track Saved, Shortlisted, Preparing, Applied, Interview, Rejected and Closed stages.
- Store role, company, location, salary, source, official application URL, dates and notes.
- Save search preferences in SQLite and export records to CSV.
- Optional Playwright helper opens an employer application page and fills recognised profile fields for review.
- The browser helper never clicks Submit, Apply, Save or any final-action button. You review and submit manually.

## Run the tracker on Windows
1. Install Python 3.10 or newer from https://www.python.org/downloads/ and enable Add Python to PATH.
2. Download this repository as a ZIP and extract it, or clone it with Git.
3. Open the project folder and double-click start.bat, or run py -3 server.py.
4. Open http://127.0.0.1:8765.
5. Press Ctrl+C in the terminal to stop the app.

## Prepare an application with browser assistance
1. Double-click start_browser_assist.bat once to install Playwright and Chromium.
2. Copy application_profile.example.json to application_profile.json.
3. Fill in your details in application_profile.json on your computer. Do not upload this file to GitHub.
4. Set resume_path to your local CV path, for example C:/Users/YourName/Documents/Resume.pdf.
5. Run start_browser_assist.bat again and paste the official employer application URL.
6. Sign in yourself if required. The browser profile stays in .browser-profile on your computer.
7. Review every filled field and the attached CV. Correct anything inaccurate.
8. Submit the application yourself on the employer website.

The helper only recognises common text fields; employer websites differ, so some fields may remain blank. It deliberately does not handle passwords, OTPs, CAPTCHAs, security questions or final submission. Never share login credentials or OTPs with this tool.

## Privacy
- SQLite database: data/mechcareer.sqlite3
- Server binds only to 127.0.0.1.
- Browser profile and personal application profile are excluded from Git.
- Never commit your database, CV, certificates or personal documents to this public repository.
- Back up the data folder regularly.

## Job-search targeting
- India-wide, full-time and Graduate Engineer Trainee opportunities.
- Core mechanical roles: design, manufacturing, production, quality, maintenance, FEA, CFD and R&D.
- ₹35,000/month salary target.
- Exclude aerospace, UAV, defence and aircraft roles.

Live vacancy discovery must use current job-board or employer-career sources. Do not treat a saved record or unverified listing as an active vacancy.

## Architecture note
This is a local Python web application, not a static GitHub Pages site. GitHub Pages cannot run a Python server or host a writable SQLite database. GitHub stores the source code; the app and database run on your Windows computer.

## Troubleshooting
- If py is not recognised, reinstall Python with Add Python to PATH enabled and reopen Command Prompt.
- If port 8765 is busy, set MECHCAREER_PORT to 8766 and run py -3 server.py.
- If browser setup fails, run py -3 -m pip install -r requirements.txt and py -3 -m playwright install chromium manually.
