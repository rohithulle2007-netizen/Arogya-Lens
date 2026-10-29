# ==============================================================================
# Arogya Lens — Production Backend Container
# Multi-stage optimized Dockerfile for FastAPI + OpenCV + SVR Model Deployment
# Supported platforms: Render, Railway, Fly.io, AWS App Runner, Hugging Face
# ==============================================================================

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8000

WORKDIR /app

# Install system dependencies required for OpenCV and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend, ML pipeline models, frontend assets, and runner code
COPY backend /app/backend
COPY ml /app/ml
COPY frontend /app/frontend
COPY run.py /app/run.py

# Create persistent uploads directory
RUN mkdir -p /app/uploads /app/backend/uploads

# Expose server port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start the unified FastAPI application supporting dynamic cloud $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --app-dir /app/backend"]
