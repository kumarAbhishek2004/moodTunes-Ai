@echo off
echo ========================================
echo   MoodTunes AI - Frontend Start Script
echo ========================================
echo.

echo [1/2] Checking node_modules...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

echo.
echo [2/2] Starting MoodTunes AI Frontend...
echo.
echo ========================================
echo Frontend will run on: http://localhost:5173
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
