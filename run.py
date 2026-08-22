"""
Arogya Lens — Unified Server Launcher
Runs FastAPI backend and serves the integrated Vanilla JavaScript frontend.
"""
import os
import sys
import uvicorn

base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, "backend")
ml_dir = os.path.join(base_dir, "ml")

sys.path.insert(0, backend_dir)
sys.path.insert(0, ml_dir)

if __name__ == "__main__":
    print("==================================================")
    print("🚀 Arogya Lens Unified Server Starting")
    print("📍 Web Application: http://127.0.0.1:8000/")
    print("📍 Interactive API Docs: http://127.0.0.1:8000/docs")
    print("📍 Service Health: http://127.0.0.1:8000/api/health")
    print("==================================================")
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        app_dir=backend_dir
    )
