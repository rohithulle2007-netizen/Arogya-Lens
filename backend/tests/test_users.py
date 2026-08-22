import pytest


def test_get_and_update_user_profile(client):
    # 1. Register User
    reg_res = client.post(
        "/api/auth/register",
        json={"name": "Karan Johar", "mobile_number": "9898989898", "sex": "male", "age": 30},
    )
    assert reg_res.status_code == 201

    # 2. Verify OTP and obtain JWT
    verify_res = client.post(
        "/api/auth/verify-otp",
        json={"mobile_number": "9898989898", "otp": "123456"},
    )
    assert verify_res.status_code == 200
    token = verify_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. GET /api/users/me
    profile_res = client.get("/api/users/me", headers=headers)
    assert profile_res.status_code == 200
    pdata = profile_res.json()
    assert pdata["name"] == "Karan Johar"
    assert pdata["mobile_number"] == "9898989898"
    assert pdata["age"] == 30
    assert pdata["sex"] == "male"
    assert "created_at" in pdata

    # 4. PUT /api/users/me (update profile fields)
    update_payload = {
        "name": "Karan K. Johar",
        "age": 31,
        "sex": "prefer_not_to_say",
    }
    update_res = client.put("/api/users/me", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["name"] == "Karan K. Johar"
    assert updated_data["age"] == 31
    assert updated_data["sex"] == "prefer_not_to_say"
    # Mobile number must remain unchanged
    assert updated_data["mobile_number"] == "9898989898"

    # Verify updated values persist on subsequent GET
    get_again = client.get("/api/users/me", headers=headers)
    assert get_again.status_code == 200
    assert get_again.json()["name"] == "Karan K. Johar"
    assert get_again.json()["age"] == 31


def test_users_unauthorized_access(client):
    # Attempt GET /api/users/me without token
    res1 = client.get("/api/users/me")
    assert res1.status_code == 401
    assert "Authentication required" in res1.json()["detail"]

    # Attempt PUT /api/users/me without token
    res2 = client.put("/api/users/me", json={"name": "Hacker"})
    assert res2.status_code == 401

    # Attempt with malformed token
    res3 = client.get("/api/users/me", headers={"Authorization": "Bearer malformed_token"})
    assert res3.status_code == 401
