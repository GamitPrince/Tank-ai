@echo off
title Nucleo DAQ Collector -> TimescaleDB Cloud
cd /d "%~dp0"

echo ============================================================
echo   Nucleo-F7 DAQ Collector (Modbus TCP -> TimescaleDB Cloud)
echo ============================================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo Error: Python virtual environment not found in daq_service\venv.
    pause
    exit /b 1
)

echo Starting Serial USB Ingest Server (COM6)...
venv\Scripts\python.exe serial_ingest.py
pause
