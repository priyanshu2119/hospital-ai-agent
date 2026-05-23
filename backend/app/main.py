"""
Hospital Appointment Assistant — Main FastAPI Application

Entry point for the backend API server. Configures:
  - CORS middleware for frontend communication
  - Database initialization and seed data loading
  - API router registration (appointments, triage, hospital)
  - Global exception handling
  - Health check endpoint

Uses modern FastAPI lifespan context manager instead of deprecated
@app.on_event("startup") / @app.on_event("shutdown") decorators.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from .config import settings
from .database import init_db, SessionLocal
from .routers import appointments_router, triage_router, hospital_router
from .seed_data import seed_database

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.

    Replaces the deprecated @app.on_event("startup") and @app.on_event("shutdown")
    decorators. Code before `yield` runs on startup, code after runs on shutdown.

    Startup:
      1. Initialize database tables (create if not exist)
      2. Seed database with hospital data (idempotent)

    Shutdown:
      1. Log shutdown message
    """
    # --- STARTUP ---
    logger.info("Starting Hospital Appointment Assistant...")
    init_db()
    logger.info("Database initialized successfully")

    # Seed hospital data (departments, doctors, services)
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

    yield

    # --- SHUTDOWN ---
    logger.info("Shutting down Hospital Appointment Assistant...")


# Create FastAPI app with lifespan
app = FastAPI(
    title="Hospital Appointment Assistant",
    description="AI-powered chat system for automated patient triage and appointment scheduling",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint — API information and navigation links."""
    return {
        "message": "Welcome to Hospital Appointment Assistant API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "appointments": "/api/appointments",
            "triage": "/api/triage",
            "hospital_info": "/api/hospital",
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and connectivity verification."""
    return {
        "status": "healthy",
        "service": "Hospital Appointment Assistant",
        "version": "1.0.0"
    }


# Include routers
app.include_router(appointments_router)
app.include_router(triage_router)
app.include_router(hospital_router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Catches all unhandled exceptions and returns a standardized
    JSON error response instead of an HTML 500 page.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error occurred",
            "type": type(exc).__name__
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
