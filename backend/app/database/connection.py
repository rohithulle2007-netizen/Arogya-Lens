from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.database.base import Base

# Configure SQLite specific options
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    # Ensure parent directory exists for SQLite database file
    db_file = settings.DATABASE_URL.replace("sqlite:///", "")
    if db_file and not db_file.startswith(":memory:"):
        from pathlib import Path
        try:
            Path(db_file).parent.mkdir(parents=True, exist_ok=True)
        except Exception:
            pass

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

# Create sessionmaker factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session per request.
    Ensures the session is cleanly closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initializes the database schema by creating all tables defined in models
    and safely running SQLite column migrations.
    """
    import app.database.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Safe lightweight SQLite migration for new multi-site columns
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                res = conn.execute(text("PRAGMA table_info(screenings)"))
                columns = [row[1] for row in res.fetchall()]
                new_cols = [
                    ("left_eye_image_path", "VARCHAR(500)"),
                    ("right_eye_image_path", "VARCHAR(500)"),
                    ("left_thumb_image_path", "VARCHAR(500)"),
                    ("right_thumb_image_path", "VARCHAR(500)"),
                ]
                for col_name, col_type in new_cols:
                    if col_name not in columns:
                        conn.execute(text(f"ALTER TABLE screenings ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception as e:
                print(f"Notice: database column sync ({e})")
