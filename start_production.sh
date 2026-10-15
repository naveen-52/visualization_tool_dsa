#!/usr/bin/env bash
set -e

echo "=============================================================================="
echo " Starting NEC AlgoViz Pro in High-Concurrency Production Mode"
echo "=============================================================================="

# Build frontend if dist doesn't exist
if [ ! -d "frontend/dist" ]; then
    echo "Building React frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

cd backend
export FLASK_ENV=production
export HOST=0.0.0.0
export PORT=${PORT:-5000}
export THREADS=32
export CONNECTION_LIMIT=250

if command -v gunicorn &> /dev/null; then
    echo "Starting Gunicorn with 4 workers and 8 threads per worker..."
    exec gunicorn -w 4 --threads 8 -b 0.0.0.0:${PORT} run:app
else
    echo "Starting Waitress with 32 worker threads..."
    exec python run.py
fi
