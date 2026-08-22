import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.config import settings
from app.database.connection import init_db
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.profile import router as profile_router
from app.routes.screenings import router as screenings_router
from app.routes.history import router as history_router
from app.routes.dashboard import router as dashboard_router

# Setup logger
logger = logging.getLogger("arogya_lens")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Initializes database tables on application startup.
    """
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Arogya Lens - Non-invasive smartphone-based anaemia screening platform API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS for development & frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handlers (Prevent stack trace leakages)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": jsonable_encoder(exc.errors())},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please try again later."},
    )


# Include API Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(profile_router)
app.include_router(screenings_router)
app.include_router(history_router)
app.include_router(dashboard_router)


@app.get("/", tags=["Root"])
def read_root():
    """
    Root endpoint providing service information and links to documentation.
    """
    return {
        "message": "Welcome to Arogya Lens API",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/api/health",
    }


@app.get("/api/health", tags=["Health"])
@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint returning service health status.
    """
    return {
        "status": "healthy",
        "service": "Arogya Lens API",
        "version": "1.0.0",
    }
