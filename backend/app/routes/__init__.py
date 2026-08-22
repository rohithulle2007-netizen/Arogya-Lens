from .auth import router as auth_router
from .users import router as users_router
from .screenings import router as screenings_router
from .history import router as history_router
from .dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "users_router",
    "screenings_router",
    "history_router",
    "dashboard_router",
]
