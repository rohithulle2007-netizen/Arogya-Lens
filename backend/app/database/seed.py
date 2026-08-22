"""
Database Seeding Script for Arogya Lens.
Populates initial demo user, profile, historical screenings, and symptoms.

Usage:
    python -m app.database.seed
    or
    python app/database/seed.py
"""

import sys
from pathlib import Path
from datetime import date, time

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database.connection import SessionLocal, init_db
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


def seed_database() -> None:
    """Seeds demo user, profile, screenings, and symptoms."""
    print("Initializing database tables...")
    init_db()

    db = SessionLocal()
    try:
        demo_mobile = "9876543210"
        existing_user = db.query(User).filter(User.mobile_number == demo_mobile).first()
        if existing_user:
            print(f"Demo user with mobile {demo_mobile} already exists (ID: {existing_user.id}). Skipping seed.")
            return

        print(f"Creating demo user ({demo_mobile})...")
        user = User(
            mobile_number=demo_mobile,
            is_mobile_verified=True,
            is_active=True,
        )
        db.add(user)
        db.flush()

        profile = Profile(
            user_id=user.id,
            name="Aarav Sharma",
            age=28,
            sex=SexEnum.MALE.value,
        )
        db.add(profile)
        db.flush()

        print("Adding sample historical screenings...")
        s1 = Screening(
            user_id=user.id,
            checkup_date=date(2026, 8, 21),
            checkup_time=time(10, 30, 0),
            estimated_hb=11.4,
            confidence=0.86,
            status=ScreeningStatusEnum.POSSIBLE_ANEMIA.value,
            image_quality=ImageQualityEnum.GOOD.value,
            image_path=f"uploads/{user.id}/sample_eye_1.jpg",
        )
        s2 = Screening(
            user_id=user.id,
            checkup_date=date(2026, 9, 5),
            checkup_time=time(14, 15, 0),
            estimated_hb=11.9,
            confidence=0.89,
            status=ScreeningStatusEnum.POSSIBLE_ANEMIA.value,
            image_quality=ImageQualityEnum.GOOD.value,
            image_path=f"uploads/{user.id}/sample_eye_2.jpg",
        )
        s3 = Screening(
            user_id=user.id,
            checkup_date=date(2026, 10, 20),
            checkup_time=time(11, 45, 0),
            estimated_hb=12.6,
            confidence=0.93,
            status=ScreeningStatusEnum.LIKELY_NORMAL.value,
            image_quality=ImageQualityEnum.GOOD.value,
            image_path=f"uploads/{user.id}/sample_eye_3.jpg",
        )
        db.add_all([s1, s2, s3])
        db.flush()

        print("Adding user-reported symptoms...")
        sym1_1 = ScreeningSymptom(screening_id=s1.id, symptom_name=SymptomEnum.FATIGUE.value)
        sym1_2 = ScreeningSymptom(screening_id=s1.id, symptom_name=SymptomEnum.PALE_SKIN.value)
        sym1_3 = ScreeningSymptom(screening_id=s1.id, symptom_name=SymptomEnum.OTHER.value, custom_symptom="Occasional headache")

        sym2_1 = ScreeningSymptom(screening_id=s2.id, symptom_name=SymptomEnum.DIZZINESS.value)
        sym3_1 = ScreeningSymptom(screening_id=s3.id, symptom_name=SymptomEnum.NONE.value)

        db.add_all([sym1_1, sym1_2, sym1_3, sym2_1, sym3_1])
        db.commit()

        print("✓ Database successfully seeded with demo records:")
        print(f"   - User: {user.mobile_number} (ID: {user.id})")
        print(f"   - Profile: {profile.name}, Age {profile.age}, Sex {profile.sex}")
        print(f"   - Screenings: 3 records (Hb: 11.4 -> 11.9 -> 12.6)")
        print(f"   - Symptoms: 5 records")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
