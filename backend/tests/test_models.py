from datetime import date, time
from sqlalchemy import inspect
from app.database.models import (
    User,
    Profile,
    Screening,
    ScreeningSymptom,
    SexEnum,
    ScreeningStatusEnum,
    ImageQualityEnum,
    SymptomEnum,
)


def test_table_names(db_session):
    inspector = inspect(db_session.bind)
    table_names = inspector.get_table_names()
    assert "users" in table_names
    assert "profiles" in table_names
    assert "screenings" in table_names
    assert "screening_symptoms" in table_names


def test_user_and_profile_relationship(db_session):
    user = User(
        mobile_number="9876543210",
        is_mobile_verified=True,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.mobile_number == "9876543210"

    profile = Profile(
        user_id=user.id,
        name="Rahul Sharma",
        age=28,
        sex=SexEnum.MALE.value,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    assert profile.id is not None
    assert user.profile is not None
    assert user.profile.name == "Rahul Sharma"
    assert profile.user.mobile_number == "9876543210"


def test_screening_and_symptoms_relationship(db_session):
    user = User(mobile_number="9123456780")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    screening = Screening(
        user_id=user.id,
        checkup_date=date.today(),
        checkup_time=time(14, 30, 0),
        estimated_hb=12.4,
        confidence=0.92,
        status=ScreeningStatusEnum.LIKELY_NORMAL.value,
        image_path="uploads/screening_1.jpg",
        image_quality=ImageQualityEnum.GOOD.value,
    )
    db_session.add(screening)
    db_session.commit()
    db_session.refresh(screening)

    assert screening.id is not None
    assert screening.estimated_hb == 12.4
    assert screening.status == "likely_normal"

    symptom1 = ScreeningSymptom(
        screening_id=screening.id,
        symptom_name=SymptomEnum.FATIGUE.value,
    )
    symptom2 = ScreeningSymptom(
        screening_id=screening.id,
        symptom_name=SymptomEnum.OTHER.value,
        custom_symptom="Mild leg cramps",
    )
    db_session.add_all([symptom1, symptom2])
    db_session.commit()
    db_session.refresh(screening)

    assert len(screening.symptoms) == 2
    symptom_names = [s.symptom_name for s in screening.symptoms]
    assert "fatigue" in symptom_names
    assert "other" in symptom_names


def test_nullable_screening_fields(db_session):
    user = User(mobile_number="9998887776")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    screening = Screening(
        user_id=user.id,
        estimated_hb=None,
        confidence=None,
        image_path=None,
        status=ScreeningStatusEnum.IMAGE_QUALITY_FAILED.value,
        image_quality=ImageQualityEnum.FAILED.value,
    )
    db_session.add(screening)
    db_session.commit()
    db_session.refresh(screening)

    assert screening.id is not None
    assert screening.estimated_hb is None
    assert screening.confidence is None
    assert screening.image_path is None
    assert screening.status == "image_quality_failed"
    assert screening.image_quality == "failed"
