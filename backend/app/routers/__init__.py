"""
Routers package — API route registrations.
"""
from .appointments import router as appointments_router
from .triage import router as triage_router
from .hospital import router as hospital_router

__all__ = ["appointments_router", "triage_router", "hospital_router"]
