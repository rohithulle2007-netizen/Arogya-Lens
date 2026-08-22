import io
import pytest


def get_authenticated_client(client, mobile="9876543210", name="Test User"):
    """Helper to register, verify, and return auth header."""
    client.post(
        "/api/auth/register",
        json={"name": name, "mobile_number": mobile, "sex": "male", "age": 28},
    )
    res = client.post(
        "/api/auth/verify-otp",
        json={"mobile_number": mobile, "otp": "123456"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_image_upload_and_screening_creation(client):
    headers = get_authenticated_client(client, mobile="9111111111", name="Screening User")

    # Create dummy image bytes
    image_content = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
    files = {"image": ("eye_sample.jpg", io.BytesIO(image_content), "image/jpeg")}

    response = client.post("/api/screenings/analyze", headers=headers, files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["estimated_hb"] == 11.4
    assert data["confidence"] == 0.86
    assert data["status"] == "possible_anemia"
    assert data["image_quality"] == "good"
    assert "uploads/1/" in data["image_path"] or "uploads/" in data["image_path"]


def test_invalid_image_type_rejected(client):
    headers = get_authenticated_client(client, mobile="9222222222", name="Bad File User")

    # Send plain text file
    files = {"image": ("document.txt", io.BytesIO(b"Hello world"), "text/plain")}
    response = client.post("/api/screenings/analyze", headers=headers, files=files)
    assert response.status_code == 415
    assert "Unsupported" in response.json()["detail"]


def test_oversized_image_rejected(client):
    headers = get_authenticated_client(client, mobile="9333333333", name="Oversize User")

    # Create fake 11MB file
    oversized_content = b"x" * (11 * 1024 * 1024)
    files = {"image": ("huge_eye.jpg", io.BytesIO(oversized_content), "image/jpeg")}
    response = client.post("/api/screenings/analyze", headers=headers, files=files)
    assert response.status_code == 413
    assert "exceeds maximum allowed limit" in response.json()["detail"]


def test_screening_retrieval_and_ownership(client):
    headers_user1 = get_authenticated_client(client, mobile="9444444441", name="User One")
    headers_user2 = get_authenticated_client(client, mobile="9444444442", name="User Two")

    # User 1 creates screening
    files = {"image": ("eye.png", io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"), "image/png")}
    create_res = client.post("/api/screenings/analyze", headers=headers_user1, files=files)
    assert create_res.status_code == 201
    screening_id = create_res.json()["id"]

    # User 1 retrieves own screening -> 200 OK
    get_res = client.get(f"/api/screenings/{screening_id}", headers=headers_user1)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == screening_id

    # User 2 tries to retrieve User 1's screening -> 403 Forbidden
    forbidden_res = client.get(f"/api/screenings/{screening_id}", headers=headers_user2)
    assert forbidden_res.status_code == 403
    assert "You do not have access" in forbidden_res.json()["detail"]


def test_symptoms_submission_and_bilingual_retrieval(client):
    headers = get_authenticated_client(client, mobile="9555555555", name="Symptom User")

    # 1. Create screening
    files = {"image": ("eye.webp", io.BytesIO(b"RIFF\x00\x00\x00\x00WEBP"), "image/webp")}
    screening = client.post("/api/screenings/analyze", headers=headers, files=files).json()
    screening_id = screening["id"]

    # 2. Add multiple symptoms including custom symptom
    symptoms_payload = {
        "symptoms": [
            {"symptom_name": "fatigue"},
            {"symptom_name": "dizziness"},
            {"symptom_name": "other", "custom_symptom": "Frequent cold hands"},
        ]
    }
    sym_res = client.post(
        f"/api/screenings/{screening_id}/symptoms",
        headers=headers,
        json=symptoms_payload,
    )
    assert sym_res.status_code == 201
    data = sym_res.json()
    assert len(data["symptoms"]) == 3

    # Check bilingual fields
    fatigue_sym = next(s for s in data["symptoms"] if s["symptom_name"] == "fatigue")
    assert fatigue_sym["label_en"] == "Fatigue / Weakness"
    assert fatigue_sym["label_hi"] == "थकान / कमजोरी"

    # 3. GET /api/screenings/{id}/symptoms
    get_sym_res = client.get(f"/api/screenings/{screening_id}/symptoms", headers=headers)
    assert get_sym_res.status_code == 200
    assert len(get_sym_res.json()["symptoms"]) == 3


def test_none_combined_with_other_symptoms_fails(client):
    headers = get_authenticated_client(client, mobile="9666666666", name="Validation User")

    # Create screening
    files = {"image": ("eye.jpg", io.BytesIO(b"\xFF\xD8\xFF\xE0"), "image/jpeg")}
    screening = client.post("/api/screenings/analyze", headers=headers, files=files).json()
    screening_id = screening["id"]

    # Attempt to send 'none' combined with 'headache' -> 422 or 400
    bad_payload = {
        "symptoms": [
            {"symptom_name": "none"},
            {"symptom_name": "headache"},
        ]
    }
    res = client.post(
        f"/api/screenings/{screening_id}/symptoms",
        headers=headers,
        json=bad_payload,
    )
    assert res.status_code in [400, 422]
