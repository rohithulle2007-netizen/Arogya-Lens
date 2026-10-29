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
