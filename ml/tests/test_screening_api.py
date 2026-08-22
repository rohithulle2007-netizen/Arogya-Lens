"""Integration tests for FastAPI endpoints."""
import io
import os
import sys
import pytest
from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))
from app.main import app

client = TestClient(app)


def _get_auth_headers(mobile: str = "9988776655") -> dict:
    """Registers and verifies a test user to obtain Bearer auth headers."""
    client.post("/api/auth/register", json={
        "name": "ML Test User",
        "mobile_number": mobile,
        "sex": "female",
        "age": 30
    })
    res = client.post("/api/auth/verify-otp", json={
        "mobile_number": mobile,
        "otp": "123456"
    })
    if res.status_code == 200:
        token = res.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    return {}


def _create_test_image_bytes(rgba: bool = False) -> bytes:
    """Helper to generate in-memory test image bytes."""
    mode = "RGBA" if rgba else "RGB"
    color = (180, 90, 100, 255) if rgba else (180, 90, 100)
    img = Image.new(mode, (300, 300), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_root_and_health_endpoint():
    """Test root and health check endpoints."""
    res_root = client.get("/")
    assert res_root.status_code == 200

    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    data = res_health.json()
    assert data["status"] == "healthy"
    assert "Arogya Lens" in data["service"]

    res_alias = client.get("/health")
    assert res_alias.status_code == 200


def test_analyze_endpoint_valid_image():
    """Test POST /api/screenings/analyze with valid image."""
    headers = _get_auth_headers("9988776651")
    img_bytes = _create_test_image_bytes(rgba=True)
    response = client.post(
        "/api/screenings/analyze",
        headers=headers,
        files={"image": ("test_eye.png", img_bytes, "image/png")}
    )
    assert response.status_code == 201
    data = response.json()

    # Validate API Contract fields
    assert "id" in data
    assert "estimated_hb" in data
    assert "confidence" in data
    assert "status" in data
    assert "image_quality" in data


def test_analyze_endpoint_invalid_file_type():
    """Test error handling for non-image file upload."""
    headers = _get_auth_headers("9988776652")
    response = client.post(
        "/api/screenings/analyze",
        headers=headers,
        files={"image": ("document.txt", b"plain text content", "text/plain")}
    )
    assert response.status_code == 415 or response.status_code == 400
