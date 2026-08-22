from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.models import User, Screening
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardScreeningItem,
    TrendPointResponse,
)


def get_user_dashboard(
    db: Session,
    user: User,
) -> DashboardResponse:
    """
    Aggregates overall screening counts, health risk metrics, average Hb,
    and returns up to 5 recent screenings for the authenticated user.
    """
    screenings = (
        db.query(Screening)
        .filter(Screening.user_id == user.id)
        .order_by(
            Screening.checkup_date.desc(),
            Screening.checkup_time.desc(),
            Screening.id.desc(),
        )
        .all()
    )

    total_screenings = len(screenings)
    if total_screenings == 0:
        return DashboardResponse(
            total_screenings=0,
            possible_anemia_count=0,
            high_risk_count=0,
            low_confidence_count=0,
            average_estimated_hb=None,
            latest_screening=None,
            recent_screenings=[],
        )

    possible_anemia_count = sum(1 for s in screenings if s.status == "possible_anemia")
    high_risk_count = sum(1 for s in screenings if s.status == "high_risk")
    low_confidence_count = sum(1 for s in screenings if s.status == "low_confidence")

    hb_values = [s.estimated_hb for s in screenings if s.estimated_hb is not None]
    average_hb: Optional[float] = None
    if hb_values:
        average_hb = round(sum(hb_values) / len(hb_values), 2)

    # Format up to 5 most recent screenings
    recent_items: List[DashboardScreeningItem] = []
    for s in screenings[:5]:
        recent_items.append(
            DashboardScreeningItem(
                screening_id=s.id,
                date=s.checkup_date,
                time=s.checkup_time,
                estimated_hb=s.estimated_hb,
                confidence=s.confidence,
                status=s.status,
            )
        )

    latest_item = recent_items[0] if recent_items else None

    return DashboardResponse(
        total_screenings=total_screenings,
        possible_anemia_count=possible_anemia_count,
        high_risk_count=high_risk_count,
        low_confidence_count=low_confidence_count,
        average_estimated_hb=average_hb,
        latest_screening=latest_item,
        recent_screenings=recent_items,
    )


def get_user_trend(
    db: Session,
    user: User,
) -> List[TrendPointResponse]:
    """
    Returns chronological (oldest to newest) Hb estimation datapoints
    for frontend line charts and progress visualizations.
    """
    screenings = (
        db.query(Screening)
        .filter(Screening.user_id == user.id, Screening.estimated_hb.isnot(None))
        .order_by(
            Screening.checkup_date.asc(),
            Screening.checkup_time.asc(),
            Screening.id.asc(),
        )
        .all()
    )

    trend_points: List[TrendPointResponse] = []
    for s in screenings:
        trend_points.append(
            TrendPointResponse(
                date=s.checkup_date,
                estimated_hb=s.estimated_hb,
            )
        )

    return trend_points
