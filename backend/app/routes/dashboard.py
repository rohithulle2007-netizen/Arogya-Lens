from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User
from app.core.security import get_current_user
from app.schemas.dashboard import (
    DashboardResponse,
    TrendPointResponse,
)
from app.services.dashboard_service import (
    get_user_dashboard,
    get_user_trend,
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get(
    "",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user dashboard metrics and recent screenings",
)
def get_dashboard_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns aggregated metrics, risk category counts, average Hb,
    and up to 5 most recent screening records for the authenticated user.
    """
    return get_user_dashboard(db, current_user)


@router.get(
    "/trend",
    response_model=List[TrendPointResponse],
    status_code=status.HTTP_200_OK,
    summary="Get chronological Hb trend data for charts",
)
def get_trend_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns chronological (oldest to newest) Hb estimation datapoints
    for rendering progress charts on the frontend.
    """
    return get_user_trend(db, current_user)
