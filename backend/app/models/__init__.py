"""
Database models package

Exports all ORM models and the shared declarative Base for
SQLAlchemy table creation and relationship resolution.
"""
from .appointment import Appointment, AppointmentStatus, AppointmentType, Base
from .hospital import Department, Doctor, HospitalService

__all__ = [
    "Base",
    "Appointment",
    "AppointmentStatus",
    "AppointmentType",
    "Department",
    "Doctor",
    "HospitalService",
]
