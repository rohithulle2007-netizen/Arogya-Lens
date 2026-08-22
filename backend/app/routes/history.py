from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User
from app.core.security import get_current_user
from app.schemas.screening import (
    HistoryItemResponse,
    ScreeningDetailResponse,
)
from app.services.history_service import (
    get_user_history,
    get_history_detail,
)

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get(
    "",
    response_model=List[HistoryItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Get authenticated user's screening history",
)
def get_history_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns complete chronological screening history for the authenticated user,
    sorted newest first.
    """
    return get_user_history(db, current_user)


@router.get(
    "/{screening_id}",
    response_model=ScreeningDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single detailed historical screening record",
)
def get_history_detail_endpoint(
    screening_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns detailed information for a single historical screening.
    """
    return get_history_detail(db, current_user, screening_id)
