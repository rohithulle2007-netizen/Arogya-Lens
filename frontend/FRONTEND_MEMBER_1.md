# Arogya Lens — Frontend Member 1 Handoff Documentation

## 1. What I Implemented
As **Frontend Member 1**, I implemented the complete **Core Screening User Journey**:
1. **Registration Flow**: Patient registration with form validation (Full Name, Mobile Number, Sex, Age) -> OTP generation.
2. **OTP Verification**: Reusable 6-digit PIN input with automatic focus advance, backspace navigation, paste handling, resend timer, and mock validation (`123456`).
3. **Returning User Login**: Fast mobile number login without re-prompting for demographics.
4. **Welcome Screen**: Healthcare-focused screening initiation screen with 3-step guide and optional clinical symptom selection.
5. **Eye Scanner**: Smartphone-camera-style viewfinder with rounded rectangular eye/conjunctiva scanning frame (strictly conjunctiva region, NOT circular face scan).
6. **Camera Lifecycle & Permission Handling**: Full `getUserMedia` lifecycle with permission states (`requesting`, `granted`, `denied`, `unavailable`) and **strict camera track cleanup (`track.stop()`) on component unmount/route change**.
7. **Eye Alignment Abstraction (`eyeDetectionService`)**: Replaceable service layer supporting real-time feedback states (`Position eye`, `Move closer`, `Move left`, `Move right`, `Hold steady`, `✓ Eye detected`) and glowing emerald green alignment confirmation.
8. **High-Resolution Image Capture**: Viewfinder frame capture rendered via canvas, stored transiently in volatile React state (never permanently in `localStorage` for privacy/security).
9. **Image Quality Verification**: Animated clinical verification checklist (Eye Visibility, Image Sharpness, Lighting & Glare, Palpebral Conjunctiva Exposure) with graceful `[ Retake ]` handling for insufficient quality.
10. **Screening Result & Confidence Tiers**: Reusable `ScreeningResult` component displaying Estimated Hb (e.g. `10.8 g/dL`), Confidence (`86%`), Status classification badge (`Possible Anaemia`, `Normal`, `Severe Anaemia`), mandatory medical disclaimer (*"Screening estimate — not a laboratory diagnosis."*), segregated reported symptoms, and actionable clinical next steps.
11. **Multi-Tier Confidence Handling**:
    - **High Confidence (>= 80%)**: Full standard report.
    - **Medium Confidence (60–79%)**: Warning alert advising image retake.
    - **Low Confidence (< 60%)**: Notice explaining inability to provide estimate with prominent `[ Retake Scan ]` action.

---

## 2. Files & Components Owned by Frontend Member 1

```
src/
├── types/
│   ├── auth.ts                     # UserRegistration, UserProfile, OtpVerificationRequest, AuthResponse
│   └── screening.ts                # EyeDetectionState, ImageQualityResult, ScreeningResultData
├── services/
│   ├── api/
│   │   ├── apiClient.ts            # Base fetch wrapper with auth header & mock switch
│   │   ├── authService.ts          # Auth API interface (register, sendOtp, verifyOtp, getUser)
│   │   ├── eyeDetectionService.ts  # Eye alignment abstraction interface
│   │   └── screeningService.ts     # Screening quality & analysis API interface
│   └── mocks/
│       ├── mockAuthService.ts      # Offline auth engine with mock OTP: 123456
│       ├── mockEyeDetectionService.ts # Simulated alignment progression & manual testing overrides
│       └── mockScreeningService.ts # Quality checks & Hb estimation simulation engine
├── context/
│   ├── AuthContext.tsx             # Auth state provider
│   └── ScreeningContext.tsx        # In-memory screening session (captured frame, symptoms, results)
├── components/
│   ├── common/
│   │   ├── Header.tsx              # Application header with navigation & user status
│   │   ├── Button.tsx              # Reusable medical button with loading state
│   │   ├── Input.tsx               # Reusable input field with error & label support
│   │   ├── Card.tsx                # Clean card container
│   │   └── Badge.tsx               # Status indicator badge
│   └── screening/
│       ├── OtpInput.tsx            # 6-digit auto-advancing OTP component
│       ├── CameraPreview.tsx       # Web camera preview with permission & cleanup handlers
│       ├── ScannerFrame.tsx        # Rounded rectangular conjunctiva target window
│       ├── EyeAlignmentStatus.tsx  # Dynamic real-time alignment badges
│       ├── EyeScanner.tsx          # Smartphone camera scanner with capture logic & dev controls
│       ├── ImageQuality.tsx        # Image verification checklist screen
│       └── ScreeningResult.tsx     # Anaemia result display & confidence tier handler
├── pages/
│   ├── auth/
│   │   ├── RegisterPage.tsx        # /register
│   │   ├── LoginPage.tsx           # /login
│   │   └── OtpVerificationPage.tsx # /register/verify-otp & /login/verify-otp
│   └── screening/
│       ├── WelcomePage.tsx         # /welcome
│       ├── ScannerPage.tsx         # /scanner
│       ├── QualityCheckPage.tsx    # /scanner/quality
│       └── ResultPage.tsx          # /screening/result
├── routes/
│   └── AppRoutes.tsx               # Frontend Member 1 route registry
├── App.tsx
├── main.tsx
└── index.css
```

