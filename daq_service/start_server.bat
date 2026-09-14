@echo off
title RTU Level Control - Server

REM ============================================================
REM Request Administrator privileges
REM ============================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

REM ============================================================
REM Project directory
REM ============================================================

cd /d "C:\Users\ENWS04 H\New folder\RTU_LEVEL_CONTROL\daq_service"

echo ============================================================
echo          RTU LEVEL CONTROL - SERVER STARTUP
echo ============================================================
echo.

REM ============================================================
REM 1. PostgreSQL
REM ============================================================

echo [1/5] Checking PostgreSQL...

sc query postgresql-x64-18 | find "RUNNING" >nul

if errorlevel 1 (
    echo PostgreSQL is not running. Starting PostgreSQL...
    net start postgresql-x64-18

    if errorlevel 1 (
        echo ERROR: Could not start PostgreSQL.
        pause
        exit /b 1
    )
) else (
    echo PostgreSQL is already running.
)

echo.
echo Waiting for PostgreSQL to become ready...

:WAIT_POSTGRES

"C:\Program Files\PostgreSQL\18\bin\pg_isready.exe" -h localhost -p 5432 >nul 2>&1

if errorlevel 1 (
    echo PostgreSQL is still starting...
    timeout /t 2 /nobreak >nul
    goto WAIT_POSTGRES
)

echo PostgreSQL is READY.
echo.

REM ============================================================
REM 2. Grafana
REM ============================================================

echo [2/5] Checking Grafana...

sc query grafana | find "RUNNING" >nul

if errorlevel 1 (
    echo Grafana is not running. Starting Grafana...
    net start grafana

    if errorlevel 1 (
        echo ERROR: Could not start Grafana.
        pause
        exit /b 1
    )

    echo Grafana started successfully.
) else (
    echo Grafana is already running.
)

echo.

REM ============================================================
REM 3. Python environment
REM ============================================================

echo [3/5] Checking Python environment...

if not exist "venv\Scripts\python.exe" (
    echo ERROR: Python virtual environment not found.
    echo.
    echo Expected:
    echo %CD%\venv\Scripts\python.exe
    pause
    exit /b 1
)

echo Python virtual environment found.
echo.

REM ============================================================
REM 4. Nucleo Modbus TCP
REM ============================================================

echo [4/5] Checking Nucleo Modbus TCP connection...
echo Nucleo: 192.168.2.100:502
echo.

"venv\Scripts\python.exe" -c "import socket; s=socket.socket(); s.settimeout(5); r=s.connect_ex(('192.168.2.100',502)); s.close(); exit(r)"

if errorlevel 1 (
    echo ERROR: Nucleo Modbus TCP is NOT reachable.
    echo.
    echo Check:
    echo   - Nucleo power
    echo   - Ethernet connection
    echo   - Nucleo IP: 192.168.2.100
    echo   - Modbus TCP port: 502
    echo.
    pause
    exit /b 1
)

echo Nucleo Modbus TCP is reachable.
echo.

REM ============================================================
REM 5. Open Grafana
REM ============================================================

echo [5/5] Opening RTU Tank Monitoring dashboard...

start "" "http://localhost:3000/d/ad5vprb/rtu-tank-monitoring?timezone=browser&refresh=5s"

echo Grafana dashboard opened.
echo.

REM ============================================================
REM Start collector
REM ============================================================

echo ============================================================
echo              DATA ACQUISITION STARTING
echo ============================================================
echo.
echo Device : rtu_level_control_01
echo Nucleo  : 192.168.2.100:502
echo Database: daq
echo.
echo Starting collector.py...
echo.
echo Press CTRL+C to stop data acquisition.
echo ============================================================
echo.

venv\Scripts\python.exe collector.py

REM ============================================================
REM Collector stopped
REM ============================================================

echo.
echo ============================================================
echo              COLLECTOR STOPPED
echo ============================================================
echo.
pause