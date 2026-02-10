@echo off
REM Start Contextify Backend Server with Verbose Logging

echo ============================================================
echo Starting Contextify Backend Server
echo ============================================================
echo.

REM Set environment for unbuffered output
set PYTHONUNBUFFERED=1

REM Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found!
    echo Please create a .env file with your OPENAI_API_KEY
    echo.
    echo Example:
    echo OPENAI_API_KEY=your-key-here
    echo.
    pause
)

REM Start the server
echo Starting uvicorn server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

uvicorn src.api.server:app --reload --host 0.0.0.0 --port 8000

pause
