"""
Database models for appointments
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone
import enum

Base = declarative_base()


class AppointmentStatus(str, enum.Enum):
    """Appointment status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AppointmentType(str, enum.Enum):
    """Appointment type enumeration"""
    GENERAL = "general"
    EMERGENCY = "emergency"
    FOLLOW_UP = "follow_up"
    CONSULTATION = "consultation"


class Appointment(Base):
    """Appointment database model"""
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(255), nullable=False)
    patient_phone = Column(String(20), nullable=False)
    patient_email = Column(String(255), nullable=True)
    
    symptoms = Column(Text, nullable=True)
    triage_notes = Column(Text, nullable=True)
    ai_recommendation = Column(Text, nullable=True)
    
    appointment_type = Column(Enum(AppointmentType), default=AppointmentType.GENERAL)
    appointment_date = Column(DateTime, nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING)
    
    doctor_name = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # LiveKit session information
    livekit_room_name = Column(String(255), nullable=True)
    livekit_session_id = Column(String(255), nullable=True)
    call_duration_seconds = Column(Integer, nullable=True)
    
    def __repr__(self):
        return f"<Appointment(id={self.id}, patient={self.patient_name}, date={self.appointment_date})>"
