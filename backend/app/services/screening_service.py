from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.database.models import User, Screening, ScreeningSymptom
from app.utils.datetime_utils import get_current_date, get_current_time
from app.utils.validation import (
    validate_image_file,
    generate_safe_filepath,
    validate_symptoms_list,
    SYMPTOM_TRANSLATIONS,
)
from app.services.prediction_service import predict_multisite_hb, predict_hb
from app.schemas.symptom import (
    AddSymptomsRequest,
    BilingualSymptomItem,
    ScreeningSymptomsListResponse,
)
from app.schemas.screening import (
    ScreeningResponse,
    ScreeningDetailResponse,
)


def format_bilingual_symptom(symptom: ScreeningSymptom) -> BilingualSymptomItem:
    """
    Translates a symptom record into its localized English and Hindi labels.
    """
    translations = SYMPTOM_TRANSLATIONS.get(
        symptom.symptom_name,
        {
            "en": symptom.symptom_name.replace("_", " ").capitalize(),
            "hi": symptom.symptom_name,
        },
    )
    return BilingualSymptomItem(
        id=symptom.id,
        symptom_name=symptom.symptom_name,
        custom_symptom=symptom.custom_symptom,
        label_en=translations["en"],
        label_hi=translations["hi"],
        created_at=symptom.created_at,
    )


async def _save_upload_file(user_id: int, file: UploadFile, default_name: str) -> tuple[str, str]:
    """Helper to validate and write upload file bytes returning (dest_path, relative_path)."""
    content = await file.read()
    validate_image_file(file, content)
    dest_path, relative_path = generate_safe_filepath(user_id, file.filename or default_name)
    dest_path.write_bytes(content)
    return str(dest_path), relative_path


async def analyze_screening_images(
    db: Session,
    user: User,
    left_eye: Optional[UploadFile] = None,
    right_eye: Optional[UploadFile] = None,
    left_thumb: Optional[UploadFile] = None,
    right_thumb: Optional[UploadFile] = None,
    single_image: Optional[UploadFile] = None,
) -> ScreeningResponse:
    """
    Validates uploaded photos (Bilateral Eyes + Bilateral Thumbs), saves them to user directory,
    executes multi-site AI biomarker prediction, and persists the screening record in SQLite.
    """
    left_eye_dest, left_eye_rel = None, None
    right_eye_dest, right_eye_rel = None, None
    left_thumb_dest, left_thumb_rel = None, None
    right_thumb_dest, right_thumb_rel = None, None
    primary_image_rel = None

    if left_eye:
        left_eye_dest, left_eye_rel = await _save_upload_file(user.id, left_eye, "left_eye.jpg")
        primary_image_rel = left_eye_rel
    if right_eye:
        right_eye_dest, right_eye_rel = await _save_upload_file(user.id, right_eye, "right_eye.jpg")
        if not primary_image_rel:
            primary_image_rel = right_eye_rel
    if left_thumb:
        left_thumb_dest, left_thumb_rel = await _save_upload_file(user.id, left_thumb, "left_thumb.jpg")
        if not primary_image_rel:
            primary_image_rel = left_thumb_rel
    if right_thumb:
        right_thumb_dest, right_thumb_rel = await _save_upload_file(user.id, right_thumb, "right_thumb.jpg")
        if not primary_image_rel:
            primary_image_rel = right_thumb_rel

    # Single image fallback
    if single_image and not any([left_eye, right_eye, left_thumb, right_thumb]):
        dest, rel = await _save_upload_file(user.id, single_image, "eye.jpg")
        left_eye_dest, left_eye_rel = dest, rel
        primary_image_rel = rel

    if not any([left_eye_dest, right_eye_dest, left_thumb_dest, right_thumb_dest]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one valid scan image (left_eye, right_eye, left_thumb, right_thumb, or image) is required.",
        )

    user_age = user.profile.age if user.profile else None
    user_sex = user.profile.sex.value if user.profile and hasattr(user.profile.sex, "value") else (user.profile.sex if user.profile else None)

    prediction = predict_multisite_hb(
        left_eye_path=left_eye_dest,
        right_eye_path=right_eye_dest,
        left_thumb_path=left_thumb_dest,
        right_thumb_path=right_thumb_dest,
        age=user_age,
        sex=user_sex,
    )

    screening = Screening(
        user_id=user.id,
        checkup_date=get_current_date(),
        checkup_time=get_current_time(),
        estimated_hb=prediction.get("estimated_hb"),
        confidence=prediction.get("confidence"),
        status=prediction.get("status"),
        image_path=primary_image_rel,
        left_eye_image_path=left_eye_rel,
        right_eye_image_path=right_eye_rel,
        left_thumb_image_path=left_thumb_rel,
        right_thumb_image_path=right_thumb_rel,
        image_quality=prediction.get("image_quality", "good"),
    )
    db.add(screening)
    db.commit()
    db.refresh(screening)

    response = ScreeningResponse.model_validate(screening)
    response.metrics = prediction.get("metrics")
    return response


