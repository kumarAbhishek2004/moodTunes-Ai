@echo off
echo.
echo ===============================================
echo   MoodTunes AI - Modular Backend
echo ===============================================
echo.

cd /d "%~dp0"

if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

echo Starting modular backend server...
echo Server: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.

python main.py

pause
