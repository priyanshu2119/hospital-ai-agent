"""
API routes for hospital information (departments, doctors, services).

These endpoints expose the hospital knowledge base to the frontend,
enabling users to browse departments, find doctors, and view available services.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
import logging

from ..database import get_db
from ..models import Department, Doctor, HospitalService
from ..schemas import DepartmentResponse, DoctorResponse, ServiceResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/hospital", tags=["hospital"])


@router.get("/departments", response_model=List[DepartmentResponse])
async def list_departments(db: Session = Depends(get_db)):
    """
    List all active departments with their associated doctors.

    Returns departments sorted alphabetically by name, each containing
    a nested list of active doctors in that department.
    """
    try:
        departments = (
            db.query(Department)
            .filter(Department.is_active == True)
            .order_by(Department.name)
            .all()
        )

        result = []
        for dept in departments:
            doctors = []
            for doc in dept.doctors:
                if doc.is_active:
                    # Parse available_days from JSON string to list
                    available_days = []
                    if doc.available_days:
                        try:
                            available_days = json.loads(doc.available_days)
                        except (json.JSONDecodeError, TypeError):
                            available_days = []

                    doctors.append(DoctorResponse(
                        id=doc.id,
                        name=doc.name,
                        specialization=doc.specialization,
                        qualification=doc.qualification,
                        experience_years=doc.experience_years,
                        available_days=available_days,
                        consultation_start=doc.consultation_start,
                        consultation_end=doc.consultation_end,
                        room_number=doc.room_number,
                        phone=doc.phone,
                        email=doc.email,
                        is_active=doc.is_active,
                    ))

            result.append(DepartmentResponse(
                id=dept.id,
                name=dept.name,
                description=dept.description,
                location=dept.location,
                phone=dept.phone,
                operating_hours=dept.operating_hours,
                head_doctor=dept.head_doctor,
                is_active=dept.is_active,
                doctors=doctors,
            ))

        return result

    except Exception as e:
        logger.error(f"Error fetching departments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch departments: {str(e)}"
        )


@router.get("/departments/{department_id}", response_model=DepartmentResponse)
async def get_department(department_id: int, db: Session = Depends(get_db)):
    """Get a specific department by ID with its doctors."""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department {department_id} not found"
        )

    doctors = []
    for doc in dept.doctors:
        if doc.is_active:
            available_days = []
            if doc.available_days:
                try:
                    available_days = json.loads(doc.available_days)
                except (json.JSONDecodeError, TypeError):
                    available_days = []

            doctors.append(DoctorResponse(
                id=doc.id,
                name=doc.name,
                specialization=doc.specialization,
                qualification=doc.qualification,
                experience_years=doc.experience_years,
                available_days=available_days,
                consultation_start=doc.consultation_start,
                consultation_end=doc.consultation_end,
                room_number=doc.room_number,
                phone=doc.phone,
                email=doc.email,
                is_active=doc.is_active,
            ))

    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        description=dept.description,
        location=dept.location,
        phone=dept.phone,
        operating_hours=dept.operating_hours,
        head_doctor=dept.head_doctor,
        is_active=dept.is_active,
        doctors=doctors,
    )


@router.get("/doctors", response_model=List[DoctorResponse])
async def list_doctors(
    department_id: int = None,
    db: Session = Depends(get_db)
):
    """
    List all active doctors, optionally filtered by department.

    Args:
        department_id: Optional filter by department ID.
    """
    try:
        query = db.query(Doctor).filter(Doctor.is_active == True)

        if department_id is not None:
            query = query.filter(Doctor.department_id == department_id)

        doctors = query.order_by(Doctor.name).all()

        result = []
        for doc in doctors:
            available_days = []
            if doc.available_days:
                try:
                    available_days = json.loads(doc.available_days)
                except (json.JSONDecodeError, TypeError):
                    available_days = []

            result.append(DoctorResponse(
                id=doc.id,
                name=doc.name,
                specialization=doc.specialization,
                qualification=doc.qualification,
                experience_years=doc.experience_years,
                available_days=available_days,
                consultation_start=doc.consultation_start,
                consultation_end=doc.consultation_end,
                room_number=doc.room_number,
                phone=doc.phone,
                email=doc.email,
                is_active=doc.is_active,
            ))

        return result

    except Exception as e:
        logger.error(f"Error fetching doctors: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch doctors: {str(e)}"
        )


@router.get("/doctors/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Get a specific doctor by ID."""
    doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor {doctor_id} not found"
        )

    available_days = []
    if doc.available_days:
        try:
            available_days = json.loads(doc.available_days)
        except (json.JSONDecodeError, TypeError):
            available_days = []

    return DoctorResponse(
        id=doc.id,
        name=doc.name,
        specialization=doc.specialization,
        qualification=doc.qualification,
        experience_years=doc.experience_years,
        available_days=available_days,
        consultation_start=doc.consultation_start,
        consultation_end=doc.consultation_end,
        room_number=doc.room_number,
        phone=doc.phone,
        email=doc.email,
        is_active=doc.is_active,
    )


@router.get("/services", response_model=List[ServiceResponse])
async def list_services(db: Session = Depends(get_db)):
    """List all active hospital services with department names."""
    try:
        services = (
            db.query(HospitalService)
            .filter(HospitalService.is_active == True)
            .order_by(HospitalService.name)
            .all()
        )

        result = []
        for svc in services:
            # Resolve department name via relationship
            dept_name = None
            if svc.department:
                dept_name = svc.department.name

            result.append(ServiceResponse(
                id=svc.id,
                name=svc.name,
                description=svc.description,
                department=dept_name,
                duration_minutes=svc.duration_minutes,
                cost=svc.cost,
                is_active=svc.is_active,
            ))

        return result

    except Exception as e:
        logger.error(f"Error fetching services: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch services: {str(e)}"
        )
