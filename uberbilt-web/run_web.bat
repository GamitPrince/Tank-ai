@echo off
title UBERBILT Web App
cd /d "%~dp0"

echo ============================================================
echo              UBERBILT Web Application
echo ============================================================
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    call npm.cmd install
)

echo Starting dev server on port 3001...
call npm.cmd run dev
pause
