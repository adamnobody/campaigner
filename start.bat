@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "LOGFILE=%~dp0start.log"
set "RETRY_COUNT=0"
echo [%date% %time%] Campaigner Launcher started > "%LOGFILE%"

echo ========================================
echo   Campaigner - Project Launcher
echo ========================================
echo.

echo [0] Checking package.json...
echo [%date% %time%] [0] Checking package.json >> "%LOGFILE%"
if not exist "package.json" (
    echo        package.json not found!
    echo        Run this script from project root, not from incomplete archive.
    echo [%date% %time%] FAIL: package.json not found >> "%LOGFILE%"
    pause
    exit /b 1
)
echo        OK
echo [%date% %time%] package.json OK >> "%LOGFILE%"
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

echo [3/7] Checking node_modules integrity...
echo [%date% %time%] [3/7] Checking node_modules integrity >> "%LOGFILE%"
if not exist "node_modules" goto :integrity_done
echo        Checking existing node_modules...

rem Check 1: .package-lock.json
if not exist "node_modules\.package-lock.json" goto :integrity_broken

rem Check 2: native module
if exist "node_modules\better-sqlite3\build\Release\better_sqlite3.node" goto :integrity_ok
if exist "node_modules\better-sqlite3\prebuilds" goto :integrity_ok
rem Fallback: any .node file
dir /s /b "node_modules\better-sqlite3\*.node" >nul 2>&1
if not errorlevel 1 goto :integrity_ok
goto :integrity_broken

:integrity_ok
echo        Existing node_modules integrity OK.
echo [%date% %time%] node_modules integrity OK >> "%LOGFILE%"
goto :integrity_done

:integrity_broken
echo [%date% %time%] WARN: node_modules integrity broken >> "%LOGFILE%"
call :cleanup_and_retry

:integrity_done
echo.

call :install_deps
if errorlevel 1 (
    pause
    exit /b 1
)

call :smoke_test
if errorlevel 1 (
    if "%RETRY_COUNT%"=="0" (
        set "RETRY_COUNT=1"
        echo Native modules broken, reinstalling...
        echo [%date% %time%] WARN: smoke test failed, retrying reinstall >> "%LOGFILE%"
        call :cleanup_and_retry
        call :install_deps
        if errorlevel 1 (
            pause
            exit /b 1
        )
        call :smoke_test
        if errorlevel 1 (
            echo.
            echo ERROR: Backend cannot start.
            echo Native modules are incompatible.
            echo Please check start.log and report the issue.
            echo.
            echo [%date% %time%] FAIL: smoke test failed after retry >> "%LOGFILE%"
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo ERROR: Backend cannot start.
        echo Native modules are incompatible.
        echo Please check start.log and report the issue.
        echo.
        echo [%date% %time%] FAIL: smoke test failed, retry limit reached >> "%LOGFILE%"
        pause
        exit /b 1
    )
)

echo [Port Check] Checking ports (warning only)...
echo [%date% %time%] [Port Check] Checking ports >> "%LOGFILE%"
netstat -ano | findstr :3001 >nul
if not errorlevel 1 (
    echo WARNING: Port 3001 is already in use!
    echo Backend may fail to start.
    echo [%date% %time%] WARN: Port 3001 already in use >> "%LOGFILE%"
)

netstat -ano | findstr :5173 >nul
if not errorlevel 1 (
    echo WARNING: Port 5173 is already in use!
    echo Frontend may fail to start.
    echo [%date% %time%] WARN: Port 5173 already in use >> "%LOGFILE%"
)
echo.

echo [6/7] Starting servers...
echo [%date% %time%] [6/7] Starting servers >> "%LOGFILE%"
start "Campaigner" cmd /k "cd /d ""%~dp0"" && call npm run start:all"
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

:install_deps
echo [3/7] Installing dependencies...
echo [%date% %time%] [3/7] npm install >> "%LOGFILE%"
call npm install >> "%LOGFILE%" 2>&1
if not exist "node_modules" (
    echo        FAILED! See start.log
    echo [%date% %time%] FAIL: no node_modules after npm install >> "%LOGFILE%"
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
    exit /b 1
)
echo        Done.
echo [%date% %time%] build backend OK >> "%LOGFILE%"
echo.
exit /b 0

:smoke_test
echo [5/7] Smoke testing backend native modules...
echo [%date% %time%] [5/7] smoke test backend >> "%LOGFILE%"
call node -e "import('./backend/dist/db/connection.js').then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)})" 1>> "%LOGFILE%" 2>> "%LOGFILE%"
if errorlevel 1 (
    echo [%date% %time%] FAIL: smoke test backend native modules >> "%LOGFILE%"
    exit /b 1
)
echo        Smoke test passed.
echo [%date% %time%] smoke test OK >> "%LOGFILE%"
echo.
exit /b 0

:cleanup_and_retry
echo.
echo ========================================
echo   Detected broken node_modules!
echo   Cleaning and reinstalling...
echo   This may take 1-2 minutes.
echo ========================================
echo.
echo [%date% %time%] Cleanup started: removing node_modules and package-lock.json >> "%LOGFILE%"
if exist "node_modules" rmdir /s /q "node_modules" >> "%LOGFILE%" 2>&1
if exist "package-lock.json" del /q "package-lock.json" >> "%LOGFILE%" 2>&1
echo [%date% %time%] Cleanup finished >> "%LOGFILE%"
exit /b 0
