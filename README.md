# Arogya Lens — AI Non-Invasive Anaemia Screening System

> **Point-of-care optical hemoglobin screening powered by smartphone photography of the conjunctiva.**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57.svg)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Project Overview

**Arogya Lens** is an accessible, smartphone-friendly health screening tool that analyzes conjunctival erythema to estimate Hemoglobin (Hb) levels. It empowers individuals and frontline health workers to conduct rapid, non-invasive anaemia risk assessments without needles or laboratory infrastructure.

> **Medical Screening Notice**:  
> Arogya Lens provides an **experimental screening estimate** — it is **NOT a laboratory blood test (CBC)** and **NOT a definitive medical diagnosis**. Patients with abnormal values or symptoms should consult a qualified physician.

---

## 🏛️ System Architecture & Technology Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.x, Pydantic 2.x, PyJWT, python-multipart
- **Database**: SQLite (`arogya_lens.db`)
- **AI & Computer Vision**: OpenCV, NumPy, scikit-learn, joblib, pandas
- **Frontend**: Pure HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+)
- **Camera Integration**: Browser-native `navigator.mediaDevices.getUserMedia()`

---

## 📂 Project Structure

```
Arogya-Lens/
├── backend/
│   ├── app/
│   │   ├── core/               # App configuration & JWT security
│   │   ├── database/           # SQLite connection & SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── routes/             # REST API route controllers
│   │   ├── services/           # Business logic & AI prediction bridge
│   │   ├── utils/              # Path sanitizers, datetime & translation helpers
│   │   └── main.py             # FastAPI entry point & static frontend mounting
│   ├── tests/                  # Pytest integration & unit test suite
│   ├── uploads/                # Local directory for user eye scan uploads
│   ├── requirements.txt        # Pinned Python package dependencies
│   ├── .env.example            # Environment configuration template
│   └── run.py                  # Uvicorn backend launcher
│
├── frontend/
│   ├── index.html              # Responsive single-page web app
│   ├── css/                    # Organic medical styling & animations
│   ├── js/                     # Modular controllers (Camera, Scanner, Results, Charts, Auth)
│   └── README.md
│
├── ml/
│   ├── inference/              # Inference pipeline (Quality, Eye ROI, Features, SVR Model)
│   ├── models/                 # Trained model weights (hb_model.joblib) & metadata
│   ├── training/               # Offline dataset training & evaluation scripts
│   ├── dataset/                # Dataset manifest & clinical specifications
│   └── README.md
│
├── docs/
│   ├── MERGE_NOTES.md          # Full record of file merges & team contributions
│   ├── ARCHITECTURE.md         # Detailed system design & sequence diagrams
│   ├── API_REFERENCE.md        # Comprehensive REST API specifications
│   ├── SETUP_GUIDE.md          # Step-by-step local setup & execution
│   └── TEAM_GUIDE.md           # Maintenance guidelines for all 4 subsystems
│
├── run.py                      # Top-level unified server launcher
├── .gitignore                  # Production git ignore rules
└── README.md                   # This documentation
```

---

## 🚀 Quick Start Guide

### 1. Setup Virtual Environment & Install Dependencies
```bash
cd Arogya-Lens

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install requirements
pip install -r backend/requirements.txt
```

### 2. Configure Environment (Optional)
```bash
cp backend/.env.example backend/.env
```

### 3. Launch Unified Server (Frontend + Backend on Port 8000)
```bash
python run.py
```

### 4. Access Interfaces
- 🌐 **Web App**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- 📚 **Swagger API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- 🩺 **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 🧪 Running Tests

```bash
pytest backend/tests/ -v
```

---

## 👥 Team Attribution & Ownership

- **Member 1 (Rohit)**: Backend architecture, REST APIs, SQLite models, JWT authentication, and testing.
- **Member 2 (Aitesham)**: AI/CV inference pipeline, SVR regression model, conjunctiva segmentation, and dataset.
- **Member 3 (Upasana)**: Core screening user journey, live camera integration, alignment frame, and quality checks.
- **Member 4 (Shrushti)**: Health screening dashboard, interactive SVG Hb trend chart, history, and profile management.
