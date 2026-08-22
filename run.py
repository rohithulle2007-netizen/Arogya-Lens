"""
Arogya Lens — Unified Server Launcher
Runs FastAPI backend on 0.0.0.0 to allow both Web App and Mobile (Expo) connectivity.
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
    print("📍 Local Web App: http://127.0.0.1:8000/")
    print("📍 Network Access: http://0.0.0.0:8000/ (LAN Ready)")
    print("📍 Interactive API Docs: http://127.0.0.1:8000/docs")
    print("📍 Service Health: http://127.0.0.1:8000/api/health")
    print("==================================================")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        app_dir=backend_dir
    )
