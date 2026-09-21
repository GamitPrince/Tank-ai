@echo off
title RTU Level Control - System Launcher
cd /d "%~dp0"

echo ============================================================
echo      RTU LEVEL CONTROL - FULL SYSTEM LAUNCHER
echo ============================================================
echo.
echo 1. Hardware Check:
echo    - Make sure STM32 Nucleo board is powered and connected via Ethernet.
echo    - Default IP: 192.168.2.100 (Port: 502)
echo.
echo 2. Launching Services...
echo.

REM 1. Start DAQ Collector (Modbus TCP -> TimescaleDB Cloud)
echo [1/2] Starting DAQ Collector in a new window...
start "RTU DAQ Collector" /D "%~dp0daq_service" cmd /k "run_cloud_collector.bat"

REM 2. Start UBERBILT Vite Web App (TankPilot functions + UBERBILT UI)
echo [2/2] Starting UBERBILT Web App in a new window...
start "UBERBILT Web" /D "%~dp0uberbilt-web" cmd /k "run_web.bat"

echo.
echo Waiting 5 seconds for services to initialize...
timeout /t 5 /nobreak >nul

echo Opening browser at http://localhost:3001/live ...
start http://localhost:3001/live

echo.
echo ============================================================
echo All services launched!
echo - Telemetry Collector: Running in separate terminal window
echo - Web Dashboard:       Running on http://localhost:3001
echo ============================================================
echo.
pause
