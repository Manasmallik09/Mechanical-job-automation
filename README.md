# MechCareer — Local Mechanical Job Workspace

A local-first mechanical engineering job tracker using **Python's standard library and SQLite**. No Supabase, Firebase, Vercel, cloud database, API keys, paid services, npm packages or internet connection are needed to run it after Python is installed.

## Features
- Dashboard with job, review, application and interview counts.
- Add, edit, search, filter and delete job records.
- Track Saved, Shortlisted, Preparing, Applied, Interview, Rejected and Closed stages.
- Store role, company, location, salary, source, official application URL, dates and notes.
- Save search preferences in SQLite.
- Export records to CSV and keep a local activity history.
- No fabricated vacancy listings or invented match scores.
- No automatic application submission; you open the employer page and submit personally.

## Run on Windows
1. Install Python 3.10 or newer from https://www.python.org/downloads/ and enable Add Python to PATH.
2. Download this repository as a ZIP and extract it, or clone it with Git.
3. Open the extracted project folder.
4. Double-click start.bat, or run this command in Command Prompt:

       py -3 server.py

5. Open http://127.0.0.1:8765 if it does not open automatically.
6. Press Ctrl+C in the terminal to stop the app.

## Database and privacy
- SQLite database: data/mechcareer.sqlite3
- The data folder is created automatically on first run.
- Server binds only to 127.0.0.1, not your Wi-Fi/network interface.
- App makes no external network requests; records stay on this computer.
- Back up the data folder regularly. Use Export jobs CSV for a portable copy.
- Never commit your database, CV, certificates or personal documents to this public repository.

## Default job-search preferences
- India-wide, full-time and Graduate Engineer Trainee opportunities.
- Core mechanical roles: design, manufacturing, production, quality, maintenance, FEA, CFD and R&D.
- ₹35,000/month salary target.
- Exclude aerospace, UAV, defence and aircraft roles.

Preferences can be edited in the dashboard. This offline version does not scrape job portals or verify live vacancies. Add vacancies only after checking the employer's official careers page. Opening an external job URL needs internet access.

## Architecture note
This is a local Python web application, not a static GitHub Pages site. GitHub Pages cannot run a Python server or host a writable SQLite database. GitHub stores the source code; the app and database run on your Windows computer. Do not configure a Pages deployment for this local-only version.

## Troubleshooting
- If py is not recognised, reinstall Python with Add Python to PATH enabled and reopen Command Prompt.
- If port 8765 is busy, set the MECHCAREER_PORT environment variable to 8766, then run py -3 server.py; open http://127.0.0.1:8766.
- If data seems missing, check data/mechcareer.sqlite3 beside server.py.
- To back up, stop the app and copy the entire data folder to a safe location.
