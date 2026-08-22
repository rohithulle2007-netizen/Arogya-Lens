from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User
from app.core.security import get_current_user
from app.schemas.screening import (
    ScreeningResponse,
    ScreeningDetailResponse,
)
from app.schemas.symptom import (
    AddSymptomsRequest,
    ScreeningSymptomsListResponse,
)
from app.services.screening_service import (
    analyze_eye_image,
    get_screening_by_id,
    add_screening_symptoms,
    get_screening_symptoms,
)

router = APIRouter(prefix="/api/screenings", tags=["Screenings"])


@router.post(
    "/analyze",
    response_model=ScreeningResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload ocular image and receive non-invasive Hb assessment",
)
async def analyze_screening_endpoint(
    image: UploadFile = File(..., description="Captured conjunctiva/eye image file"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Receives captured eye photo via multipart/form-data.
    Validates MIME type/size, saves image, runs Hb prediction, and persists screening.
    Authenticated via JWT (user identity derived from token).
    """
    return await analyze_eye_image(db, current_user, image)


@router.get(
    "/{screening_id}",
    response_model=ScreeningDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get details for a specific screening",
)
def get_screening_detail_endpoint(
    screening_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves complete screening details and associated symptoms for the owner.
    """
    return get_screening_by_id(db, current_user, screening_id)


@router.post(
    "/{screening_id}/symptoms",
    response_model=ScreeningSymptomsListResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record user-reported symptoms for a screening",
)
def add_symptoms_endpoint(
    screening_id: int,
    payload: AddSymptomsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Associates user-reported symptoms with a specific screening record.
    Symptoms are user-reported informational signals and not diagnostic prescriptions.
    """
    return add_screening_symptoms(db, current_user, screening_id, payload)


@router.get(
    "/{screening_id}/symptoms",
    response_model=ScreeningSymptomsListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get symptoms with English and Hindi labels",
)
def get_symptoms_endpoint(
    screening_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns localized symptoms (English + Hindi) for a screening record.
    """
    return get_screening_symptoms(db, current_user, screening_id)