# Alias for single image backward compatibility
async def analyze_eye_image(
    db: Session,
    user: User,
    file: UploadFile,
) -> ScreeningResponse:
    return await analyze_screening_images(db=db, user=user, single_image=file)


def get_screening_by_id(
    db: Session,
    user: User,
    screening_id: int,
) -> ScreeningDetailResponse:
    """
    Retrieves a single screening record with ownership verification.
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening record not found",
        )

    if screening.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this screening record",
        )

    bilingual_symptoms = [format_bilingual_symptom(s) for s in screening.symptoms]

    return ScreeningDetailResponse(
        id=screening.id,
        user_id=screening.user_id,
        checkup_date=screening.checkup_date,
        checkup_time=screening.checkup_time,
        estimated_hb=screening.estimated_hb,
        confidence=screening.confidence,
        status=screening.status,
        image_path=screening.image_path,
        left_eye_image_path=screening.left_eye_image_path,
        right_eye_image_path=screening.right_eye_image_path,
        left_thumb_image_path=screening.left_thumb_image_path,
        right_thumb_image_path=screening.right_thumb_image_path,
        image_quality=screening.image_quality,
        created_at=screening.created_at,
        symptoms=bilingual_symptoms,
    )


def add_screening_symptoms(
    db: Session,
    user: User,
    screening_id: int,
    payload: AddSymptomsRequest,
) -> ScreeningSymptomsListResponse:
    """
    Adds user-reported symptoms to an existing screening record.
    Enforces ownership validation.
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening record not found",
        )

    if screening.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to add symptoms to this screening",
        )

    symptoms_dict = [
        {"symptom_name": s.symptom_name.value if hasattr(s.symptom_name, "value") else str(s.symptom_name)}
        for s in payload.symptoms
    ]
    validate_symptoms_list(symptoms_dict)

    created_symptoms: List[ScreeningSymptom] = []
    for s_input in payload.symptoms:
        s_name = s_input.symptom_name.value if hasattr(s_input.symptom_name, "value") else str(s_input.symptom_name)
        symptom = ScreeningSymptom(
            screening_id=screening.id,
            symptom_name=s_name,
            custom_symptom=s_input.custom_symptom if s_name == "other" else None,
        )
        db.add(symptom)
        created_symptoms.append(symptom)

    db.commit()
    for s in created_symptoms:
        db.refresh(s)

    bilingual_list = [format_bilingual_symptom(s) for s in created_symptoms]
    return ScreeningSymptomsListResponse(
        screening_id=screening.id,
        symptoms=bilingual_list,
    )


def get_screening_symptoms(
    db: Session,
    user: User,
    screening_id: int,
) -> ScreeningSymptomsListResponse:
    """
    Fetches all symptoms for a given screening with bilingual translations.
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening record not found",
        )

    if screening.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view symptoms for this screening",
        )

    bilingual_list = [format_bilingual_symptom(s) for s in screening.symptoms]
    return ScreeningSymptomsListResponse(
        screening_id=screening.id,
        symptoms=bilingual_list,
    )
