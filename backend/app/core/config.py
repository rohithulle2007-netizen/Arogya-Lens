import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root (backend/) if it exists
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BASE_DIR.parent if BASE_DIR.name == "backend" else BASE_DIR

env_path = BASE_DIR / ".env"
if not env_path.exists():
    env_path = PROJECT_ROOT / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings:
    """
    Application Settings loaded from environment variables.
    """
    APP_NAME: str = os.getenv("APP_NAME", "Arogya Lens API")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{PROJECT_ROOT / 'arogya_lens.db'}")
    SECRET_KEY: str = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET_KEY") or "arogya_lens_secure_super_secret_jwt_key_2026_x9#k"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    OTP_EXPIRE_MINUTES: int = int(os.getenv("OTP_EXPIRE_MINUTES", "5"))
    OTP_COOLDOWN_SECONDS: int = int(os.getenv("OTP_COOLDOWN_SECONDS", "30"))
    OTP_MAX_ATTEMPTS: int = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).lower()

    # External SMS Provider Credentials (optional)
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_FROM_NUMBER: str = os.getenv("TWILIO_FROM_NUMBER", "")
    FAST2SMS_API_KEY: str = os.getenv("FAST2SMS_API_KEY", "")

    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(PROJECT_ROOT / "uploads"))
    
    # Process allowed origins for CORS
    _raw_origins = os.getenv(
        "ALLOWED_ORIGINS",
        "https://rohithulle2007-netizen.github.io,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000,http://localhost,http://127.0.0.1"
    )
    ALLOWED_ORIGINS: list[str] = [
        origin.strip() for origin in _raw_origins.split(",") if origin.strip()
    ]


settings = Settings()

