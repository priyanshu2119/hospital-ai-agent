"""
Database models for hospital departments, doctors, and services.

These models represent the structured hospital knowledge base that
enables the AI assistant to provide accurate, hospital-specific
information about departments, doctor schedules, and available services.

Design decisions:
  - Departments are the top-level organizational unit.
  - Doctors belong to exactly one department (FK relationship).
  - Services belong to a department but are independent of specific doctors.
  - available_days stored as JSON list for flexibility (e.g., ["Monday", "Wednesday"]).
  - All models use soft-active flags (is_active) for archiving without deletion.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from .appointment import Base


class Department(Base):
    """
    Hospital department model.

    Represents a clinical department within the hospital
    (e.g., Cardiology, Orthopedics, Pediatrics).

    Attributes:
        name: Display name of the department.
        description: Brief description of what the department handles.
        location: Physical location within the hospital (e.g., "Building A, Floor 2").
        phone: Department contact phone number.
        operating_hours: Human-readable operating hours string.
        head_doctor: Name of the department head (denormalized for simplicity).
        is_active: Whether the department is currently operational.
    """
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    operating_hours = Column(String(100), nullable=True)
    head_doctor = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationship: a department has many doctors
    doctors = relationship("Doctor", back_populates="department", lazy="joined")
    # Relationship: a department has many services
    services = relationship("HospitalService", back_populates="department", lazy="joined")

    def __repr__(self):
        return f"<Department(id={self.id}, name={self.name})>"


class Doctor(Base):
    """
    Doctor profile model.

    Represents a doctor within a specific department,
    including their specialization, schedule, and contact info.

    Attributes:
        name: Full name of the doctor (without "Dr." prefix).
        specialization: Medical specialty (e.g., "Interventional Cardiology").
        qualification: Degrees and certifications (e.g., "MBBS, MD, DM").
        experience_years: Years of professional experience.
        department_id: FK to the department this doctor belongs to.
        available_days: JSON-serialized list of days (e.g., '["Monday","Wednesday"]').
        consultation_start: Start hour (24h format, e.g., 9 for 9:00 AM).
        consultation_end: End hour (24h format, e.g., 17 for 5:00 PM).
        room_number: Consultation room number/name.
        phone: Direct contact phone number.
        email: Professional email address.
        is_active: Whether the doctor is currently practicing.
    """
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    specialization = Column(String(255), nullable=True)
    qualification = Column(String(255), nullable=True)
    experience_years = Column(Integer, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    available_days = Column(Text, nullable=True)  # JSON string: '["Monday","Wednesday","Friday"]'
    consultation_start = Column(Integer, default=9)   # 24h format hour
    consultation_end = Column(Integer, default=17)    # 24h format hour
    room_number = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationship back to department
    department = relationship("Department", back_populates="doctors")

    def __repr__(self):
        return f"<Doctor(id={self.id}, name={self.name}, dept_id={self.department_id})>"


class HospitalService(Base):
    """
    Hospital service model.

    Represents a medical service offered by a department
    (e.g., "Blood Test Panel", "X-Ray Imaging", "ECG").

    Attributes:
        name: Service name.
        description: What the service involves.
        department_id: FK to the department offering this service.
        duration_minutes: Typical duration of the service.
        cost: Cost in local currency (optional, informational only).
        is_active: Whether the service is currently available.
    """
    __tablename__ = "hospital_services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    cost = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationship back to department
    department = relationship("Department", back_populates="services")

    def __repr__(self):
        return f"<HospitalService(id={self.id}, name={self.name})>"
