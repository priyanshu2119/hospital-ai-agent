"""
Pydantic schemas for hospital information API responses.

These schemas define the data shapes returned by the /api/hospital endpoints
for departments, doctors, and services.
"""

from pydantic import BaseModel
from typing import Optional, List


class DoctorResponse(BaseModel):
    """Schema for doctor data in API responses."""
    id: int
    name: str
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    available_days: Optional[List[str]] = None
    consultation_start: Optional[int] = None
    consultation_end: Optional[int] = None
    room_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class DepartmentResponse(BaseModel):
    """Schema for department data with nested doctors."""
    id: int
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    operating_hours: Optional[str] = None
    head_doctor: Optional[str] = None
    is_active: bool = True
    doctors: List[DoctorResponse] = []

    class Config:
        from_attributes = True


class ServiceResponse(BaseModel):
    """Schema for hospital service data."""
    id: int
    name: str
    description: Optional[str] = None
    department: Optional[str] = None  # Department name (denormalized)
    duration_minutes: Optional[int] = None
    cost: Optional[float] = None
    is_active: bool = True

    class Config:
        from_attributes = True
