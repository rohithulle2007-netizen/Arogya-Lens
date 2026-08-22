from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.database.models import User, Screening
from app.services.screening_service import format_bilingual_symptom
from app.schemas.screening import (
    HistoryItemResponse,
    ScreeningDetailResponse,
    UserSummaryResponse,
)


def get_user_history(
    db: Session,
    user: User,
) -> List[HistoryItemResponse]:
    """
    Returns the authenticated user's complete screening history, sorted newest first.
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

    history_items: List[HistoryItemResponse] = []
    for s in screenings:
        bilingual_symptoms = [format_bilingual_symptom(sym) for sym in s.symptoms]
        history_items.append(
            HistoryItemResponse(
                screening_id=s.id,
                date=s.checkup_date,
                time=s.checkup_time,
                estimated_hb=s.estimated_hb,
                confidence=s.confidence,
                status=s.status,
                image_quality=s.image_quality,
                created_at=s.created_at,
                symptoms=bilingual_symptoms,
            )
        )
    return history_items


def get_history_detail(
    db: Session,
    user: User,
    screening_id: int,
) -> ScreeningDetailResponse:
    """
    Retrieves a single historical screening record for the authenticated user.
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Historical screening record not found",
        )

    if screening.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this screening record",
        )

    bilingual_symptoms = [format_bilingual_symptom(sym) for sym in screening.symptoms]
    return ScreeningDetailResponse(
        id=screening.id,
        user_id=screening.user_id,
        checkup_date=screening.checkup_date,
        checkup_time=screening.checkup_time,
        estimated_hb=screening.estimated_hb,
        confidence=screening.confidence,
        status=screening.status,
        image_path=screening.image_path,
        image_quality=screening.image_quality,
        created_at=screening.created_at,
        symptoms=bilingual_symptoms,
    )


def get_user_summary(
    db: Session,
    user: User,
) -> UserSummaryResponse:
    """
    Calculates analytical patient metrics and Hb trajectory across all checkups.
    Returns sensible default null/zero metrics if no screenings exist.
    """
    # Fetch in chronological order (oldest to newest)
    screenings = (
        db.query(Screening)
        .filter(Screening.user_id == user.id)
        .order_by(
            Screening.checkup_date.asc(),
            Screening.checkup_time.asc(),
            Screening.id.asc(),
        )
        .all()
    )

    if not screenings:
        return UserSummaryResponse(
            total_screenings=0,
            first_screening_date=None,
            latest_screening_date=None,
            latest_estimated_hb=None,
            previous_estimated_hb=None,
            average_estimated_hb=None,
            minimum_estimated_hb=None,
            maximum_estimated_hb=None,
            change_from_previous=None,
            latest_confidence=None,
            latest_status=None,
        )

    total_screenings = len(screenings)
    first_screening = screenings[0]
    latest_screening = screenings[-1]

    # Non-null Hb values
    hb_values = [s.estimated_hb for s in screenings if s.estimated_hb is not None]

    average_hb: Optional[float] = None
    min_hb: Optional[float] = None
    max_hb: Optional[float] = None
    if hb_values:
        average_hb = round(sum(hb_values) / len(hb_values), 2)
        min_hb = min(hb_values)
        max_hb = max(hb_values)

    previous_hb: Optional[float] = None
    if total_screenings >= 2:
        previous_hb = screenings[-2].estimated_hb

    change_from_prev: Optional[float] = None
    if latest_screening.estimated_hb is not None and previous_hb is not None:
        change_from_prev = round(latest_screening.estimated_hb - previous_hb, 2)

    return UserSummaryResponse(
        total_screenings=total_screenings,
        first_screening_date=first_screening.checkup_date,
        latest_screening_date=latest_screening.checkup_date,
        latest_estimated_hb=latest_screening.estimated_hb,
        previous_estimated_hb=previous_hb,
        average_estimated_hb=average_hb,
        minimum_estimated_hb=min_hb,
        maximum_estimated_hb=max_hb,
        change_from_previous=change_from_prev,
        latest_confidence=latest_screening.confidence,
        latest_status=latest_screening.status,
    )
