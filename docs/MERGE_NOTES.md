# Arogya Lens — Integration & Merge Notes

This document records all inspection findings, file mapping decisions, and conflict resolutions across the four development streams.

---

## 1. Team Contributions & Domain Breakdown

| Stream | Author / Scope | Core Deliverables | Integration Placement |
| :--- | :--- | :--- | :--- |
| **Member 1** | Rohit (Backend Core) | FastAPI app, SQLite ORM models, PyJWT authentication, profile management, history endpoints, bilingual symptom mappings, dashboard endpoints, unit & integration test suite | `backend/app/`, `backend/tests/` |
| **Member 2** | Aitesham (AI / CV) | End-to-end conjunctiva inference pipeline, image quality gate, eye/conjunctiva ROI segmenter, colorimetric feature extractor, trained SVR model artifact, confidence reliability metric, training & cross-validation scripts | `backend/app/ai/`, `ml/inference/`, `ml/models/`, `ml/training/` |
| **Member 3** | Upasana (Frontend Core) | Core screening flow: Registration, OTP verification, Returning Login, Welcome screen, Camera Preview & Alignment guide, Image Quality check screen, Result screen | `frontend/src/pages/auth/`, `frontend/src/pages/screening/`, `frontend/src/components/screening/` |
| **Member 4** | Shrushti (Frontend Analytics) | Post-screening flow: User Profile page & Demographic edit modal, Filterable Screening History, Screening Detail view, Pure SVG interactive Hb Trend Chart, Dashboard Summary cards, App navigation layout | `frontend/src/pages/dashboard/`, `frontend/src/pages/history/`, `frontend/src/pages/profile/`, `frontend/src/pages/trends/`, `frontend/src/components/` |

---

## 2. Inventory of Processed Files

| Source File / Directory | Provenance | Type | Action Taken | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `arogya_lens_backend_Rohit/app/` | Member 1 | Backend | Merged into `backend/app/` | Foundation REST API architecture, database models, schemas, and services. |
| `arogya_lens_backend_Rohit/tests/` | Member 1 | Tests | Merged into `backend/tests/` | Preserved all 31 unit, integration, and security tests. |
| `arogya_lens_backend_Aitesham/app/ai/` | Member 2 | AI / CV | Merged into `backend/app/ai/` and `ml/inference/` | Connects real computer vision & SVR regression model to backend. |
| `arogya_lens_backend_Aitesham/models/` | Member 2 | ML Model | Copied to `backend/app/ai/models/` and `ml/models/` | Pre-trained SVR artifact (`hb_model.joblib`) with 1.21 g/dL CV MAE. |
| `arogya_lens_backend_Aitesham/training/` | Member 2 | ML Training | Copied to `ml/training/` | Offline dataset manifest, feature extraction, cross-validation & training code. |
| `arogya_lens_backend_Aitesham/India.xlsx` | Member 2 | Dataset | Copied to `ml/dataset/India.xlsx` | 95-subject clinical dataset reference. |
| `arogya_lens_backend_Aitesham/tests/` | Member 2 | Tests | Merged into `backend/tests/` and `ml/tests/` | Added feature extraction and end-to-end pipeline tests. |
| `arogya_lens_frontend_Upasana/` | Member 3 | Frontend | Merged into `frontend/` | Auth & live screening camera scanner components. |
| `arogya_lens_frontend_Shrushti/` | Member 4 | Frontend | Merged into `frontend/` | Dashboard, trends, profile, history, and unified navigation. |
| `src\components\`, `src\pages\`, etc. | Unzip Debris | Junk | Removed | Zero-byte Windows backslash files generated during unzip. |

---

## 3. Key Merge Decisions & Conflict Resolutions

### Decision 1: AI / CV Inference Bridge
- **Problem**: Rohit’s backend had a placeholder `predict_hb(image_path)` mock service for Part 3 handoff, while Aitesham developed a complete computer vision pipeline in `app/ai/pipeline.py`.
- **Resolution**: Updated `backend/app/services/prediction_service.py` to invoke `app.ai.pipeline.get_pipeline().analyze_image_array()`. The bridge decodes the image, runs the quality check, detects the eye, extracts conjunctiva color features, predicts continuous Hb (g/dL), and maps severity status. A safe mock fallback was preserved when `AI_MOCK_MODE=true`.

### Decision 2: Demographic Feature Propagation
- **Problem**: Aitesham's empirical ML research proved that adding patient demographics (Age, Sex) improves cross-validated MAE from 1.33 g/dL to 1.21 g/dL.
- **Resolution**: Updated `analyze_eye_image` in `backend/app/services/screening_service.py` to extract `user.profile.age` and `user.profile.sex` and supply them to `predict_hb()`.

### Decision 3: Frontend Member 1 vs Member 2 Reconciliation
- **Problem**: Upasana built the auth/screening flow, while Shrushti extended it with analytics and dashboard routes.
- **Resolution**: Merged both into a unified `frontend/` project. `AppRoutes.tsx` registers all 12 routes (`/register`, `/login`, `/verify-otp`, `/welcome`, `/scanner`, `/scanner/quality`, `/screening/result`, `/dashboard`, `/history`, `/history/:screeningId`, `/profile`, `/trends`). Navigation links between screening result and dashboard were linked seamlessly.

### Decision 4: Centralized Frontend API Configuration
- **Problem**: Multiple frontend files referenced different API URLs or default ports.
- **Resolution**: Created `frontend/src/services/api/config.ts` exporting `API_BASE_URL` (defaulting to `http://127.0.0.1:8000` via `VITE_API_BASE_URL`) and `USE_MOCK` boolean. Updated `apiClient.ts` to attach `Authorization: Bearer` tokens and dynamically handle both JSON and FormData multipart payloads.

### Decision 5: Profile & Health Route Compatibility
- **Problem**: Frontend Member 2 expected `/api/profile`, while Backend Member 1 implemented `/api/users/me`.
- **Resolution**: Added `backend/app/routes/profile.py` as an alias router mirroring `/api/users/me`, while also updating `frontend/src/services/api/profileService.ts` to query `/api/users/me` and `/api/users/me/summary`. Both routes function identically.

---

## 4. Final Validation Summary
- **Backend Tests**: 39/39 passing (`pytest backend/tests/`).
- **ML Inference Tests**: 11/11 passing (`pytest ml/tests/`).
- **Frontend Build**: 100% clean production bundle (`tsc && vite build`).
