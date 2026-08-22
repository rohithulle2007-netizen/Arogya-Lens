import io
import pytest
from datetime import date, time
from app.database.models import User, Screening


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


def test_dashboard_with_zero_screenings(client):
    headers = get_authenticated_client(client, mobile="9888888881", name="Empty Dashboard User")

    res = client.get("/api/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_screenings"] == 0
    assert data["possible_anemia_count"] == 0
    assert data["high_risk_count"] == 0
    assert data["low_confidence_count"] == 0
    assert data["average_estimated_hb"] is None
    assert data["latest_screening"] is None
    assert data["recent_screenings"] == []


def test_dashboard_aggregation_and_5_limit(client, db_session):
    headers = get_authenticated_client(client, mobile="9888888882", name="Active Dashboard User")
    user = db_session.query(User).filter(User.mobile_number == "9888888882").first()

    # Insert 7 screenings to test the 5-item recent limit
    t = time(10, 0, 0)
    screenings_data = [
        (date(2026, 1, 10), 10.5, "high_risk", 0.90),
        (date(2026, 2, 15), 11.0, "possible_anemia", 0.85),
        (date(2026, 3, 20), 11.2, "possible_anemia", 0.86),
        (date(2026, 4, 25), 11.5, "possible_anemia", 0.88),
        (date(2026, 5, 30), 12.0, "low_confidence", 0.45),
        (date(2026, 6, 15), 12.2, "likely_normal", 0.91),
        (date(2026, 7, 20), 12.8, "likely_normal", 0.95),
    ]

    for d, hb, status, conf in screenings_data:
        s = Screening(
            user_id=user.id,
            checkup_date=d,
            checkup_time=t,
            estimated_hb=hb,
            confidence=conf,
            status=status,
            image_quality="good",
        )
        db_session.add(s)
    db_session.commit()

    res = client.get("/api/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total_screenings"] == 7
    assert data["high_risk_count"] == 1
    assert data["possible_anemia_count"] == 3
    assert data["low_confidence_count"] == 1

    # Total Hb: 10.5 + 11.0 + 11.2 + 11.5 + 12.0 + 12.2 + 12.8 = 81.2 / 7 = 11.60
    assert data["average_estimated_hb"] == 11.60

    # Recent screenings must contain max 5 items
    assert len(data["recent_screenings"]) == 5

    # Most recent screening first (2026-07-20)
    assert data["recent_screenings"][0]["date"] == "2026-07-20"
    assert data["recent_screenings"][0]["estimated_hb"] == 12.8
    assert data["latest_screening"]["date"] == "2026-07-20"
    assert data["latest_screening"]["estimated_hb"] == 12.8


def test_dashboard_trend_chronological_order(client, db_session):
    headers = get_authenticated_client(client, mobile="9888888883", name="Trend User")
    user = db_session.query(User).filter(User.mobile_number == "9888888883").first()

    t = time(10, 0, 0)
    # Insert in random order to test chronological sorting in trend endpoint
    s1 = Screening(user_id=user.id, checkup_date=date(2026, 9, 5), checkup_time=t, estimated_hb=11.9, status="possible_anemia", image_quality="good")
    s2 = Screening(user_id=user.id, checkup_date=date(2026, 8, 21), checkup_time=t, estimated_hb=11.4, status="possible_anemia", image_quality="good")
    s3 = Screening(user_id=user.id, checkup_date=date(2026, 10, 20), checkup_time=t, estimated_hb=12.5, status="likely_normal", image_quality="good")
    db_session.add_all([s1, s2, s3])
    db_session.commit()

    res = client.get("/api/dashboard/trend", headers=headers)
    assert res.status_code == 200
    trend = res.json()

    assert len(trend) == 3
    # Chronological: 2026-08-21 (11.4) -> 2026-09-05 (11.9) -> 2026-10-20 (12.5)
    assert trend[0]["date"] == "2026-08-21"
    assert trend[0]["estimated_hb"] == 11.4
    assert trend[1]["date"] == "2026-09-05"
    assert trend[1]["estimated_hb"] == 11.9
    assert trend[2]["date"] == "2026-10-20"
    assert trend[2]["estimated_hb"] == 12.5


def test_dashboard_user_isolation(client, db_session):
    headers_user1 = get_authenticated_client(client, mobile="9888888884", name="User Isolated 1")
    headers_user2 = get_authenticated_client(client, mobile="9888888885", name="User Isolated 2")

    user1 = db_session.query(User).filter(User.mobile_number == "9888888884").first()
    t = time(10, 0, 0)
    s1 = Screening(user_id=user1.id, checkup_date=date(2026, 8, 21), checkup_time=t, estimated_hb=11.4, status="possible_anemia", image_quality="good")
    db_session.add(s1)
    db_session.commit()

    # User 1 dashboard has 1 screening
    res1 = client.get("/api/dashboard", headers=headers_user1)
    assert res1.json()["total_screenings"] == 1

    # User 2 dashboard has 0 screenings
    res2 = client.get("/api/dashboard", headers=headers_user2)
    assert res2.json()["total_screenings"] == 0

    # User 2 trend is empty
    trend2 = client.get("/api/dashboard/trend", headers=headers_user2)
    assert trend2.json() == []


def test_dashboard_unauthorized_access(client):
    res = client.get("/api/dashboard")
    assert res.status_code == 401

    res_trend = client.get("/api/dashboard/trend")
    assert res_trend.status_code == 401
