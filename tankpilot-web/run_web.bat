@echo off
title TankPilot - Next.js Web App
cd /d "%~dp0"

echo ============================================================
echo         TankPilot Web Application (Next.js)
echo ============================================================
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    call npm.cmd install
)

echo Starting dev server on port 3001...
call npm.cmd run dev -- -p 3001
pause
