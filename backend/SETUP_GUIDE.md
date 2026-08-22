# Arogya Lens Backend — Step-by-Step Setup Guide

This guide walks you through setting up, running, testing, and seeding the **Arogya Lens** backend on any new machine (macOS, Linux, or Windows) from scratch.

---

## 📋 Prerequisites

- **Python 3.10+** (Python 3.10, 3.11, 3.12, 3.13, or 3.14)
- **Git** (optional, if cloning via repository)

Check your Python version:
```bash
python3 --version   # macOS / Linux
python --version    # Windows
```

---

## 🚀 Setup Instructions

### 1. Extract / Navigate to Backend Folder
Unzip the provided `Arogya_Lens_Backend.zip` or navigate to the `backend/` directory:

```bash
cd backend
```

---

### 2. Create Virtual Environment

#### macOS / Linux:
```bash
python3 -m venv venv
```

#### Windows (PowerShell / Command Prompt):
```powershell
python -m venv venv
```

---

### 3. Activate Virtual Environment

#### macOS / Linux:
```bash
source venv/bin/activate
```

#### Windows (PowerShell):
```powershell
.\venv\Scripts\Activate.ps1
```
*(If PowerShell blocks script execution, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

#### Windows (Command Prompt `cmd`):
```cmd
venv\Scripts\activate.bat
```

---

### 4. Install Dependencies
Install all required libraries into your virtual environment:

```bash
pip install -r requirements.txt
```

---

### 5. Configure Environment Variables
Copy the `.env.example` template into a local `.env` file:

#### macOS / Linux:
```bash
cp .env.example .env
```

#### Windows (PowerShell / CMD):
```powershell
copy .env.example .env
```

Default configuration in `.env`:
```ini
APP_NAME=Arogya Lens API
APP_VERSION=1.0.0
DATABASE_URL=sqlite:///./arogya_lens.db
SECRET_KEY=arogya_lens_secure_super_secret_jwt_key_2026_x9#k
ACCESS_TOKEN_EXPIRE_MINUTES=60
OTP_EXPIRE_MINUTES=5
UPLOAD_DIR=uploads
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

---

### 6. Start the FastAPI Application

#### Option A: Using Uvicorn CLI (with Auto-Reload)
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Option B: Using run.py
```bash
python run.py
```

The server will initialize SQLite database schema automatically on startup and start listening at:
`http://127.0.0.1:8000`

---

### 7. Explore Interactive API Documentation

Open your browser and navigate to:
- **Swagger Interactive UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc UI**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Endpoint**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 8. Seed Demo Data (Optional)
To pre-populate sample patients, past screenings across multiple months, and symptoms for frontend testing, run:

```bash
python -m app.database.seed
```

Demo Credentials Created:
- **Mobile Number**: `9876543210`
- **Development Mock OTP**: `123456`
- **Demo Patient**: Aarav Sharma (28, Male)
- **Historical Screenings**: 3 checkups (Hb: 11.4 $\rightarrow$ 11.9 $\rightarrow$ 12.6)

---

### 9. Run the Automated Test Suite

Execute all 31 unit, integration, and security tests:

```bash
pytest -v
```

Expected Output:
```
======================== 31 passed in 0.27s ========================
```

---

## 🛠️ Common Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `Address already in use: 8000` | Another process is using port 8000 | Kill process or run on port 8001: `uvicorn app.main:app --port 8001` |
| `ModuleNotFoundError: No module named 'app'` | Running command from outside the `backend/` directory | Ensure your terminal is in `backend/` before launching Python commands |
| `sqlite3.OperationalError` | Database locked or missing permissions | Delete local `arogya_lens.db` — the app will recreate clean tables automatically on startup |
