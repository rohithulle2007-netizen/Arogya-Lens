from typing import List
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
from app.services.prediction_service import predict_hb
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


async def analyze_eye_image(
    db: Session,
    user: User,
    file: UploadFile,
) -> ScreeningResponse:
    """
    Validates uploaded eye photo, saves to user upload folder,
    invokes the prediction service, and persists the screening record in SQLite.
    """
    content = await file.read()
    validate_image_file(file, content)

    dest_path, relative_path = generate_safe_filepath(user.id, file.filename or "eye.jpg")

    # Write file content safely using built-in pathlib
    dest_path.write_bytes(content)

    # Call prediction service with absolute image path and user demographics
    user_age = user.profile.age if user.profile else None
    user_sex = user.profile.sex.value if user.profile and hasattr(user.profile.sex, "value") else (user.profile.sex if user.profile else None)
    prediction = predict_hb(str(dest_path), age=user_age, sex=user_sex)

    screening = Screening(
        user_id=user.id,
        checkup_date=get_current_date(),
        checkup_time=get_current_time(),
        estimated_hb=prediction.get("estimated_hb"),
        confidence=prediction.get("confidence"),
        status=prediction.get("status"),
        image_path=relative_path,
        image_quality=prediction.get("image_quality"),
    )
    db.add(screening)
    db.commit()
    db.refresh(screening)

    return ScreeningResponse.model_validate(screening)


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

    # Convert payload to list of dicts for validation
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
