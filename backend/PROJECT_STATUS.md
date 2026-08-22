# Arogya Lens — Project Status & Architecture Report

---

## 🔬 Project Overview

**Arogya Lens** is a smartphone-based non-invasive anaemia screening platform designed to assess estimated Haemoglobin (Hb) levels from ocular conjunctiva photography.

---

## 🏗️ System Architecture & Stack

```
+-----------------------------------------------------------------------------------+
|                            FRONTEND LAYER (Browser)                                |
|  - HTML5, Modern CSS, Vanilla JavaScript                                          |
|  - Camera Access via navigator.mediaDevices.getUserMedia()                        |
|  - Canvas frame snapshot & FormData multipart upload                              |
+-----------------------------------------------------------------------------------+
                                         │  HTTP / JSON / Multipart
                                         ▼
+-----------------------------------------------------------------------------------+
|                            BACKEND API (FastAPI)                                  |
|  - FastAPI (REST API with OpenAPI /docs & /redoc)                                 |
|  - PyJWT Bearer Authentication & User Isolation                                   |
|  - Python-dotenv configuration & Pydantic 2.x validation                           |
|  - Standardized error handlers (400, 401, 403, 404, 413, 415, 422, 500)          |
+-----------------------------------------------------------------------------------+
                    │                                            │
                    ▼                                            ▼
+---------------------------------------+    +--------------------------------------+
|          DATABASE LAYER               |    |         AI & CV PIPELINE             |
|  - SQLite (arogya_lens.db)            |    |  - prediction_service.py             |
|  - SQLAlchemy 2.x ORM                 |    |  - [Current]: Stable Mock Service    |
|  - 4 Tables: users, profiles,         |    |  - [Target]: OpenCV + PyTorch / ONNX |
|    screenings, screening_symptoms     |    |    conjunctiva Hb regression         |
+---------------------------------------+    +--------------------------------------+
```

---

## ✅ Completed Features Across All 4 Parts

### 1. Foundation & Database Layer (Part 1)
- Clean, modular backend architecture (`core`, `database`, `schemas`, `routes`, `services`, `utils`).
- SQLite database connection with SQLAlchemy 2.x Declarative Base and thread-safe session generator.
- 4 Relational Tables:
  1. `users`: Mobile authentication state, active flag, timestamps.
  2. `profiles`: Demographics (`name`, `age`, `sex` enum: `male`, `female`, `other`, `prefer_not_to_say`).
  3. `screenings`: Hb estimation records, confidence scores, diagnostic statuses, quality verdicts, image storage paths.
  4. `screening_symptoms`: 11 user-reported symptoms linked to screenings.
- Automated database schema initialization on startup.
- Database seeding script (`python -m app.database.seed`).

### 2. Authentication & User Profile (Part 2)
- User registration (`POST /api/auth/register`) with duplicate mobile prevention.
- Mock OTP service (`POST /api/auth/send-otp`) with in-memory caching and dev mock `123456`.
- OTP verification (`POST /api/auth/verify-otp`) issuing HS256-signed JWT tokens.
- Secure `get_current_user` FastAPI dependency extracting identity from token claims.
- Profile retrieval (`GET /api/users/me`) and modification (`PUT /api/users/me`).

### 3. Screenings, Symptoms & History (Part 3)
- Multipart image upload endpoint (`POST /api/screenings/analyze`) with MIME and 10MB size validation.
- User-isolated image storage under `uploads/{authenticated_user_id}/`.
- Stable mock prediction service returning Hb estimation and image quality verdicts.
- User-reported symptoms (`POST /api/screenings/{id}/symptoms`) enforcing exclusivity of `"none"`.
- Centralized bilingual symptom dictionary providing English and Hindi labels.
- Reverse-chronological screening history (`GET /api/history`).
- Analytical patient summary (`GET /api/users/me/summary`) calculating average, minimum, maximum Hb, and changes.
- Strict data immutability: No DELETE screening endpoints exist.

### 4. Dashboard, Trends & Error Handling (Part 4)
- Dashboard overview endpoint (`GET /api/dashboard`) aggregating risk counts and the 5 most recent screenings.
- Chronological trend endpoint (`GET /api/dashboard/trend`) formatted for frontend line graphs.
- Cross-tenant data isolation (`403 Forbidden` on unauthorized access attempts).
- Global 500 error handler hiding stack traces from client responses.
- Configurable CORS middleware.
- 100% test coverage with 31 passing unit, integration, and security tests.

---

## 🤖 Upcoming AI / Computer Vision Integration Guide

The backend is fully pre-wired for seamless integration with the real deep learning model.

### Handover Point: `app/services/prediction_service.py`

The CV/AI specialist only needs to replace the mock dictionary inside:
```python
def predict_hb(image_path: str) -> Dict[str, Any]:
```

### Steps for the AI Developer:
1. **Model Loading**: Load the trained PyTorch (`.pt`), ONNX, or TorchScript model during application startup.
2. **Quality Gate**: Use OpenCV to inspect image sharpness (Laplacian variance > threshold) and illumination.
3. **Region of Interest (ROI)**: Segment the palpebral and forniceal conjunctiva from the eye image.
4. **Inference**: Pass the preprocessed conjunctiva crop through the regression model to predict Haemoglobin (g/dL).
5. **Confidence & Status**: Calculate model confidence and map predicted Hb to diagnostic severity:
   - Normal: $\ge 12.0$ g/dL (Women), $\ge 13.0$ g/dL (Men)
   - Possible Anemia: $11.0 - 11.9$ g/dL
   - High Risk: $< 11.0$ g/dL
6. **Return matching dictionary**:
   ```python
   return {
       "estimated_hb": float(predicted_hb),
       "confidence": float(confidence_score),
       "status": "likely_normal" | "possible_anemia" | "high_risk" | "low_confidence" | "image_quality_failed",
       "image_quality": "good" | "poor" | "failed",
   }
   ```

---

## ⚠️ Medical Disclaimers & Known Boundaries

1. **Screening Aid Only**: Arogya Lens is intended as a non-invasive preliminary triage tool for early detection and is **not a certified diagnostic substitute** for laboratory complete blood count (CBC) venous blood tests.
2. **Informational Symptoms**: Symptoms collected via the UI are purely user-reported contextual indicators and are never used as standalone automated clinical diagnoses.
