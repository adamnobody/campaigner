@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "LOGFILE=%~dp0start.log"
echo [%date% %time%] Campaigner Launcher started > "%LOGFILE%"

echo ========================================
echo   Campaigner - Project Launcher
echo ========================================
echo.

echo [1/7] Checking Node.js...
echo [%date% %time%] [1/7] Checking Node.js >> "%LOGFILE%"
where node >nul 2>&1
if errorlevel 1 (
    echo        Node.js not found!
    echo        Install Node.js 22+ from https://nodejs.org
    echo [%date% %time%] FAIL: node not found >> "%LOGFILE%"
    pause
    exit /b 1
)
for /f "delims=" %%A in ('node -v') do set "NODE_VER=%%A"
set "NODE_VER=%NODE_VER:v=%"
for /f "tokens=1 delims=." %%A in ("%NODE_VER%") do set "NODE_MAJOR=%%A"
if %NODE_MAJOR% LSS 22 (
    echo        Node.js 22+ required. Found: %NODE_VER%
    echo [%date% %time%] FAIL: node too old %NODE_VER% >> "%LOGFILE%"
    pause
    exit /b 1
)
echo        v%NODE_VER% - OK
echo [%date% %time%] Node %NODE_VER% OK >> "%LOGFILE%"
echo.

echo [2/7] Checking npm...
echo [%date% %time%] [2/7] Checking npm >> "%LOGFILE%"
for /f %%A in ('npm -v') do set "NPM_VER=%%A"
echo        v%NPM_VER% - OK
echo [%date% %time%] npm %NPM_VER% OK >> "%LOGFILE%"
echo.

echo [3/7] Installing dependencies...
echo [%date% %time%] [3/7] npm install >> "%LOGFILE%"
call npm install >> "%LOGFILE%" 2>&1
if not exist "node_modules" (
    echo        FAILED! See start.log
    echo [%date% %time%] FAIL: no node_modules >> "%LOGFILE%"
    pause
    exit /b 1
)
echo        Done.
echo [%date% %time%] npm install OK >> "%LOGFILE%"
echo.

echo [4/7] Building shared module...
echo [%date% %time%] [4/7] build shared >> "%LOGFILE%"
call npm run build --workspace=shared >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo        FAILED! See start.log
    echo [%date% %time%] FAIL: build shared >> "%LOGFILE%"
    pause
    exit /b 1
)
echo        Done.
echo [%date% %time%] build shared OK >> "%LOGFILE%"
echo.

echo [5/7] Building backend...
echo [%date% %time%] [5/7] build backend >> "%LOGFILE%"
call npm run build --workspace=backend >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo        FAILED! See start.log
    echo [%date% %time%] FAIL: build backend >> "%LOGFILE%"
    pause
    exit /b 1
)
echo        Done.
echo [%date% %time%] build backend OK >> "%LOGFILE%"
echo.

echo [6/7] Starting servers...
echo [%date% %time%] [6/7] Starting servers >> "%LOGFILE%"
start "Campaigner Backend" cmd /k "cd /d ""%~dp0"" && npm run start --workspace=backend"
start "Campaigner Frontend" cmd /k "cd /d ""%~dp0"" && npm run dev --workspace=frontend"
echo        Backend  -^> port 3001
echo        Frontend -^> port 5173
echo [%date% %time%] Servers started >> "%LOGFILE%"
echo.

echo [7/7] Opening browser...
echo [%date% %time%] [7/7] Waiting 8s >> "%LOGFILE%"
timeout /t 8 /nobreak >nul
start "" "http://localhost:5173"
echo [%date% %time%] Browser opened >> "%LOGFILE%"
echo.

echo ========================================
echo   Project started!
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo   To stop: close the server windows.
echo   Log: start.log
echo ========================================
echo [%date% %time%] Launcher finished OK >> "%LOGFILE%"
timeout /t 10 /nobreak >nul
exit /b 0
