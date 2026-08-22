# Arogya Lens Backend — File & Architecture Guide

This guide provides a comprehensive breakdown of every file, module, and directory in the **Arogya Lens** backend architecture. Use this guide to navigate the codebase, understand component responsibilities, and coordinate development across team members.

---

## 📂 Project Directory Layout

```
backend/
├── app/
│   ├── __init__.py               # Application package marker & version metadata
│   ├── main.py                   # FastAPI app instance, CORS, lifespan, global error handlers
│   │
│   ├── core/
│   │   ├── __init__.py           # Exports settings and security components
│   │   ├── config.py             # Environment configuration (pydantic/dotenv settings)
│   │   └── security.py           # PyJWT token generation/decoding & get_current_user dependency
│   │
│   ├── database/
│   │   ├── __init__.py           # Database package exports
│   │   ├── base.py               # SQLAlchemy 2.x DeclarativeBase
│   │   ├── connection.py         # SQLite engine, SessionLocal, get_db() dependency, init_db()
│   │   ├── models.py             # ORM models (User, Profile, Screening, ScreeningSymptom)
│   │   └── seed.py               # Demo database seeding utility
│   │
│   ├── schemas/
│   │   ├── __init__.py           # Schema package exports
│   │   ├── auth.py               # Pydantic models for Register, OTP, Tokens, Identity
│   │   ├── user.py               # Pydantic models for UserProfile and Profile updates
│   │   ├── screening.py          # Pydantic models for Screenings, Details, History, and Summaries
│   │   ├── symptom.py            # Pydantic models for Symptom input, bilingual outputs
│   │   ├── dashboard.py          # Pydantic models for Dashboard statistics and Trend series
│   │   └── common.py             # Standard generic message and health check schemas
│   │
│   ├── routes/
│   │   ├── __init__.py           # Router package exports
│   │   ├── auth.py               # Endpoints for registration, OTP dispatch, verification, identity
│   │   ├── users.py              # Endpoints for profile management and user analytical summary
│   │   ├── screenings.py         # Endpoints for image analysis upload, detail lookup, symptoms
│   │   ├── history.py            # Endpoints for reverse-chronological screening history
│   │   └── dashboard.py          # Endpoints for aggregated metrics and graphical Hb trend
│   │
│   ├── services/
│   │   ├── __init__.py           # Service package exports
│   │   ├── auth_service.py       # User creation, mock OTP lifecycle, JWT generation
│   │   ├── user_service.py       # Profile fetching and partial updates
│   │   ├── screening_service.py  # Image validation, storage, screening persistence, symptoms
│   │   ├── history_service.py    # History queries and statistical Hb trajectory computation
│   │   ├── dashboard_service.py  # Risk count aggregations and chart timeseries data
│   │   └── prediction_service.py # ⚠️ STABLE MOCK Hb PREDICTION (AI/CV handover point)
│   │
│   └── utils/
│       ├── __init__.py           # Utility package exports
│       ├── datetime_utils.py     # Standard UTC/local date and time helpers
│       └── validation.py         # Image validation (MIME/size/path) and bilingual symptom dictionary
│
├── uploads/
│   └── .gitkeep                  # Root storage directory for user-uploaded eye photos (uploads/{user_id}/)
│
├── tests/
│   ├── __init__.py               # Test suite package marker
│   ├── conftest.py               # Pytest shared fixtures and isolated in-memory test database
│   ├── test_auth.py              # Unit & integration tests for registration and OTP authentication
│   ├── test_dashboard.py         # Tests for dashboard analytics, recent screening limits, and trend
│   ├── test_health.py            # Tests for /api/health and OpenAPI documentation endpoints
│   ├── test_history.py           # Tests for chronological ordering, details, and immutability
│   ├── test_models.py            # Tests for SQLAlchemy tables, columns, and foreign key cascades
│   ├── test_screenings.py        # Tests for image validation, upload, mock analysis, and symptoms
│   └── test_users.py             # Tests for profile retrieval and update rules
│
├── .env.example                  # Template of all configurable environment variables
├── .gitignore                    # Git ignore file excluding temporary data, caches, and local DBs
├── requirements.txt              # Pinned minimal Python dependencies
├── README.md                     # Beginner-friendly getting-started documentation
└── run.py                        # Convenience entrypoint to run the Uvicorn web server
```

---

## 👥 Team Work Division & Responsibilities

### 🔹 Backend Developer 1 (Architecture, Auth, APIs & Database)
- **Primary Files**:
  - `app/main.py`
  - `app/core/security.py`, `app/core/config.py`
  - `app/database/*` (`connection.py`, `models.py`, `seed.py`)
  - `app/routes/*` (`auth.py`, `users.py`, `screenings.py`, `history.py`, `dashboard.py`)
  - `app/services/*` (`auth_service.py`, `user_service.py`, `screening_service.py`, `history_service.py`, `dashboard_service.py`)
- **Key Responsibilities**:
  - Maintain API contract integrity and Pydantic validation schemas.
  - Oversee database schema migrations, relationships, and session lifecycles.
  - Implement security controls, JWT verification, and user data isolation.

### 🔹 Backend Developer 2 (AI & Computer Vision Specialist)
- **Primary File to Modify**:
  - `app/services/prediction_service.py`
- **Key Responsibilities**:
  - Replace the mock dictionary in `predict_hb(image_path: str)` with the actual deep learning inference pipeline:
    1. Load saved model weights (e.g. PyTorch `hb_model.pt` / ONNX / TorchScript).
    2. Read image from `image_path`.
    3. Perform image quality gating using OpenCV (Laplacian variance for blur, luminance histogram for underexposure).
    4. Segment conjunctiva / lower palpebral region of interest.
    5. Run regression prediction for Haemoglobin level (Hb in g/dL).
    6. Return the dictionary matching the existing contract:
       ```python
       {
           "estimated_hb": float,      # Predicted Hb in g/dL
           "confidence": float,        # Model confidence score (0.0 to 1.0)
           "status": str,              # likely_normal, possible_anemia, high_risk, low_confidence, image_quality_failed
           "image_quality": str        # good, poor, failed
       }
       ```
- **Crucial Rule**: Keep the function signature `predict_hb(image_path: str) -> dict` identical so existing API routes, schemas, and tests continue operating without changes.

### 🔹 Frontend Developer (HTML / CSS / JavaScript)
- **Integration Points**:
  - Base URL: `http://127.0.0.1:8000`
  - Camera capture: Use `navigator.mediaDevices.getUserMedia()` to capture eye image on browser.
  - Image submission: Transmit captured blob via `FormData` (`multipart/form-data`) to `POST /api/screenings/analyze`.
  - Authentication: Store JWT `access_token` in `localStorage` or `sessionStorage` and include `Authorization: Bearer <token>` in subsequent HTTP requests.
  - Charts: Render historical trend using data from `GET /api/dashboard/trend`.

---

## 🔒 Security & Data Isolation Guarantees

1. **User Identity from JWT**: Protected endpoints derive `user_id` strictly from the signed JWT subject claim. Frontend input cannot impersonate other user IDs.
2. **Cross-Tenant Prevention**: If User B attempts to access `/api/screenings/{screening_id}` or `/api/history/{screening_id}` belonging to User A, the server returns `403 Forbidden`.
3. **Immutable History**: Historical screening records are permanent; no DELETE endpoints exist.
4. **Clean Error Responses**: Generic 500 exception handler masks raw stack traces from client responses while logging details internally.
