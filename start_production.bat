@echo off
echo ==============================================================================
echo  Starting NEC AlgoViz Pro in High-Concurrency Production Mode (Waitress WSGI)
echo ==============================================================================
echo.

:: Build frontend if dist does not exist
if not exist "frontend\dist" (
    echo Building React Frontend bundle...
    cd frontend
    call npm install
    call npm run build
    cd ..
)

echo Starting backend on http://0.0.0.0:5000 with 32 worker threads...
cd backend
set FLASK_ENV=production
set HOST=0.0.0.0
set PORT=5000
set THREADS=32
set CONNECTION_LIMIT=250
python run.py
pause
