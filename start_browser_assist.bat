@echo off
setlocal
cd /d "%~dp0"
py -3 -m pip install -r requirements.txt
if errorlevel 1 goto failed
py -3 -m playwright install chromium
if errorlevel 1 goto failed
echo.
echo Browser helper installed. Paste the official application URL:
set /p JOB_URL=Application URL:
if "%JOB_URL%"=="" goto done
py -3 browser_assist.py "%JOB_URL%"
goto done
:failed
echo Setup failed. Check Python and internet connection.
pause
:done
endlocal
