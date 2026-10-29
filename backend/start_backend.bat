@echo off
title MoodTunes AI - Backend Server
echo ========================================
echo   🎵 MoodTunes AI - Backend Server
echo ========================================
echo.

cd /d "%~dp0"

if exist ".venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call .venv\Scripts\activate.bat
    python main.py
) else (
    echo Virtual environment not found at .venv!
    echo Attempting to start with system python...
    python main.py
)

pause
