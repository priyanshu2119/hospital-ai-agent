"""
Schemas package — Pydantic models for request/response validation.
"""
from .appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
    AvailableSlotsRequest,
    AvailableSlotsResponse
)
from .triage import (
    TriageRequest,
    TriageResponse,
    ConversationRequest,
    ConversationResponse
)
from .hospital import (
    DepartmentResponse,
    DoctorResponse,
    ServiceResponse
)

__all__ = [
    "AppointmentCreate",
    "AppointmentUpdate",
    "AppointmentResponse",
    "AvailableSlotsRequest",
    "AvailableSlotsResponse",
    "TriageRequest",
    "TriageResponse",
    "ConversationRequest",
    "ConversationResponse",
    "DepartmentResponse",
    "DoctorResponse",
    "ServiceResponse",
]
