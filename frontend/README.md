# Arogya Lens — Frontend Member 1

This repository contains **Frontend Member 1's work** for **Arogya Lens**: the complete core non-invasive anaemia screening user journey.

---

## 🚀 How to Run the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 🔑 Mock Testing Data
* **Development Mock OTP**: `123456` (also includes an auto-fill button in the UI)
* **Default Test User**: Mobile `9876543210` (Priya Sharma, Age 28, Female)
* **Demo Controls Drawer**: Available on `/scanner`, `/scanner/quality`, and `/screening/result` to simulate all computer vision alignment states, image quality failures, and High/Medium/Low confidence results during demos.

---

## 🗺️ Main Routes Implemented (Frontend Member 1 Scope)

| Route | Page | Description |
|---|---|---|
| `/register` | Patient Registration | Demographic data entry with validation (Name, 10-digit mobile, Sex, Age) |
| `/register/verify-otp` | OTP Verification | 6-digit PIN input with auto-focus, paste, and resend cooldown |
| `/login` | Returning User Login | Mobile-only sign-in for returning users |
| `/login/verify-otp` | OTP Verification | 6-digit PIN verification for returning login |
| `/welcome` | Healthcare Welcome | Screening onboarding, 3-step guide, and optional symptom checklist |
| `/scanner` | Eye Scanner | Mobile-first live camera viewfinder with rounded rectangular eye/conjunctiva frame |
| `/scanner/quality` | Quality Verification | 4-point clinical checklist (Eye visibility, Sharpness, Lighting, Conjunctiva exposure) |
| `/screening/result` | Screening Result | Estimated Hb (g/dL), Confidence (%), Status badge, medical disclaimer, and next steps |

---

## 📦 What Frontend Member 1 Implemented
1. **First-Time Registration & Returning User Login Flows** with modular validation.
2. **Reusable 6-Digit OTP Verification Component** with keyboard and clipboard handling.
3. **Healthcare Welcome Screen** with optional symptom tracker.
4. **Smartphone-Style Eye Scanner Viewfinder** with rounded rectangular conjunctiva frame (strictly eye region, not full face/circular).
5. **Camera API Lifecycle (`getUserMedia`)** with permission state handlers and **automatic camera track cleanup (`track.stop()`) on unmount**.
6. **Eye Alignment Service Abstraction (`eyeDetectionService`)** supporting real-time prompts and green glowing alignment confirmation.
7. **High-Resolution Canvas Frame Snapshot** stored strictly in transient memory state (never saved permanently in `localStorage`).
8. **Image Quality Verification Screen** with pass/fail and retake workflows.
9. **Screening Result Screen** supporting High, Medium, and Low confidence tiers, medical disclaimers, and patient-reported symptoms.
10. **Pluggable Mock & FastAPI-Ready Service Architecture** with clean TypeScript data contracts.

---

## ⚠️ Notes for Teammates (Pending Integrations)
* **Backend Member 1**: FastAPI authentication endpoints (`/api/auth/register`, `/api/auth/send-otp`, `/api/auth/verify-otp`) can be plugged in by setting `VITE_USE_MOCK=false` in `.env`.
* **Backend/AI Member 2**: Live computer vision eye detection can replace `src/services/api/eyeDetectionService.ts`, and the anaemia ML inference model connects to `POST /api/screenings/analyze`.
* **Frontend Member 2**: Post-screening features (Profile, Screening History, Hb trends, Dashboard) can be mounted in `src/routes/AppRoutes.tsx`.

For detailed contracts and handoff notes, see `FRONTEND_MEMBER_1.md`.