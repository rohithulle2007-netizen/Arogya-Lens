# Arogya Lens Backend (Parts 1, 2, and 3)

Arogya Lens is a smartphone-based non-invasive anaemia screening platform designed to assist in preliminary haemoglobin (Hb) assessment through ocular conjunctival imaging.

> **Important Medical Disclaimer**: Arogya Lens is a non-invasive screening aid and is not a replacement for clinical laboratory blood tests or professional medical diagnosis. User-reported symptoms are collected for supplementary informational context only and must never be used as a diagnosis.

---

## 🛠️ Tech Stack

- **Language**: Python 3.x
- **Framework**: FastAPI
- **ASGI Web Server**: Uvicorn
- **Database**: SQLite (`arogya_lens.db`)
- **ORM**: SQLAlchemy 2.x
- **Data Validation & Settings**: Pydantic 2.x & python-dotenv
- **Authentication**: PyJWT (HS256) + Mock OTP Flow
- **Testing**: Pytest & HTTPX

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py          # Package marker & app metadata
│   ├── main.py              # FastAPI app, CORS & router inclusion
│   │
│   ├── core/
│   │   ├── __init__.py      # Exports settings
│   │   ├── config.py        # Configuration loaded from .env
│   │   └── security.py      # JWT creation/verification & get_current_user dependency
│   │
│   ├── database/
│   │   ├── __init__.py      # Database package exports
│   │   ├── base.py          # SQLAlchemy 2.x DeclarativeBase
│   │   ├── connection.py    # Engine, SessionLocal, get_db() & init_db()
│   │   └── models.py        # ORM models (User, Profile, Screening, ScreeningSymptom)
│   │
│   ├── schemas/
│   │   ├── __init__.py      # Schema exports
│   │   ├── auth.py          # Auth & Token request/response schemas
│   │   ├── user.py          # User profile schemas
│   │   ├── symptom.py       # Symptom & Bilingual schemas
│   │   └── screening.py     # Screening, History & Summary schemas
│   │
│   ├── services/
│   │   ├── __init__.py      # Service exports
│   │   ├── auth_service.py  # User registration, OTP cache & verification
│   │   ├── user_service.py  # Profile retrieval and updating
│   │   ├── prediction_service.py # Mock Hb prediction service
│   │   ├── screening_service.py  # Image upload, validation & screening creation
│   │   └── history_service.py    # User history & analytical patient summary
│   │
│   ├── routes/
│   │   ├── __init__.py      # Router exports
│   │   ├── auth.py          # /api/auth endpoints
│   │   ├── users.py         # /api/users endpoints
│   │   ├── screenings.py    # /api/screenings endpoints
│   │   └── history.py       # /api/history endpoints
│   │
│   └── utils/
│       ├── __init__.py      # Utils exports
│       ├── datetime_utils.py # Standardized date/time helpers
│       └── validation.py    # Image upload & bilingual symptom validation
│
├── uploads/
│   └── .gitkeep             # User image storage root (uploads/{user_id}/)
│
├── tests/
│   ├── __init__.py          # Test package marker
│   ├── conftest.py          # Pytest fixtures and isolated in-memory DB setup
│   ├── test_auth.py         # Authentication & OTP tests
│   ├── test_health.py       # Health check & docs tests
│   ├── test_models.py       # Database schema & model relationship tests
│   ├── test_users.py        # Profile retrieval & update tests
│   ├── test_screenings.py   # Image upload, analysis & symptom tests
│   └── test_history.py      # History ordering & summary calculation tests
│
├── .env.example             # Example environment variables template
├── .env                     # Local environment configuration
├── .gitignore               # Ignored files (venv, DB, uploads, logs)
├── requirements.txt         # Minimum Python dependencies
├── README.md                # Project setup and documentation guide
└── run.py                   # Convenience runner for Uvicorn server
```

---

## 🗄️ Database Architecture

The application uses **SQLite** (`./arogya_lens.db`).

### Tables

1. **`users`**:
   - `id` (Integer, Primary Key)
   - `mobile_number` (String, Unique, Indexed)
   - `is_mobile_verified` (Boolean, Default: False)
   - `is_active` (Boolean, Default: True)
   - `created_at`, `updated_at` (DateTime)

2. **`profiles`**:
   - `id` (Integer, Primary Key)
   - `user_id` (Integer, Unique FK referencing `users.id` with CASCADE delete)
   - `name`, `age`, `sex` (`male`, `female`, `other`, `prefer_not_to_say`)
   - `created_at`, `updated_at` (DateTime)

3. **`screenings`**:
   - `id` (Integer, Primary Key)
   - `user_id` (Integer, FK referencing `users.id` with CASCADE delete)
   - `checkup_date` (Date), `checkup_time` (Time)
   - `estimated_hb` (Float, Nullable)
   - `confidence` (Float, Nullable)
   - `status` (`likely_normal`, `possible_anemia`, `high_risk`, `low_confidence`, `image_quality_failed`)
   - `image_path` (String, Nullable)
   - `image_quality` (`good`, `poor`, `failed`)
   - `created_at` (DateTime)

4. **`screening_symptoms`**:
   - `id` (Integer, Primary Key)
   - `screening_id` (Integer, FK referencing `screenings.id` with CASCADE delete)
   - `symptom_name` (`fatigue`, `dizziness`, `shortness_of_breath`, `rapid_or_irregular_heartbeat`, `headache`, `pale_skin`, `cold_hands_feet`, `brittle_nails`, `poor_appetite`, `none`, `other`)
   - `custom_symptom` (String, Nullable)
   - `created_at` (DateTime)

---

## 🚀 Getting Started

### 1. Create and Activate Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```

---

## ▶️ Running the Application

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Or:
```bash
python run.py
```

API documentation will be available at:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

---

## 📖 Complete API Reference

### Health & General
- `GET /` - Root endpoint
- `GET /api/health` - Health status

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user (`name`, `mobile_number`, `sex`, `age`)
- `POST /api/auth/send-otp` - Dispatch mock OTP (`123456`)
- `POST /api/auth/verify-otp` - Verify OTP and obtain JWT Bearer token
- `GET /api/auth/me` - (Protected) Get authenticated user identity

### User Profile (`/api/users`)
- `GET /api/users/me` - (Protected) Get user profile
- `PUT /api/users/me` - (Protected) Update profile fields (`name`, `age`, `sex`)
- `GET /api/users/me/summary` - (Protected) Get analytical Hb metrics and screening trajectory

### Screenings (`/api/screenings`)
- `POST /api/screenings/analyze` - (Protected) Upload eye image (multipart/form-data) & receive Hb assessment
- `GET /api/screenings/{screening_id}` - (Protected) Get screening detail
- `POST /api/screenings/{screening_id}/symptoms` - (Protected) Record user-reported symptoms
- `GET /api/screenings/{screening_id}/symptoms` - (Protected) Get symptoms with English + Hindi translations

### History (`/api/history`)
- `GET /api/history` - (Protected) Get screening history, sorted newest first
- `GET /api/history/{screening_id}` - (Protected) Get single historical screening record

---

## 🧪 Running Tests

```bash
pytest -v
```
