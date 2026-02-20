@echo off
echo ============================================
echo   ANTIKA RESTAURANT - Starting Project
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Start the backend server in a new window
echo [1/2] Starting Backend Server (Node.js on port 3000)...
start "Antika Backend" cmd /k "cd /d %~dp0backend-node && npm start"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 4 /nobreak > nul

echo.
echo ============================================
echo   Backend should be running now!
echo.
echo   NEXT STEPS:
echo   1. Open VS Code
echo   2. Install "Live Server" extension if not installed
echo   3. Right-click frontend\pages\index.html
echo   4. Select "Open with Live Server"
echo.
echo   Backend:  http://localhost:3000
echo   Frontend: http://127.0.0.1:5500
echo ============================================
pause
