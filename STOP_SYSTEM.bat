@echo off
title RTU Level Control - System Stopper
cd /d "%~dp0"

echo ============================================================
echo      RTU LEVEL CONTROL - STOPPING ALL SERVICES
echo ============================================================
echo.

echo Stopping Python DAQ Collector...
taskkill /f /im python.exe /fi "WINDOWTITLE eq RTU DAQ Collector*" >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq *collector.py*" >nul 2>&1

echo Stopping Next.js Web Server...
taskkill /f /im node.exe /fi "WINDOWTITLE eq TankPilot Web*" >nul 2>&1

echo.
echo All services stopped.
pause
