import os
import sys
import uvicorn

backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)
ml_dir = os.path.join(root_dir, "ml")

sys.path.insert(0, backend_dir)
sys.path.insert(0, ml_dir)

if __name__ == "__main__":
    print("🚀 Arogya Lens Backend Server")
    print("📍 Web App: http://127.0.0.1:8000/")
    print("📍 Interactive Docs: http://127.0.0.1:8000/docs")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        app_dir=backend_dir,
    )

