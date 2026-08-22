# Arogya Lens — Developer Setup & Running Guide

This guide provides instructions to set up, configure, run, and test the Arogya Lens project on macOS, Linux, or Windows.

---

## 1. Prerequisites

- **Python**: Python 3.10, 3.11, 3.12, 3.13, or 3.14
- **Node.js**: Node.js v18+ (v20+ recommended)
- **Package Managers**: `pip` and `npm`
- **Browser**: Google Chrome, Mozilla Firefox, or Safari with Web Camera access support

---

## 2. Repository Setup

```bash
# Clone repository
git clone https://github.com/username/Arogya-Lens.git
cd Arogya-Lens
```

---

## 3. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create local environment configuration
cp .env.example .env

# Seed initial development demo data (optional)
python3 -m app.database.seed

# Start FastAPI backend server
python3 run.py
```

The backend server starts on: **`http://127.0.0.1:8000`**
- Interactive API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`

---

## 4. Frontend Setup

In a separate terminal window:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend application starts on: **`http://localhost:5173`**

### Production Frontend Build:
```bash
# Type-check and generate production static assets
npm run build
```

---

## 5. Machine Learning & Training Setup

```bash
# Navigate to ML folder
cd ml

# Step 1: Prepare dataset manifest from ground truth Excel file
python3 training/prepare_dataset.py

# Step 2: Extract color and statistical features from participant masks
python3 training/extract_features.py

# Step 3: Run GroupKFold cross-validation suite
python3 training/cross_validate.py

# Step 4: Train and export the production SVR model artifact
python3 training/train_model.py
```

The trained model pipeline artifact is saved to:
`ml/models/hb_model.joblib` and `ml/models/hb_model_metadata.json`.

---

## 6. Running Automated Tests

```bash
# Run all backend unit & integration tests (39 tests)
python3 -m pytest backend/tests

# Run machine learning pipeline tests (11 tests)
PYTHONPATH=backend python3 -m pytest ml/tests
```

---

## 7. Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_NAME` | `Arogya Lens` | Application display title |
| `HOST` | `127.0.0.1` | Backend host binding |
| `PORT` | `8000` | Backend port |
| `JWT_SECRET_KEY` | `dev_secret_key...` | Cryptographic secret for signing JWT tokens |
| `DATABASE_URL` | `sqlite:///./arogya_lens.db` | SQLAlchemy database URI |
| `UPLOAD_DIR` | `uploads` | Directory for uploaded eye images |
| `AI_MOCK_MODE` | `false` | When true, skips ML inference and returns mock data |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Frontend backend target URL |
| `VITE_USE_MOCK` | `false` | When true, frontend runs completely offline |
