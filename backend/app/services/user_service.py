from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.database.models import User, Profile
from app.schemas.user import UserProfileResponse, UpdateProfileRequest


def get_user_profile(user: User) -> UserProfileResponse:
    """
    Retrieves user profile details for the authenticated user.
    """
    if not user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this user",
        )

    return UserProfileResponse(
        id=user.id,
        name=user.profile.name,
        mobile_number=user.mobile_number,
        age=user.profile.age,
        sex=user.profile.sex,
        created_at=user.profile.created_at,
    )


def update_user_profile(
    db: Session,
    user: User,
    data: UpdateProfileRequest,
) -> UserProfileResponse:
    """
    Updates mutable profile fields (name, age, sex) for the authenticated user.
    Mobile number modification is strictly prohibited.
    """
    if not user.profile:
        # If user somehow doesn't have a profile yet, initialize one
        profile = Profile(
            user_id=user.id,
            name=data.name or "User",
            age=data.age or 25,
            sex=data.sex.value if data.sex else "prefer_not_to_say",
        )
        db.add(profile)
        db.commit()
        db.refresh(user)
    else:
        profile = user.profile
        if data.name is not None:
            profile.name = data.name
        if data.age is not None:
            profile.age = data.age
        if data.sex is not None:
            profile.sex = data.sex.value if hasattr(data.sex, "value") else str(data.sex)
        db.commit()
        db.refresh(profile)

    return UserProfileResponse(
        id=user.id,
        name=user.profile.name,
        mobile_number=user.mobile_number,
        age=user.profile.age,
        sex=user.profile.sex,
        created_at=user.profile.created_at,
    )
