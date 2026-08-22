# Arogya Lens — Frontend Integration Guide

This document provides everything the frontend developer needs to build the HTML, CSS, and Vanilla JavaScript user interface for **Arogya Lens** and connect it to the FastAPI backend.

---

## 🌐 API Base URL & Configuration

- **Local Backend Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

### Authentication Header Format
All protected endpoints require the JWT bearer token in the `Authorization` header:
```http
Authorization: Bearer <access_token>
```

---

## 📸 Complete Camera Capture & Upload Flow (Vanilla JavaScript)

Arogya Lens captures the user's lower eyelid/conjunctiva in the browser using the Web MediaDevices API. **FastAPI never accesses the device camera directly; it receives the captured image blob via standard multipart form upload.**

```
+------------------+         +-------------------+         +------------------------+         +------------------+
|  User Browser    |         |   HTML5 Canvas    |         |   JavaScript FormData  |         |  FastAPI Backend |
|  getUserMedia()  | ------> |  Snapshot Frame   | ------> |  POST /analyze (Image) | ------> |  predict_hb() &  |
|  <video> stream  |         |   toBlob(jpeg)    |         |  Bearer JWT Auth       |         |  Save SQLite DB  |
+------------------+         +-------------------+         +------------------------+         +------------------+
```

### Complete Vanilla JavaScript Implementation Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Arogya Lens Camera Test</title>
  <style>
    #camera-container { max-width: 400px; margin: auto; text-align: center; }
    video, canvas { width: 100%; border-radius: 8px; }
    button { padding: 10px 20px; margin: 10px; cursor: pointer; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div id="camera-container">
    <h2>Capture Eye / Conjunctiva Photo</h2>
    <video id="video" autoplay playsinline></video>
    <canvas id="canvas" class="hidden"></canvas>
    
    <div>
      <button id="start-btn">Open Camera</button>
      <button id="capture-btn" class="hidden">Capture & Analyze</button>
    </div>
    
    <div id="result"></div>
  </div>

  <script>
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const startBtn = document.getElementById("start-btn");
    const captureBtn = document.getElementById("capture-btn");
    const resultDiv = document.getElementById("result");

    const API_BASE = "http://127.0.0.1:8000";
    let token = localStorage.getItem("access_token") || "";

    // 1. Start Camera Stream
    startBtn.addEventListener("click", async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        video.srcObject = stream;
        startBtn.classList.add("hidden");
        captureBtn.classList.remove("hidden");
      } catch (err) {
        alert("Unable to access camera: " + err.message);
      }
    });

    // 2. Capture Frame and Upload
    captureBtn.addEventListener("click", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return alert("Failed to capture image");

        const formData = new FormData();
        formData.append("image", blob, "conjunctiva_capture.jpg");

        resultDiv.innerHTML = "<em>Analyzing image with Arogya Lens AI...</em>";

        try {
          const response = await fetch(`${API_BASE}/api/screenings/analyze`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            },
            body: formData
          });

          if (!response.ok) {
            const err = await response.json();
            resultDiv.innerHTML = `<span style="color:red">Error: ${err.detail}</span>`;
            return;
          }

          const data = await response.json();
          resultDiv.innerHTML = `
            <h3>Screening Result</h3>
            <p><strong>Screening ID:</strong> ${data.id}</p>
            <p><strong>Estimated Hb:</strong> ${data.estimated_hb} g/dL</p>
            <p><strong>Confidence:</strong> ${(data.confidence * 100).toFixed(0)}%</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Image Quality:</strong> ${data.image_quality}</p>
          `;
        } catch (error) {
          resultDiv.innerHTML = `<span style="color:red">Network Error: ${error.message}</span>`;
        }
      }, "image/jpeg", 0.95);
    });
  </script>
