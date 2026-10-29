# Arogya Lens — AI Non-Invasive Anaemia Screening System

> **Point-of-care optical hemoglobin screening powered by smartphone photography of the conjunctiva and fingernail beds.**

[![CI](https://github.com/rohit/Arogya-Lens/actions/workflows/ci.yml/badge.svg)](https://github.com/rohit/Arogya-Lens/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/rohit/Arogya-Lens/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/rohit/Arogya-Lens/actions/workflows/deploy-frontend.yml)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57.svg)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Project Overview

**Arogya Lens** is an accessible, smartphone-friendly health screening tool that analyzes conjunctival and nail bed pallor to estimate Hemoglobin (Hb) levels. It empowers individuals and frontline healthcare workers (such as ASHA workers) to conduct rapid, non-invasive anaemia risk assessments without needles or complex laboratory infrastructure.

> **⚠️ Medical Screening Notice**:  
> Arogya Lens provides an **experimental non-invasive screening estimate** — it is **NOT a laboratory blood test (CBC)** and **NOT a definitive clinical diagnosis**. Patients with abnormal values or symptoms should consult a qualified physician.

---

## 🏛️ System Architecture & Technology Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.x, Pydantic 2.x, PyJWT, python-multipart
- **Database**: SQLite (`arogya_lens.db`)
- **AI & Computer Vision**: OpenCV, NumPy, scikit-learn (Calibrated SVR Ensemble), joblib, pandas
- **Web Frontend**: Vanilla HTML5, Modern CSS3, Modular ES6+ JavaScript, Vite bundler for GitHub Pages
- **Mobile Client**: React Native, Expo SDK 51, TypeScript
- **Deployment**: GitHub Pages (Web Frontend), Docker / Railway / Render / Fly.io (Backend API)

---

## 📂 Project Structure

```
Arogya-Lens/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Automated Backend (Pytest) & Frontend build validation
│       └── deploy-frontend.yml    # Continuous automated deployment to GitHub Pages
│
├── backend/
│   ├── app/
│   │   ├── core/               # Configuration & JWT security
│   │   ├── database/           # SQLite connection & SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response validation
│   │   ├── routes/             # REST API routes (auth, users, screenings, history, dashboard)
│   │   ├── services/           # Business logic & AI inference bridge
│   │   ├── utils/              # Path sanitizers, datetime & translation helpers
│   │   └── main.py             # FastAPI entry point & static frontend mounting
│   ├── tests/                  # Pytest integration & unit test suite (45 tests)
│   ├── uploads/                # Local storage for scan images
│   ├── requirements.txt        # Pinned Python package dependencies
│   ├── .env.example            # Environment configuration template
│   └── run.py                  # Uvicorn backend launcher
│
├── frontend/
│   ├── index.html              # Responsive single-page web app (English + Hindi)
│   ├── css/                    # Modular styling (variables, main, scanner, dashboard)
│   ├── js/                     # Modular controllers (Camera, Scanner, Results, Charts, Auth, API)
│   ├── vite.config.ts          # Vite build config with automatic asset distribution & .nojekyll
│   ├── package.json            # Node.js build configuration
│   └── README.md
│
├── ml/
│   ├── inference/              # Inference pipeline (Quality, Eye ROI, Features, SVR Model)
│   ├── models/                 # Trained model weights (hb_model.joblib) & metadata
│   ├── training/               # Offline dataset training & evaluation scripts
│   ├── dataset/                # Dataset manifest & clinical specifications
│   ├── tests/                  # ML pipeline verification test suite (11 tests)
│   └── README.md
│
├── mobile/                     # React Native / Expo cross-platform mobile application
│   ├── App.tsx                 # Expo entry point
│   ├── app.json                # Expo mobile configuration
│   ├── assets/                 # Icons and QR code assets
│   ├── src/                    # Screens, navigation, and mobile camera controllers
│   └── README.md
│
├── docs/                       # Architecture, API specifications, and team guides
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SETUP_GUIDE.md
│   └── TEAM_GUIDE.md
│
├── Dockerfile                  # Production container for Render, Railway, Fly.io, AWS
├── railway.json                # Railway turnkey deployment configuration
├── render.yaml                 # Render infrastructure-as-code blueprint
├── fly.toml                    # Fly.io app configuration
├── vercel.json                 # Vercel deployment configuration
├── run.py                      # Top-level unified server launcher (serves Web + API on :8000)
├── .gitignore                  # Production git ignore rules
└── README.md                   # This documentation
```

---

## 🚀 Quick Start (Local Development)

### 1. Setup Virtual Environment & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/<your-username>/Arogya-Lens.git
cd Arogya-Lens

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install backend and ML dependencies
pip install -r backend/requirements.txt
```

### 2. Configure Environment (Optional)
```bash
cp backend/.env.example backend/.env
```

### 3. Launch Unified Server (Web App + Backend API on Port 8000)
```bash
python run.py
```

### 4. Access Local Interfaces
- 🌐 **Web App**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- 📚 **Swagger API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- 🩺 **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 🌐 GitHub Pages Deployment (Web App)

The web frontend is fully configured for zero-configuration continuous deployment to GitHub Pages.

### How to Enable GitHub Pages:
1. Navigate to your repository on GitHub.
2. Go to **Settings** → **Pages** (in the left sidebar).
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. Push your changes to the `main` branch.
5. GitHub will automatically trigger `.github/workflows/deploy-frontend.yml` and publish your live app at:
   ```
   https://<your-username>.github.io/<repository-name>/
   ```

### Features on GitHub Pages:
- **Instant 1-Click Demo Mode**: Works immediately in the browser without requiring a backend server. Visitors can register, test the camera or file upload, and view live results and historical Hb trend charts.
- **Configurable Backend API (`🌐 API` button)**: Users can connect their GitHub Pages frontend to any deployed backend server (e.g. Railway, Render, Fly.io, or localhost) simply by entering the URL in the header.

---

## ☁️ Backend Cloud Deployment

Deploy the FastAPI backend container to your preferred cloud provider:

### Option A: Railway
1. Go to [Railway.app](https://railway.app/) and create a new project.
2. Select **Deploy from GitHub repo** and choose your Arogya Lens repository.
3. Railway automatically detects `Dockerfile` and `railway.json`.
4. Your API will be live with HTTPS (e.g., `https://your-app.up.railway.app`).

### Option B: Render
1. Go to [Render.com](https://render.com/) and create a **Web Service** or **Blueprint**.
2. Connect your GitHub repository; Render detects `render.yaml` or `Dockerfile`.
3. Set Environment to **Docker** and Health Check Path to `/api/health`.

### Option C: Fly.io
```bash
fly launch
fly deploy
```

---

## 📱 Mobile App (React Native & Expo)

To run the mobile app on iOS or Android:

```bash
cd mobile
npm install
npx expo start
```
Scan the displayed QR code with the **Expo Go** app on your phone.

---

## 🧪 Automated Testing & CI/CD

Run the test suites locally:

```bash
# Backend REST APIs and database tests (45 tests)
cd backend && pytest -v

# Machine Learning inference pipeline tests (11 tests)
cd ../ml && pytest -v
```

GitHub Actions automatically runs both test suites and validates the frontend build on every pull request and push to `main` via `.github/workflows/ci.yml`.

---

## 👥 Team Attribution & Ownership

- **Member 1 (Rohit)**: Backend architecture, REST APIs, SQLite models, JWT authentication, and testing.
- **Member 2 (Aitesham)**: AI/CV inference pipeline, SVR regression model, conjunctiva segmentation, and dataset.
- **Member 3 (Upasana)**: Core screening user journey, live camera integration, alignment frame, and quality checks.
- **Member 4 (Shrushti)**: Health screening dashboard, interactive SVG Hb trend chart, history, and profile management.
