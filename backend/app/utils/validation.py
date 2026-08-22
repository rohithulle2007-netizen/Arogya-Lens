import os
import uuid
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings
from app.database.models import SymptomEnum

# Image constraints
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Centralized English / Hindi Symptom Translations
SYMPTOM_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    SymptomEnum.FATIGUE.value: {
        "en": "Fatigue / Weakness",
        "hi": "थकान / कमजोरी",
    },
    SymptomEnum.DIZZINESS.value: {
        "en": "Dizziness / Lightheadedness",
        "hi": "चक्कर आना",
    },
    SymptomEnum.SHORTNESS_OF_BREATH.value: {
        "en": "Shortness of breath",
        "hi": "सांस फूलना",
    },
    SymptomEnum.RAPID_OR_IRREGULAR_HEARTBEAT.value: {
        "en": "Rapid or irregular heartbeat",
        "hi": "दिल की तेज या अनियमित धड़कन",
    },
    SymptomEnum.HEADACHE.value: {
        "en": "Headache",
        "hi": "सिरदर्द",
    },
    SymptomEnum.PALE_SKIN.value: {
        "en": "Pale skin",
        "hi": "त्वचा का पीलापन",
    },
    SymptomEnum.COLD_HANDS_FEET.value: {
        "en": "Cold hands and feet",
        "hi": "हाथ और पैर ठंडे रहना",
    },
    SymptomEnum.BRITTLE_NAILS.value: {
        "en": "Brittle nails",
        "hi": "नाखून टूटना / कमजोर नाखून",
    },
    SymptomEnum.POOR_APPETITE.value: {
        "en": "Poor appetite",
        "hi": "भूख कम लगना",
    },
    SymptomEnum.NONE.value: {
        "en": "No symptoms",
        "hi": "कोई लक्षण नहीं",
    },
    SymptomEnum.OTHER.value: {
        "en": "Other symptom",
        "hi": "अन्य लक्षण",
    },
}


def validate_image_file(file: UploadFile, content: bytes) -> str:
    """
    Validates uploaded image MIME type, file extension, and file size.
    Returns the sanitized file extension.
    """
    filename = file.filename or ""
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported MIME type '{file.content_type}'. Allowed types: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB",
        )

    return ext


def generate_safe_filepath(user_id: int, original_filename: str) -> Tuple[Path, str]:
    """
    Generates a unique, safe local filepath under uploads/{user_id}/.
    Creates user subdirectory if necessary.
    """
    ext = Path(original_filename).suffix.lower()
    base_stem = Path(original_filename).stem
    # Sanitize base stem
    sanitized_stem = re.sub(r"[^\w\-]", "_", base_stem)[:30]
    unique_filename = f"{uuid.uuid4().hex}_{sanitized_stem}{ext}"

    upload_dir = Path(settings.UPLOAD_DIR) / str(user_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    destination_path = upload_dir / unique_filename
    relative_path = f"{settings.UPLOAD_DIR}/{user_id}/{unique_filename}"
    return destination_path, relative_path


def validate_symptoms_list(symptoms_data: List[Dict[str, Any]]) -> None:
    """
    Validates symptom business rules:
    - 'none' cannot be combined with any other symptoms
    - Valid symptom enum names
    """
    if not symptoms_data:
        return

    symptom_names = [item.get("symptom_name") for item in symptoms_data]

    # Rule: 'none' cannot be combined with other symptoms
    if SymptomEnum.NONE.value in symptom_names and len(symptom_names) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="'none' cannot be combined with other symptoms",
        )
