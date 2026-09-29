@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: AI E-Tender Platform - One-Click Direct Open Launcher
:: Academic Final Project: B.Sc. IT (Hons)
:: ============================================================================

title AI E-Tender Platform
cd /d "%~dp0"

cls
echo ============================================================================
echo           AI E-TENDER PLATFORM - ONE-CLICK DIRECT LAUNCHER
echo ============================================================================
echo.

:: 1. Verify Node.js Environment
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js version 18 or higher from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Verify NPM Environment
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found in system PATH.
    echo Please verify your Node.js installation.
    echo.
    pause
    exit /b 1
)

:: Check for Dev Mode argument
if /i "%1"=="dev" goto run_dev
if /i "%1"=="--dev" goto run_dev

:: ============================================================================
:: STANDARD UNIFIED PRODUCTION MODE (Default)
:: ============================================================================

echo [1/4] Checking server dependencies...
if not exist "server\node_modules\" (
    echo       Dependencies missing. Installing server packages...
    pushd server
    call npm install
    popd
) else (
    echo       Server packages verified.
)

echo.
echo [2/4] Checking client dependencies and production build...
if not exist "client\node_modules\" (
    echo       Dependencies missing. Installing client packages...
    pushd client
    call npm install
    popd
) else (
    echo       Client packages verified.
)

if not exist "client\dist\" (
    echo       Compiling optimized React production bundle...
    pushd client
    call npm run build
    popd
) else (
    echo       Production bundle verified.
)

echo.
echo [3/4] Checking local database initialization...
if not exist "server\data\database.json" (
    echo       Database not found. Populating seed dataset with demo tenders and personas...
    pushd server
    call npm run seed
    popd
) else (
    echo       Database verified.
)

echo.
echo [4/4] Launching AI E-Tender Platform...
echo ============================================================================
echo   Unified Platform URL : http://localhost:5000
echo   Direct Browser Open  : Enabled (opening default browser...)
echo.
echo   Demo Personas with Unique User IDs (Password: Password@123):
echo     * Super Admin       : ADM001  (admin@etender.gov.in)
echo     * Tender Authority  : AUTH001 (authority@gudm.gov.in)
echo     * Company / Bidder  : BID001  (aarav@techinfra.com)
echo     * Public Viewer     : VIEW001 (viewer@etender.gov.in)
echo     * Evaluator         : EVAL001 (evaluator@etender.gov.in)
echo.
echo   Press Ctrl + C in this window at any time to shut down the server.
echo ============================================================================
echo.

:: Automatically free port 5000 if previously occupied by a stale process
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)

:: Instruct server to directly launch the web browser upon successful startup
set OPEN_BROWSER=true
set PORT=5000

cd server
node --watch-path=src src/server.js
goto finish

:: ============================================================================
:: DEVELOPMENT MODE (Vite Dev Server + Node Express API)
:: ============================================================================
:run_dev
echo [DEV MODE] Starting dual development servers (Vite + Node API)...

if not exist "server\node_modules\" (
    pushd server && call npm install && popd
)
if not exist "client\node_modules\" (
    pushd client && call npm install && popd
)
if not exist "server\data\database.json" (
    pushd server && call npm run seed && popd
)

echo Starting backend API server on http://localhost:5000...
start "AI E-Tender - Backend API" cmd /k "cd /d \"%~dp0server\" && npm start"

echo Starting Vite frontend client on http://localhost:3000...
set OPEN_BROWSER=true
start "AI E-Tender - Frontend Dev" cmd /k "cd /d \"%~dp0client\" && npm run dev"

:: Open browser to dev port
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

:finish
pause
