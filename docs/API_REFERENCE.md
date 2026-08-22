# Arogya Lens — REST API Reference

Base URL: `http://127.0.0.1:8000`  
Interactive OpenAPI Documentation: `http://127.0.0.1:8000/docs`  
ReDoc Documentation: `http://127.0.0.1:8000/redoc`

---

## 1. Authentication Endpoints

### Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Request Body**:
```json
{
  "name": "Priya Sharma",
  "mobile_number": "9876543210",
  "sex": "female",
  "age": 28
}
```
- **Response** (`201 Created`):
```json
{
  "message": "User registered successfully",
  "mobile_number": "9876543210"
}
```

### Send OTP
- **Method**: `POST`
- **Path**: `/api/auth/send-otp`
- **Request Body**:
```json
{
  "mobile_number": "9876543210"
}
```
- **Response** (`200 OK`):
```json
{
  "message": "OTP sent successfully (mock OTP is 123456)",
  "mobile_number": "9876543210"
}
```

### Verify OTP & Issue Token
- **Method**: `POST`
- **Path**: `/api/auth/verify-otp`
- **Request Body**:
```json
{
  "mobile_number": "9876543210",
  "otp": "123456"
}
```
- **Response** (`200 OK`):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "mobile_number": "9876543210",
    "is_mobile_verified": true,
    "is_active": true,
    "created_at": "2026-08-22T02:00:00Z",
    "updated_at": "2026-08-22T02:00:00Z"
  },
  "profile": {
    "id": 1,
    "user_id": 1,
    "name": "Priya Sharma",
    "age": 28,
    "sex": "female",
    "created_at": "2026-08-22T02:00:00Z",
    "updated_at": "2026-08-22T02:00:00Z"
  }
}
```

### Get Authenticated User
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): Current user object with verified status and profile.

---

## 2. User Profile Endpoints

### Get My Profile
- **Method**: `GET`
- **Path**: `/api/users/me` (Alias: `/api/profile`)
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
```json
{
  "id": 1,
  "name": "Priya Sharma",
  "mobile_number": "9876543210",
  "age": 28,
  "sex": "female",
  "created_at": "2026-08-22T02:00:00Z"
}
```

### Update My Profile
- **Method**: `PUT`
- **Path**: `/api/users/me` (Alias: `/api/profile`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Priya S. Sharma",
  "age": 29,
  "sex": "female"
}
```
- **Response** (`200 OK`): Updated profile object.

### Get Patient Anaemia Metrics Summary
- **Method**: `GET`
- **Path**: `/api/users/me/summary`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
```json
{
  "total_screenings": 5,
  "first_screening_date": "2026-08-01",
  "latest_screening_date": "2026-08-22",
  "latest_estimated_hb": 11.4,
  "previous_estimated_hb": 10.8,
  "average_estimated_hb": 11.1,
  "minimum_estimated_hb": 10.2,
  "maximum_estimated_hb": 11.8,
  "change_from_previous": 0.6,
  "latest_confidence": 0.86,
  "latest_status": "possible_anemia"
}
```

---

## 3. Screening & AI Inference Endpoints

### Analyze Ocular Image
- **Method**: `POST`
- **Path**: `/api/screenings/analyze`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `image` (file, required): Captured eye photograph (`image/jpeg`, `image/png`, `image/webp`, max 10MB)
- **Response** (`201 Created`):
```json
{
  "id": 12,
  "user_id": 1,
  "checkup_date": "2026-08-22",
  "checkup_time": "02:45:00",
  "estimated_hb": 11.45,
  "confidence": 0.86,
  "status": "possible_anemia",
  "image_path": "uploads/1/eye_20260822_024500_abc.jpg",
  "image_quality": "good",
  "created_at": "2026-08-22T02:45:00Z"
}
```

### Get Single Screening Details
- **Method**: `GET`
- **Path**: `/api/screenings/{screening_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): Complete screening record including associated bilingual symptoms.

### Record User Symptoms
- **Method**: `POST`
- **Path**: `/api/screenings/{screening_id}/symptoms`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "symptoms": [
    { "symptom_name": "fatigue" },
    { "symptom_name": "dizziness" },
    { "symptom_name": "pale_skin" }
  ]
}
```
- **Response** (`201 Created`): List of recorded symptoms with localized English and Hindi labels.

---

## 4. History & Dashboard Endpoints

### Get Screening History
- **Method**: `GET`
- **Path**: `/api/history`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): Array of historical screening items ordered newest first.

### Get Dashboard Overview
- **Method**: `GET`
- **Path**: `/api/dashboard`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): Total screenings count, latest estimated Hb, latest confidence score, risk category counts, and 5 most recent screenings.

### Get Chronological Hb Trend Data
- **Method**: `GET`
- **Path**: `/api/dashboard/trend`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
```json
[
  {
    "screening_id": 1,
    "date": "2026-08-01",
    "display_date": "01 Aug",
    "estimated_hb": 10.2,
    "confidence": 0.82,
    "status": "possible_anemia"
  },
  {
    "screening_id": 12,
    "date": "2026-08-22",
    "display_date": "22 Aug",
    "estimated_hb": 11.45,
    "confidence": 0.86,
    "status": "possible_anemia"
  }
]
```

---

## 5. System Health

### Health Check
- **Method**: `GET`
- **Path**: `/api/health` (Alias: `/health`)
- **Response** (`200 OK`):
```json
{
  "status": "healthy",
  "service": "Arogya Lens API",
  "version": "1.0.0"
}
```
