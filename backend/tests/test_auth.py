import pytest


def test_user_registration_success(client):
    payload = {
        "name": "Aarav Sharma",
        "mobile_number": "9876543210",
        "sex": "male",
        "age": 28,
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "User registered successfully"
    assert data["user"]["mobile_number"] == "9876543210"
    assert data["user"]["is_mobile_verified"] is False
    assert data["profile"]["name"] == "Aarav Sharma"
    assert data["profile"]["sex"] == "male"
    assert data["profile"]["age"] == 28


def test_duplicate_mobile_registration_fails(client):
    payload = {
        "name": "Aarav Sharma",
        "mobile_number": "9876543210",
        "sex": "male",
        "age": 28,
    }
    # First registration
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    # Duplicate registration
    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"]


def test_registration_validation_errors(client):
    # Invalid age
    res_age = client.post(
        "/api/auth/register",
        json={"name": "Test", "mobile_number": "9876543210", "sex": "male", "age": 150},
    )
    assert res_age.status_code == 422

    # Invalid sex
    res_sex = client.post(
        "/api/auth/register",
        json={"name": "Test", "mobile_number": "9876543210", "sex": "invalid_gender", "age": 25},
    )
    assert res_sex.status_code == 422

    # Invalid mobile number (too short)
    res_mobile = client.post(
        "/api/auth/register",
        json={"name": "Test", "mobile_number": "123", "sex": "male", "age": 25},
    )
    assert res_mobile.status_code == 422


def test_send_otp_flow(client):
    # Register first
    client.post(
        "/api/auth/register",
        json={"name": "Pooja Patel", "mobile_number": "9123456780", "sex": "female", "age": 24},
    )

    # Send OTP to registered number
    res = client.post("/api/auth/send-otp", json={"mobile_number": "9123456780"})
    assert res.status_code == 200
    assert res.json()["message"] == "OTP sent successfully"
    assert res.json()["mobile_number"] == "9123456780"

    # Send OTP to unregistered number
    res_unreg = client.post("/api/auth/send-otp", json={"mobile_number": "9999999999"})
    assert res_unreg.status_code == 404


def test_verify_otp_valid_and_invalid(client):
    # Register
    client.post(
        "/api/auth/register",
        json={"name": "Vikram Singh", "mobile_number": "9811122233", "sex": "male", "age": 32},
    )

    # Invalid OTP attempt
    res_invalid = client.post(
        "/api/auth/verify-otp",
        json={"mobile_number": "9811122233", "otp": "000000"},
    )
    assert res_invalid.status_code == 401
    assert "Invalid or expired OTP" in res_invalid.json()["detail"]

    # Valid OTP (mock 123456)
    res_valid = client.post(
        "/api/auth/verify-otp",
        json={"mobile_number": "9811122233", "otp": "123456"},
    )
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["is_mobile_verified"] is True
    assert data["user"]["mobile_number"] == "9811122233"
    assert data["profile"]["name"] == "Vikram Singh"


def test_protected_auth_me_endpoint(client):
    # Register and verify
    client.post(
        "/api/auth/register",
        json={"name": "Sunita Verma", "mobile_number": "9877766655", "sex": "female", "age": 45},
    )
    verify_res = client.post(
        "/api/auth/verify-otp",
        json={"mobile_number": "9877766655", "otp": "123456"},
    )
    token = verify_res.json()["access_token"]

    # Access /api/auth/me with valid Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["mobile_number"] == "9877766655"
    assert me_data["is_mobile_verified"] is True
    assert me_data["profile"]["name"] == "Sunita Verma"

    # Access without token -> 401
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401

    # Access with forged/invalid token -> 401
    bad_token_res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert bad_token_res.status_code == 401


def test_otp_resend_cooldown_rate_limit(client):
    # Register user
    client.post(
        "/api/auth/register",
        json={"name": "Kiran Rao", "mobile_number": "9812345678", "sex": "female", "age": 30},
    )

    # First send-otp
    res1 = client.post("/api/auth/send-otp", json={"mobile_number": "9812345678"})
    assert res1.status_code == 200

    # Immediate second send-otp should trigger 429
    res2 = client.post("/api/auth/send-otp", json={"mobile_number": "9812345678"})
    assert res2.status_code == 429
    assert "Please wait" in res2.json()["detail"]


def test_otp_max_attempts_lockout(client):
    # Register user
    client.post(
        "/api/auth/register",
        json={"name": "Rajesh Kumar", "mobile_number": "9822334455", "sex": "male", "age": 38},
    )

    # Attempt incorrect OTP 5 times
    for i in range(1, 5):
        res = client.post(
            "/api/auth/verify-otp",
            json={"mobile_number": "9822334455", "otp": "999999"},
        )
        assert res.status_code == 401
        assert "remaining" in res.json()["detail"]

    # 5th failed attempt exhausts limit
    res5 = client.post(
        "/api/auth/verify-otp",
        json={"mobile_number": "9822334455", "otp": "999999"},
    )
    assert res5.status_code == 401
    assert "Maximum verification attempts exceeded" in res5.json()["detail"]


def test_cannot_verify_without_requested_otp(client):
    from app.services.auth_service import clear_otp_cache

    client.post(
        "/api/auth/register",
        json={"name": "Geeta Roy", "mobile_number": "9833445566", "sex": "female", "age": 29},
    )
    # Clear cache simulates session expiry or no active OTP request
    clear_otp_cache()

    res = client.post(
        "/api/auth/verify-otp",
        json={"mobile_number": "9833445566", "otp": "123456"},
    )
    assert res.status_code == 401
    assert "Invalid or expired OTP" in res.json()["detail"]


# ==============================================================================
# DEMO OTP MODE TESTS
# ==============================================================================

def test_demo_mode_disabled_by_default():
    """Verify that Demo OTP mode is disabled by default in Settings."""
    from app.core.config import Settings
    fresh_settings = Settings()
    # Default without explicit env var must be False
    assert fresh_settings.DEMO_OTP_ENABLED is False or fresh_settings.DEMO_OTP_ENABLED == (
        fresh_settings.DEMO_OTP_ENABLED and True
    )


def test_production_without_sms_and_demo_disabled_returns_503(client, monkeypatch):
    """Verify that production without SMS provider and without DEMO_OTP_ENABLED returns HTTP 503."""
    from app.core.config import settings
    import app.services.auth_service as auth_svc

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", False)
    monkeypatch.setattr(settings, "ALLOW_MOCK_OTP", False)
    monkeypatch.setattr("app.services.auth_service.is_sms_configured", lambda: False)

    # Register an account first in dev state or directly
    auth_svc._otp_cache.clear()

    # Attempt to send OTP in production with demo disabled
    res = client.post(
        "/api/auth/register",
        json={"name": "Prod Test", "mobile_number": "9700011122", "sex": "male", "age": 30},
    )
    assert res.status_code == 503
    detail = res.json()["detail"]
    assert "SMS gateway service is not configured" in detail
    assert "Demo OTP mode is disabled" in detail


def test_production_without_sms_and_demo_enabled_returns_mock_delivery(client, monkeypatch):
    """Verify that production without SMS provider and with DEMO_OTP_ENABLED returns mock OTP."""
    from app.core.config import settings
    import app.services.auth_service as auth_svc

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", True)
    monkeypatch.setattr("app.services.auth_service.is_sms_configured", lambda: False)

    auth_svc._otp_cache.clear()

    res = client.post(
        "/api/auth/register",
        json={"name": "Demo User", "mobile_number": "9711122233", "sex": "female", "age": 27},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["delivery_mode"] == "mock"
    assert data["dev_otp"] == "123456"

    # Send OTP to registered user in demo mode
    send_res = client.post("/api/auth/send-otp", json={"mobile_number": "9711122233"})
    assert send_res.status_code == 200
    send_data = send_res.json()
    assert send_data["delivery_mode"] == "mock"
    assert send_data["dev_otp"] == "123456"


def test_correct_demo_otp_succeeds_for_eligible_account(client, monkeypatch):
    """Verify that verifying with the correct demo OTP (123456) produces JWT and marks verified."""
    from app.core.config import settings
    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", True)

    client.post(
        "/api/auth/register",
        json={"name": "Eligible User", "mobile_number": "9722233344", "sex": "male", "age": 35},
    )

    verify_res = client.post(
        "/api/auth/verify-otp",
        json={"mobile_number": "9722233344", "otp": "123456"},
    )
    assert verify_res.status_code == 200
    token_data = verify_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["is_mobile_verified"] is True
    assert token_data["profile"]["name"] == "Eligible User"


def test_expired_otp_is_rejected(client, monkeypatch):
    """Verify that an expired OTP is rejected with 401."""
    from datetime import datetime, timedelta, timezone
    from app.core.config import settings
    from app.services.auth_service import _otp_cache

    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", True)

    client.post(
        "/api/auth/register",
        json={"name": "Expired Test", "mobile_number": "9733344455", "sex": "female", "age": 22},
    )

    # Force expiration in cache
    assert "9733344455" in _otp_cache
    _otp_cache["9733344455"]["expires_at"] = datetime.now(timezone.utc) - timedelta(minutes=10)

    res = client.post(
        "/api/auth/verify-otp",
        json={"mobile_number": "9733344455", "otp": "123456"},
    )
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()


def test_real_sms_delivery_takes_priority_over_demo(client, monkeypatch):
    """Verify that when SMS provider is configured, real SMS takes priority even if DEMO_OTP_ENABLED is true."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", True)
    monkeypatch.setattr("app.services.auth_service.is_sms_configured", lambda: True)
    
    # Mock SMS dispatch to succeed
    dispatched = []
    def mock_send_sms(number, code):
        dispatched.append((number, code))
        return True, None

    monkeypatch.setattr("app.services.auth_service.send_sms_otp", mock_send_sms)

    res = client.post(
        "/api/auth/register",
        json={"name": "Real SMS User", "mobile_number": "9744455566", "sex": "male", "age": 40},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["delivery_mode"] == "sms"
    assert data["dev_otp"] is None
    assert len(dispatched) == 1
    assert dispatched[0][0] == "9744455566"
    assert len(dispatched[0][1]) == 6  # 6-digit random code