</body>
</html>
```

---

## 📋 Comprehensive API Reference for Frontend

### 1. Health Check
- **`GET /api/health`**
  - **Auth**: None
  - **Response (200 OK)**:
    ```json
    {
      "status": "healthy",
      "service": "Arogya Lens API",
      "version": "1.0.0"
    }
    ```

---

### 2. User Registration
- **`POST /api/auth/register`**
  - **Auth**: None
  - **Request Body**:
    ```json
    {
      "name": "Priya Sharma",
      "mobile_number": "9876543210",
      "sex": "female",
      "age": 28
    }
    ```
    *Allowed `sex`: `male`, `female`, `other`, `prefer_not_to_say`*
  - **Response (201 Created)**:
    ```json
    {
      "message": "User registered successfully",
      "user": {
        "id": 1,
        "mobile_number": "9876543210",
        "is_mobile_verified": false,
        "is_active": true,
        "created_at": "2026-08-21T10:00:00Z",
        "updated_at": "2026-08-21T10:00:00Z"
      },
      "profile": {
        "id": 1,
        "user_id": 1,
        "name": "Priya Sharma",
        "age": 28,
        "sex": "female",
        "created_at": "2026-08-21T10:00:00Z",
        "updated_at": "2026-08-21T10:00:00Z"
      }
    }
    ```
  - **Errors**:
    - `400 Bad Request`: `"Mobile number already registered"`
    - `422 Unprocessable Entity`: Input validation failure (e.g. invalid age or mobile format)

---

### 3. Send Mock OTP
- **`POST /api/auth/send-otp`**
  - **Auth**: None
  - **Request Body**:
    ```json
    {
      "mobile_number": "9876543210"
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "message": "OTP sent successfully",
      "mobile_number": "9876543210"
    }
    ```
  - **Errors**:
    - `404 Not Found`: `"Mobile number not registered. Please register first."`

---

### 4. Verify OTP & Receive JWT
- **`POST /api/auth/verify-otp`**
  - **Auth**: None
  - **Request Body**:
    ```json
    {
      "mobile_number": "9876543210",
      "otp": "123456"
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer",
      "user": {
        "id": 1,
        "mobile_number": "9876543210",
        "is_mobile_verified": true,
        "is_active": true,
        "created_at": "2026-08-21T10:00:00Z",
        "updated_at": "2026-08-21T10:00:05Z"
      },
      "profile": {
        "id": 1,
        "user_id": 1,
        "name": "Priya Sharma",
        "age": 28,
        "sex": "female",
        "created_at": "2026-08-21T10:00:00Z",
        "updated_at": "2026-08-21T10:00:00Z"
      }
    }
    ```
  - **Errors**:
    - `401 Unauthorized`: `"Invalid or expired OTP"`
    - `404 Not Found`: `"Mobile number not registered"`

---

### 5. Get Authenticated User Identity
- **`GET /api/auth/me`**
  - **Auth**: Bearer Token
  - **Response (200 OK)**:
    ```json
    {
      "id": 1,
      "mobile_number": "9876543210",
      "is_mobile_verified": true,
      "is_active": true,
      "created_at": "2026-08-21T10:00:00Z",
      "updated_at": "2026-08-21T10:00:05Z",
      "profile": {
        "id": 1,
        "user_id": 1,
        "name": "Priya Sharma",
        "age": 28,
        "sex": "female",
        "created_at": "2026-08-21T10:00:00Z",
        "updated_at": "2026-08-21T10:00:00Z"
      }
    }
    ```

---

### 6. User Profile Management
- **`GET /api/users/me`**
  - **Auth**: Bearer Token
  - **Response (200 OK)**:
    ```json
    {
      "id": 1,
      "name": "Priya Sharma",
      "mobile_number": "9876543210",
      "age": 28,
      "sex": "female",
      "created_at": "2026-08-21T10:00:00Z"
    }
    ```

- **`PUT /api/users/me`**
  - **Auth**: Bearer Token
  - **Request Body**:
    ```json
    {
      "name": "Priya S. Sharma",
      "age": 29,
      "sex": "female"
    }
    ```
  - **Response (200 OK)**: Returns updated profile object.
  - *Note: Mobile number is immutable on this endpoint.*

---

### 7. Patient Analytical Summary
- **`GET /api/users/me/summary`**
  - **Auth**: Bearer Token
  - **Response (200 OK)**:
    ```json
    {
      "total_screenings": 3,
      "first_screening_date": "2026-08-21",
      "latest_screening_date": "2026-10-20",
      "latest_estimated_hb": 12.6,
      "previous_estimated_hb": 11.9,
      "average_estimated_hb": 11.97,
      "minimum_estimated_hb": 11.4,
      "maximum_estimated_hb": 12.6,
      "change_from_previous": 0.7,
      "latest_confidence": 0.93,
      "latest_status": "likely_normal"
    }
    ```

---

### 8. Upload & Analyze Eye Image
- **`POST /api/screenings/analyze`**
  - **Auth**: Bearer Token
  - **Content-Type**: `multipart/form-data`
  - **Form Field**: `image` (binary file: JPG, JPEG, PNG, WEBP, up to 10MB)
  - **Response (201 Created)**:
    ```json
    {
      "id": 14,
      "user_id": 1,
      "checkup_date": "2026-08-21",
      "checkup_time": "14:30:00",
      "estimated_hb": 11.4,
      "confidence": 0.86,
      "status": "possible_anemia",
      "image_path": "uploads/1/76eeb01c1d744546b333377354064cc8_eye.jpg",
      "image_quality": "good",
      "created_at": "2026-08-21T14:30:00Z"
    }
    ```
  - **Errors**:
    - `413 Content Too Large`: File exceeds 10MB limit.
    - `415 Unsupported Media Type`: Invalid image format.

---

### 9. Screening Details & Symptoms
- **`GET /api/screenings/{screening_id}`**
  - **Auth**: Bearer Token
  - **Response (200 OK)**:
    ```json
    {
      "id": 14,
      "user_id": 1,
      "checkup_date": "2026-08-21",
      "checkup_time": "14:30:00",
      "estimated_hb": 11.4,
      "confidence": 0.86,
      "status": "possible_anemia",
      "image_path": "uploads/1/76eeb01c1d744546b333377354064cc8_eye.jpg",
      "image_quality": "good",
      "created_at": "2026-08-21T14:30:00Z",
      "symptoms": [
        {
          "id": 1,
          "symptom_name": "fatigue",
          "custom_symptom": null,
          "label_en": "Fatigue / Weakness",
          "label_hi": "थकान / कमजोरी",
          "created_at": "2026-08-21T14:35:00Z"
        }
      ]
    }
    ```
  - **Errors**:
    - `403 Forbidden`: Attempted to access another user's screening.
    - `404 Not Found`: Screening ID does not exist.

- **`POST /api/screenings/{screening_id}/symptoms`**
  - **Auth**: Bearer Token
  - **Request Body**:
    ```json
    {
      "symptoms": [
        { "symptom_name": "fatigue" },
        { "symptom_name": "dizziness" },
        { "symptom_name": "other", "custom_symptom": "Cold fingertips" }
      ]
    }
    ```
    *Allowed symptoms*: `fatigue`, `dizziness`, `shortness_of_breath`, `rapid_or_irregular_heartbeat`, `headache`, `pale_skin`, `cold_hands_feet`, `brittle_nails`, `poor_appetite`, `none`, `other`
  - **Response (201 Created)**: Returns saved bilingual symptoms list.
  - **Errors**:
    - `400 Bad Request` or `422 Unprocessable Entity`: `"none" cannot be combined with other symptoms`.

- **`GET /api/screenings/{screening_id}/symptoms`**
  - **Auth**: Bearer Token
  - **Response (200 OK)**: Returns bilingual symptom list for the screening.

---

### 10. Screening History
- **`GET /api/history`**
  - **Auth**: Bearer Token
  - **Response (200 OK)**:
    ```json
    [
      {
        "screening_id": 14,
        "date": "2026-08-21",
        "time": "14:30:00",
        "estimated_hb": 11.4,
        "confidence": 0.86,
        "status": "possible_anemia",
        "image_quality": "good",
        "symptoms": [
          {
            "id": 1,
            "symptom_name": "fatigue",
            "custom_symptom": null,
            "label_en": "Fatigue / Weakness",
            "label_hi": "थकान / कमजोरी",
            "created_at": "2026-08-21T14:35:00Z"
          }
        ]
      }
    ]
    ```
    *Sorted newest first.*

---

### 11. Dashboard & Trend Analytics
- **`GET /api/dashboard`**
  - **Auth**: Bearer Token
  - **Response (200 OK)**:
    ```json
    {
      "total_screenings": 3,
      "possible_anemia_count": 2,
      "high_risk_count": 0,
      "low_confidence_count": 0,
      "average_estimated_hb": 11.97,
      "latest_screening": {
        "screening_id": 14,
        "date": "2026-10-20",
        "time": "11:45:00",
        "estimated_hb": 12.6,
        "confidence": 0.93,
        "status": "likely_normal"
      },
      "recent_screenings": [
        {
          "screening_id": 14,
          "date": "2026-10-20",
          "time": "11:45:00",
          "estimated_hb": 12.6,
          "confidence": 0.93,
          "status": "likely_normal"
        }
      ]
    }
    ```

- **`GET /api/dashboard/trend`**
  - **Auth**: Bearer Token
  - **Response (200 OK)**:
    ```json
    [
      { "date": "2026-08-21", "estimated_hb": 11.4 },
      { "date": "2026-09-05", "estimated_hb": 11.9 },
      { "date": "2026-10-20", "estimated_hb": 12.6 }
    ]
    ```
    *Sorted chronologically (oldest to newest) — ideal for Chart.js or HTML Canvas line graphs.*
