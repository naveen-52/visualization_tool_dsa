# ==============================================================================
# Multi-Stage Dockerfile for NEC AlgoViz Pro
# Optimized for 100+ Concurrent Users in Production
# ==============================================================================

# Stage 1: Build React Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend Server
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for Matplotlib & Pillow rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libfreetype6-dev \
    libpng-dev \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Source
COPY backend/ /app/backend/

# Copy Built Frontend dist into the expected path
COPY --from=frontend-builder /build/dist /app/frontend/dist/

# Set Environment Variables
ENV PORT=5000
ENV HOST=0.0.0.0
ENV THREADS=32
ENV CONNECTION_LIMIT=250
ENV CHANNEL_TIMEOUT=30
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

WORKDIR /app/backend
CMD ["python", "run.py"]
