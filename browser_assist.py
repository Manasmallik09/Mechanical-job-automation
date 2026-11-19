#!/usr/bin/env python3
"""Approval-first Playwright helper. It fills recognised fields but never submits."""
from __future__ import annotations
import argparse, json, re
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
PROFILE_PATH = ROOT / "application_profile.json"
BROWSER_DATA = ROOT / ".browser-profile"
FIELD_HINTS = {
    "full_name": ("full name", "your name", "candidate name"),
    "email": ("email", "e-mail"),
    "phone": ("phone", "mobile", "contact number", "telephone"),
    "location": ("city", "location", "current address"),
    "linkedin": ("linkedin",),
    "portfolio": ("portfolio", "personal website", "website"),
    "cover_letter": ("cover letter", "why are you interested", "message to hiring"),
    "experience": ("years of experience", "work experience", "experience in years"),
    "notice_period": ("notice period", "availability to join"),
    "expected_salary": ("expected salary", "expected ctc", "salary expectation"),
}
BLOCKED = re.compile(r"password|passcode|otp|one.?time|captcha|verification|security question", re.I)

def valid_http_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("Please provide a complete http:// or https:// application URL.")
    return value

def load_profile(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError("application_profile.json is missing. Copy application_profile.example.json and fill it in locally.")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Application profile must be a JSON object.")
    return data

def fill_application(page, profile: dict) -> list[str]:
    filled = []
    controls = page.locator("input:not([type=hidden]):not([type=password]), textarea")
    for key, hints in FIELD_HINTS.items():
        value = str(profile.get(key, "") or "").strip()
        if not value:
            continue
        for index in range(controls.count()):
            control = controls.nth(index)
            try:
                if not control.is_visible() or not control.is_enabled():
                    continue
                descriptor = " ".join(filter(None, [
                    control.get_attribute("aria-label"), control.get_attribute("placeholder"),
                    control.get_attribute("name"), control.get_attribute("id"),
                    control.get_attribute("autocomplete")
                ])).lower()
                if BLOCKED.search(descriptor) or not any(h in descriptor for h in hints):
                    continue
                control.fill(value, timeout=1200)
                filled.append(key)
                break
            except Exception:
                continue
    resume = str(profile.get("resume_path", "") or "").strip()
    if resume:
        path = Path(resume).expanduser()
        if not path.is_absolute():
            path = (ROOT / path).resolve()
        if path.is_file():
            uploads = page.locator('input[type="file"]')
            for index in range(uploads.count()):
                try:
                    uploads.nth(index).set_input_files(str(path), timeout=1500)
                    filled.append("resume_path")
                    break
                except Exception:
                    continue
    return filled

def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare supported job application fields for your review.")
    parser.add_argument("url", help="Official employer application URL")
    parser.add_argument("--profile", default=str(PROFILE_PATH))
    args = parser.parse_args()
    try:
        url = valid_http_url(args.url)
        profile = load_profile(Path(args.profile))
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        parser.error(str(exc))
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(user_data_dir=str(BROWSER_DATA), headless=False)
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(1200)
        filled = fill_application(page, profile)
        print("\nBrowser assistance is ready.")
        print("Fields filled: " + (", ".join(filled) if filled else "none recognised"))
        print("Review every field and check your CV. This tool will NOT submit the application.")
        print("Complete the final submission yourself in the browser.")
        input("Press Enter here after reviewing to close the browser...")
        context.close()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
