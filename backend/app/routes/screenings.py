from typing import Optional
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
    analyze_screening_images,
    get_screening_by_id,
    add_screening_symptoms,
    get_screening_symptoms,
)

router = APIRouter(prefix="/api/screenings", tags=["Screenings"])


@router.post(
    "/analyze",
    response_model=ScreeningResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload multi-site screening photos (Left/Right Eye + Left/Right Thumb) for Hb assessment",
)
async def analyze_screening_endpoint(
    left_eye: Optional[UploadFile] = File(None, description="Captured Left Eye conjunctiva image"),
    right_eye: Optional[UploadFile] = File(None, description="Captured Right Eye conjunctiva image"),
    left_thumb: Optional[UploadFile] = File(None, description="Captured Left Thumb nail bed image"),
    right_thumb: Optional[UploadFile] = File(None, description="Captured Right Thumb nail bed image"),
    image: Optional[UploadFile] = File(None, description="Single scan fallback image"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Receives captured scan images via multipart/form-data for bilateral eyes and bilateral thumbs.
    Validates MIME type/size, extracts multi-site optical biomarkers, runs ensemble Hb prediction,
    and persists the complete screening record in SQLite.
    """
    return await analyze_screening_images(
        db=db,
        user=current_user,
        left_eye=left_eye,
        right_eye=right_eye,
        left_thumb=left_thumb,
        right_thumb=right_thumb,
        single_image=image,
    )


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
    Retrieves complete screening details for the owner.
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
    return get_screening_symptoms(db, current_user, screening_id)
