# Arogya Lens — Team Collaboration & Domain Ownership Guide

This document outlines team ownership, conventions, and branch policies for the four Arogya Lens modules.

---

## 1. Module Ownership Matrix

```
                          ┌────────────────────────┐
                          │   Arogya Lens System   │
                          └───────────┬────────────┘
                                      │
     ┌──────────────────┬─────────────┴────────────┬──────────────────┐
     │                  │                          │                  │
┌────▼───────────┐ ┌────▼───────────┐      ┌───────▼────────┐ ┌───────▼────────┐
│ Member 1       │ │ Member 2       │      │ Member 3       │ │ Member 4       │
│ (Rohit)        │ │ (Aitesham)     │      │ (Upasana)      │ │ (Shrushti)     │
│ Backend Core & │ │ AI & Computer  │      │ Frontend Core  │ │ Frontend Post- │
│ Auth & DB      │ │ Vision Models  │      │ Screening & UI │ │ Screening & UX │
└────────────────┘ └────────────────┘      └────────────────┘ └────────────────┘
```

### Member 1: Rohit — Backend Core
- **Directory**: `backend/app/core/`, `backend/app/database/`, `backend/app/routes/`, `backend/app/schemas/`, `backend/app/services/auth_service.py`, `user_service.py`, `history_service.py`, `dashboard_service.py`
- **Responsibilities**:
  - FastAPI application lifecycle, security dependencies, and error handlers.
  - SQLAlchemy SQLite schema definitions and session transactions.
  - JWT bearer authentication and user isolation.
  - Bilingual symptom translation dictionary (English & Hindi).

### Member 2: Aitesham — AI & Computer Vision
- **Directory**: `backend/app/ai/`, `ml/inference/`, `ml/models/`, `ml/training/`, `ml/dataset/`
- **Responsibilities**:
  - Image quality validation algorithms (blur, illumination, contrast).
  - Ocular region detection and conjunctiva segmentation (palpebral & forniceal).
  - Colorimetric feature extraction (RGB, HSV, LAB, Erythema Index, ratios).
  - SVR regression model training, GroupKFold cross-validation, and metrics evaluation.
  - Continuous inference integration via `predict_hb()`.

### Member 3: Upasana — Frontend Core Screening Flow
- **Directory**: `frontend/src/pages/auth/`, `frontend/src/pages/screening/`, `frontend/src/components/screening/`, `frontend/src/context/ScreeningContext.tsx`
- **Responsibilities**:
  - Registration and 6-digit auto-advancing OTP verification components.
  - Returning user mobile authentication.
  - Browser camera integration (`navigator.mediaDevices.getUserMedia()`).
  - Viewfinder conjunctiva targeting frame and real-time alignment feedback states.
  - Frame capture, clinical quality verification checklist, and result presentation.

### Member 4: Shrushti — Frontend Analytics & User Domain
- **Directory**: `frontend/src/pages/dashboard/`, `frontend/src/pages/history/`, `frontend/src/pages/profile/`, `frontend/src/pages/trends/`, `frontend/src/components/charts/`, `dashboard/`, `history/`, `navigation/`, `profile/`
- **Responsibilities**:
  - User profile viewing and demographic editing modal.
  - Filterable historical screening records and single-assessment clinical report views.
  - Pure SVG interactive Hb trend chart with demographic normal reference ranges.
  - High-impact health screening dashboard summary cards.
  - Unified navigation layouts (`AppLayout` top navigation and mobile `BottomNav`).

---

## 2. Shared Code Guidelines & Conventions

1. **Keep APIs Stable**: Do not rename existing REST API paths without cross-team consensus.
2. **Centralized Configurations**: Use `config.py` in the backend and `config.ts` in the frontend.
3. **Medical Disclaimer Adherence**: Always preserve the disclaimer banner on any result or detail screen.
4. **Data Immutability**: Clinical screening records cannot be deleted via the API.
5. **Testing First**: Any new endpoint or ML component must include matching tests in `backend/tests/` or `ml/tests/`.