---

## 3. Routes Added
| Route | Page Component | Purpose |
|---|---|---|
| `/register` | `RegisterPage` | First-time patient demographic registration |
| `/register/verify-otp` | `OtpVerificationPage` | OTP verification following registration |
| `/login` | `LoginPage` | Returning patient mobile sign-in |
| `/login/verify-otp` | `OtpVerificationPage` | OTP verification following login |
| `/verify-otp` | `OtpVerificationPage` | Alias for direct OTP verification |
| `/welcome` | `WelcomePage` | Welcome screen & symptom checklist |
| `/scanner` | `ScannerPage` | Live camera & eye alignment scanner |
| `/scanner/quality` | `QualityCheckPage` | Image quality validation screen |
| `/screening/result` | `ResultPage` | Screening estimate & confidence report |

---

## 4. Services Created & Mock Data
- **Mock OTP**: `123456`
- **Default Seed User**: Mobile `9876543210` (Priya Sharma, Female, Age 28)
- **Mock Quality Checks**: Eye visibility (Passed), Sharpness (Clear), Lighting (Adequate), Conjunctiva exposure (Exposed), Quality Score `0.91`.
- **Mock Result Baseline**: Estimated Hb `10.8 g/dL`, Confidence `86%`, Status `Possible Anaemia`.

---

## 5. API Contracts & FastAPI Integration Points

The frontend connects through `src/services/api/`. When merging with Backend Member 1 & Backend/AI Member 2, set:
```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000
```

### Expected FastAPI Endpoints:

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Priya Sharma",
  "mobile": "9876543210",
  "sex": "female",
  "age": 28
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresInSeconds": 300
}
```

#### 2. Send Login OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobile": "9876543210"
}
```

#### 3. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "123456",
  "flow": "login" // or "register"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Authenticated successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "usr_123",
    "fullName": "Priya Sharma",
    "mobile": "9876543210",
    "sex": "female",
    "age": 28,
    "isRegistered": true
  }
}
```

#### 4. Analyze Screening Image (AI Inference)
```http
POST /api/screenings/analyze
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "image": "data:image/jpeg;base64,...",
  "symptoms": ["Fatigue", "Dizziness"]
}
```
**Response (200 OK):**
```json
{
  "screening_id": "AL-928103",
  "estimated_hb": 10.8,
  "confidence": 0.86,
  "status": "possible_anemia",
  "image_quality": "good",
  "reported_symptoms": ["Fatigue", "Dizziness"],
  "created_at": "2026-08-22T00:00:00Z"
}
```

---

## 6. What Other Teammates Should Replace / Connect

### For Frontend Member 2:
- **Routes to add**: You can mount `/profile`, `/history`, `/trends`, `/dashboard` inside `src/routes/AppRoutes.tsx`.
- **Navigation Links**: In `ScreeningResult.tsx` or `WelcomePage.tsx`, you can link to your History/Dashboard components without altering core screening logic.
- **Do not overwrite**: `src/components/screening/*`, `src/context/ScreeningContext.tsx`, `src/services/api/eyeDetectionService.ts`.

### For Backend Member 1 (Auth & Database):
- Implement the 3 auth endpoints: `/api/auth/register`, `/api/auth/send-otp`, `/api/auth/verify-otp`.
- Switch `VITE_USE_MOCK=false` in `.env`.

### For Backend / AI Member 2 (Computer Vision & Inference):
- **Live Eye Detection**: You can replace `src/services/api/eyeDetectionService.ts` with MediaPipe / TensorFlow.js / ONNX Web client models, or call a WebSocket/WebRTC stream. The UI subscribes directly via `startDetection(video, callback)` and expects `{ detected: boolean, aligned: boolean, quality: string, prompt: string }`.
- **Haemoglobin Estimation Model**: Bind your Python PyTorch/FastAPI model to `POST /api/screenings/analyze`.

---

## 7. How to Run Frontend Member 1

```bash
# Navigate to project folder
cd arogya-lens

# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

---

## 8. Known Limitations & Notes
- In browser environments without an active camera hardware device (or if running on headless test instances), the scanner automatically falls back to an anatomical conjunctiva simulation canvas so complete user journeys can be demonstrated without camera hardware blockages.
- Developer simulation drawers are available directly on the `/scanner`, `/scanner/quality`, and `/screening/result` pages to effortlessly demonstrate different eye alignment states, quality failures, and confidence tiers (High / Medium / Low) during demonstrations and judging.