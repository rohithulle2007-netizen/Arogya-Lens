import io
import pytest
from datetime import date, time
from app.database.models import Screening, User


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


def test_history_order_newest_first(client, db_session):
    headers = get_authenticated_client(client, mobile="9777777771", name="History User")

    # Upload 3 screenings via API
    files = {"image": ("eye.jpg", io.BytesIO(b"\xFF\xD8\xFF\xE0"), "image/jpeg")}
    s1 = client.post("/api/screenings/analyze", headers=headers, files=files).json()
    s2 = client.post("/api/screenings/analyze", headers=headers, files=files).json()
    s3 = client.post("/api/screenings/analyze", headers=headers, files=files).json()

    # Query history
    history_res = client.get("/api/history", headers=headers)
    assert history_res.status_code == 200
    items = history_res.json()
    assert len(items) == 3

    # Must be ordered newest first (s3, s2, s1)
    assert items[0]["screening_id"] == s3["id"]
    assert items[1]["screening_id"] == s2["id"]
    assert items[2]["screening_id"] == s1["id"]


def test_history_detail_endpoint(client):
    headers = get_authenticated_client(client, mobile="9777777772", name="Detail User")
    files = {"image": ("eye.jpg", io.BytesIO(b"\xFF\xD8\xFF\xE0"), "image/jpeg")}
    screening = client.post("/api/screenings/analyze", headers=headers, files=files).json()
    screening_id = screening["id"]

    res = client.get(f"/api/history/{screening_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == screening_id
    assert data["estimated_hb"] == 11.4
    assert data["status"] == "possible_anemia"


def test_no_delete_endpoint(client):
    headers = get_authenticated_client(client, mobile="9777777773", name="No Delete User")
    files = {"image": ("eye.jpg", io.BytesIO(b"\xFF\xD8\xFF\xE0"), "image/jpeg")}
    screening = client.post("/api/screenings/analyze", headers=headers, files=files).json()
    screening_id = screening["id"]

    # Attempt DELETE /api/history/{id}
    del_hist = client.delete(f"/api/history/{screening_id}", headers=headers)
    assert del_hist.status_code == 405  # Method Not Allowed

    # Attempt DELETE /api/screenings/{id}
    del_scr = client.delete(f"/api/screenings/{screening_id}", headers=headers)
    assert del_scr.status_code == 405  # Method Not Allowed


def test_user_summary_with_zero_screenings(client):
    headers = get_authenticated_client(client, mobile="9777777774", name="Zero User")

    res = client.get("/api/users/me/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_screenings"] == 0
    assert data["first_screening_date"] is None
    assert data["latest_screening_date"] is None
    assert data["latest_estimated_hb"] is None
    assert data["previous_estimated_hb"] is None
    assert data["average_estimated_hb"] is None
    assert data["minimum_estimated_hb"] is None
    assert data["maximum_estimated_hb"] is None
    assert data["change_from_previous"] is None


def test_user_summary_with_multiple_screenings(client, db_session):
    headers = get_authenticated_client(client, mobile="9777777775", name="Metrics User")

    # Get user object
    user = db_session.query(User).filter(User.mobile_number == "9777777775").first()

    # Manually insert 3 screenings on different dates with distinct Hb values
    # Example:
    # 21 Aug 2026 -> Hb 11.4
    # 05 Sep 2026 -> Hb 11.9
    # 20 Oct 2026 -> Hb 12.5
    d1 = date(2026, 8, 21)
    d2 = date(2026, 9, 5)
    d3 = date(2026, 10, 20)

    t = time(10, 30, 0)

    s1 = Screening(
        user_id=user.id,
        checkup_date=d1,
        checkup_time=t,
        estimated_hb=11.4,
        confidence=0.85,
        status="possible_anemia",
        image_quality="good",
    )
    s2 = Screening(
        user_id=user.id,
        checkup_date=d2,
        checkup_time=t,
        estimated_hb=11.9,
        confidence=0.88,
        status="possible_anemia",
        image_quality="good",
    )
    s3 = Screening(
        user_id=user.id,
        checkup_date=d3,
        checkup_time=t,
        estimated_hb=12.5,
        confidence=0.92,
        status="likely_normal",
        image_quality="good",
    )
    db_session.add_all([s1, s2, s3])
    db_session.commit()

    res = client.get("/api/users/me/summary", headers=headers)
    assert res.status_code == 200
    summary = res.json()

    assert summary["total_screenings"] == 3
    assert summary["first_screening_date"] == "2026-08-21"
    assert summary["latest_screening_date"] == "2026-10-20"
    assert summary["latest_estimated_hb"] == 12.5
    assert summary["previous_estimated_hb"] == 11.9
    assert summary["latest_confidence"] == 0.92
    assert summary["latest_status"] == "likely_normal"
    # Average: (11.4 + 11.9 + 12.5) / 3 = 35.8 / 3 = 11.93
    assert summary["average_estimated_hb"] == 11.93
    assert summary["minimum_estimated_hb"] == 11.4
    assert summary["maximum_estimated_hb"] == 12.5
    # Change from previous: 12.5 - 11.9 = 0.6
    assert summary["change_from_previous"] == 0.6
