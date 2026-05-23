"""
seed_data.py — Hospital Knowledge Base Seed Data

Populates the database with realistic hospital data on first startup:
  - 8 departments with descriptions, locations, and operating hours
  - 15 doctors with specializations, experience, and schedules
  - 12 hospital services with departments and durations

This data serves as the hospital knowledge base that the AI assistant
uses to answer questions about the hospital's departments, doctors,
schedules, and services.

Usage:
  Called from main.py during application startup.
  Only inserts data if the departments table is empty (idempotent).
"""

import json
import logging
from sqlalchemy.orm import Session
from .models import Department, Doctor, HospitalService

logger = logging.getLogger(__name__)


def seed_database(db: Session) -> None:
    """
    Populate the database with initial hospital data.

    This function is idempotent — it checks if data already exists
    before inserting. Safe to call on every application startup.

    Args:
        db: Active SQLAlchemy database session.
    """
    # Check if data already exists (idempotent guard)
    existing_departments = db.query(Department).count()
    if existing_departments > 0:
        logger.info(f"Database already seeded with {existing_departments} departments. Skipping.")
        return

    logger.info("Seeding database with hospital data...")

    # ----------------------------------------------------------------
    # DEPARTMENTS
    # ----------------------------------------------------------------
    departments_data = [
        {
            "name": "General Medicine",
            "description": "Comprehensive primary care and internal medicine services for adults. Handles common illnesses, chronic disease management, and preventive care.",
            "location": "Building A, Floor 1",
            "phone": "+91-1234-567001",
            "operating_hours": "8:00 AM - 6:00 PM",
            "head_doctor": "Dr. Sharma",
        },
        {
            "name": "Cardiology",
            "description": "Advanced heart and cardiovascular disease diagnosis and treatment. Includes ECG, echocardiography, stress testing, and interventional procedures.",
            "location": "Building B, Floor 3",
            "phone": "+91-1234-567002",
            "operating_hours": "9:00 AM - 5:00 PM",
            "head_doctor": "Dr. Gupta",
        },
        {
            "name": "Orthopedics",
            "description": "Bone, joint, and musculoskeletal care including sports medicine, joint replacement, fracture treatment, and physiotherapy.",
            "location": "Building A, Floor 2",
            "phone": "+91-1234-567003",
            "operating_hours": "9:00 AM - 5:00 PM",
            "head_doctor": "Dr. Singh",
        },
        {
            "name": "Pediatrics",
            "description": "Specialized medical care for infants, children, and adolescents. Covers vaccinations, growth monitoring, and childhood diseases.",
            "location": "Building C, Floor 1",
            "phone": "+91-1234-567004",
            "operating_hours": "8:00 AM - 7:00 PM",
            "head_doctor": "Dr. Verma",
        },
        {
            "name": "ENT (Ear, Nose & Throat)",
            "description": "Diagnosis and treatment of ear, nose, throat, head and neck disorders. Includes hearing tests, allergy treatment, and minor surgical procedures.",
            "location": "Building B, Floor 2",
            "phone": "+91-1234-567005",
            "operating_hours": "9:00 AM - 4:00 PM",
            "head_doctor": "Dr. Kumar",
        },
        {
            "name": "Dermatology",
            "description": "Skin, hair, and nail disorder treatment with cosmetic dermatology services. Handles acne, eczema, psoriasis, and skin infections.",
            "location": "Building A, Floor 3",
            "phone": "+91-1234-567006",
            "operating_hours": "10:00 AM - 4:00 PM",
            "head_doctor": "Dr. Reddy",
        },
        {
            "name": "Gynecology & Obstetrics",
            "description": "Women's health services including prenatal care, delivery, reproductive health, and gynecological surgeries.",
            "location": "Building C, Floor 2",
            "phone": "+91-1234-567007",
            "operating_hours": "9:00 AM - 5:00 PM",
            "head_doctor": "Dr. Joshi",
        },
        {
            "name": "Neurology",
            "description": "Brain, spinal cord, and nervous system disorder diagnosis and care. Covers headaches, epilepsy, stroke, and neurodegenerative diseases.",
            "location": "Building B, Floor 4",
            "phone": "+91-1234-567008",
            "operating_hours": "9:00 AM - 5:00 PM",
            "head_doctor": "Dr. Iyer",
        },
    ]

    departments = {}
    for dept_data in departments_data:
        dept = Department(**dept_data)
        db.add(dept)
        db.flush()  # Flush to get the auto-generated ID for FK references
        departments[dept_data["name"]] = dept

    # ----------------------------------------------------------------
    # DOCTORS
    # ----------------------------------------------------------------
    doctors_data = [
        # General Medicine
        {
            "name": "Rajesh Sharma",
            "specialization": "Internal Medicine",
            "qualification": "MBBS, MD (Internal Medicine)",
            "experience_years": 15,
            "department_name": "General Medicine",
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "consultation_start": 9,
            "consultation_end": 17,
            "room_number": "A-101",
            "phone": "+91-9876-543001",
            "email": "dr.sharma@hospital.com",
        },
        {
            "name": "Priya Patel",
            "specialization": "Family Medicine",
            "qualification": "MBBS, DNB (Family Medicine)",
            "experience_years": 10,
            "department_name": "General Medicine",
            "available_days": ["Monday", "Wednesday", "Friday"],
            "consultation_start": 10,
            "consultation_end": 16,
            "room_number": "A-102",
            "phone": "+91-9876-543002",
            "email": "dr.patel@hospital.com",
        },
        # Cardiology
        {
            "name": "Anil Gupta",
            "specialization": "Interventional Cardiology",
            "qualification": "MBBS, MD, DM (Cardiology)",
            "experience_years": 20,
            "department_name": "Cardiology",
            "available_days": ["Monday", "Tuesday", "Thursday"],
            "consultation_start": 9,
            "consultation_end": 15,
            "room_number": "B-301",
            "phone": "+91-9876-543003",
            "email": "dr.gupta@hospital.com",
        },
        {
            "name": "Meera Krishnan",
            "specialization": "Clinical Cardiology",
            "qualification": "MBBS, MD (Cardiology)",
            "experience_years": 12,
            "department_name": "Cardiology",
            "available_days": ["Wednesday", "Friday", "Saturday"],
            "consultation_start": 10,
            "consultation_end": 16,
            "room_number": "B-302",
            "phone": "+91-9876-543004",
            "email": "dr.krishnan@hospital.com",
        },
        # Orthopedics
        {
            "name": "Harpreet Singh",
            "specialization": "Joint Replacement Surgery",
            "qualification": "MBBS, MS (Orthopedics)",
            "experience_years": 18,
            "department_name": "Orthopedics",
            "available_days": ["Tuesday", "Wednesday", "Friday"],
            "consultation_start": 9,
            "consultation_end": 16,
            "room_number": "A-201",
            "phone": "+91-9876-543005",
            "email": "dr.singh@hospital.com",
        },
        {
            "name": "Deepak Malhotra",
            "specialization": "Sports Medicine",
            "qualification": "MBBS, MS, Fellowship (Sports Medicine)",
            "experience_years": 8,
            "department_name": "Orthopedics",
            "available_days": ["Monday", "Thursday", "Saturday"],
            "consultation_start": 10,
            "consultation_end": 17,
            "room_number": "A-202",
            "phone": "+91-9876-543006",
            "email": "dr.malhotra@hospital.com",
        },
        # Pediatrics
        {
            "name": "Sunita Verma",
            "specialization": "General Pediatrics",
            "qualification": "MBBS, MD (Pediatrics)",
            "experience_years": 12,
            "department_name": "Pediatrics",
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "consultation_start": 9,
            "consultation_end": 17,
            "room_number": "C-101",
            "phone": "+91-9876-543007",
            "email": "dr.verma@hospital.com",
        },
        {
            "name": "Arjun Nair",
            "specialization": "Pediatric Emergency",
            "qualification": "MBBS, DCH, DNB (Pediatrics)",
            "experience_years": 9,
            "department_name": "Pediatrics",
            "available_days": ["Monday", "Wednesday", "Friday", "Saturday"],
            "consultation_start": 8,
            "consultation_end": 16,
            "room_number": "C-102",
            "phone": "+91-9876-543008",
            "email": "dr.nair@hospital.com",
        },
        # ENT
        {
            "name": "Vikram Kumar",
            "specialization": "Otolaryngology",
            "qualification": "MBBS, MS (ENT)",
            "experience_years": 14,
            "department_name": "ENT (Ear, Nose & Throat)",
            "available_days": ["Monday", "Wednesday", "Friday"],
            "consultation_start": 10,
            "consultation_end": 16,
            "room_number": "B-201",
            "phone": "+91-9876-543009",
            "email": "dr.kumar@hospital.com",
        },
        # Dermatology
        {
            "name": "Lakshmi Reddy",
            "specialization": "Clinical Dermatology",
            "qualification": "MBBS, MD (Dermatology)",
            "experience_years": 8,
            "department_name": "Dermatology",
            "available_days": ["Tuesday", "Thursday", "Saturday"],
            "consultation_start": 10,
            "consultation_end": 16,
            "room_number": "A-301",
            "phone": "+91-9876-543010",
            "email": "dr.reddy@hospital.com",
        },
        {
            "name": "Kavitha Menon",
            "specialization": "Cosmetic Dermatology",
            "qualification": "MBBS, DVD, DNB (Dermatology)",
            "experience_years": 6,
            "department_name": "Dermatology",
            "available_days": ["Monday", "Wednesday", "Friday"],
            "consultation_start": 11,
            "consultation_end": 15,
            "room_number": "A-302",
            "phone": "+91-9876-543011",
            "email": "dr.menon@hospital.com",
        },
        # Gynecology
        {
            "name": "Anita Joshi",
            "specialization": "Obstetrics & Gynecology",
            "qualification": "MBBS, MS (OB-GYN), Fellowship",
            "experience_years": 16,
            "department_name": "Gynecology & Obstetrics",
            "available_days": ["Monday", "Tuesday", "Thursday", "Friday"],
            "consultation_start": 9,
            "consultation_end": 17,
            "room_number": "C-201",
            "phone": "+91-9876-543012",
            "email": "dr.joshi@hospital.com",
        },
        {
            "name": "Rekha Deshmukh",
            "specialization": "Reproductive Medicine",
            "qualification": "MBBS, MD (OB-GYN)",
            "experience_years": 11,
            "department_name": "Gynecology & Obstetrics",
            "available_days": ["Wednesday", "Friday", "Saturday"],
            "consultation_start": 10,
            "consultation_end": 16,
            "room_number": "C-202",
            "phone": "+91-9876-543013",
            "email": "dr.deshmukh@hospital.com",
        },
        # Neurology
        {
            "name": "Suresh Iyer",
            "specialization": "Clinical Neurology",
            "qualification": "MBBS, MD, DM (Neurology)",
            "experience_years": 22,
            "department_name": "Neurology",
            "available_days": ["Monday", "Wednesday", "Friday"],
            "consultation_start": 9,
            "consultation_end": 15,
            "room_number": "B-401",
            "phone": "+91-9876-543014",
            "email": "dr.iyer@hospital.com",
        },
        {
            "name": "Pooja Saxena",
            "specialization": "Neurophysiology",
            "qualification": "MBBS, MD (Neurology)",
            "experience_years": 7,
            "department_name": "Neurology",
            "available_days": ["Tuesday", "Thursday"],
            "consultation_start": 10,
            "consultation_end": 17,
            "room_number": "B-402",
            "phone": "+91-9876-543015",
            "email": "dr.saxena@hospital.com",
        },
    ]

    for doc_data in doctors_data:
        dept_name = doc_data.pop("department_name")
        dept = departments.get(dept_name)
        if dept:
            doc_data["department_id"] = dept.id
            doc_data["available_days"] = json.dumps(doc_data["available_days"])
            doctor = Doctor(**doc_data)
            db.add(doctor)

    # ----------------------------------------------------------------
    # HOSPITAL SERVICES
    # ----------------------------------------------------------------
    services_data = [
        {
            "name": "General Consultation",
            "description": "Standard doctor consultation for diagnosis, treatment planning, and health check-ups.",
            "department_name": "General Medicine",
            "duration_minutes": 30,
            "cost": 500.0,
        },
        {
            "name": "Blood Test Panel",
            "description": "Complete blood count (CBC), lipid profile, metabolic panel, and other diagnostic blood tests.",
            "department_name": "General Medicine",
            "duration_minutes": 15,
            "cost": 800.0,
        },
        {
            "name": "ECG / EKG",
            "description": "Electrocardiogram for heart rhythm analysis, detecting arrhythmias, and cardiac health assessment.",
            "department_name": "Cardiology",
            "duration_minutes": 15,
            "cost": 600.0,
        },
        {
            "name": "Echocardiography",
            "description": "Ultrasound-based imaging of the heart to evaluate structure, function, and blood flow.",
            "department_name": "Cardiology",
            "duration_minutes": 45,
            "cost": 2500.0,
        },
        {
            "name": "X-Ray Imaging",
            "description": "Digital X-ray for bones, chest, abdomen, and other body parts for diagnostic purposes.",
            "department_name": "Orthopedics",
            "duration_minutes": 20,
            "cost": 400.0,
        },
        {
            "name": "Physiotherapy Session",
            "description": "Guided rehabilitation exercises, pain management, and mobility improvement therapy.",
            "department_name": "Orthopedics",
            "duration_minutes": 45,
            "cost": 700.0,
        },
        {
            "name": "Child Vaccination",
            "description": "Immunization services for infants and children following the national immunization schedule.",
            "department_name": "Pediatrics",
            "duration_minutes": 15,
            "cost": 300.0,
        },
        {
            "name": "Hearing Test (Audiometry)",
            "description": "Comprehensive hearing assessment using pure tone and speech audiometry.",
            "department_name": "ENT (Ear, Nose & Throat)",
            "duration_minutes": 30,
            "cost": 500.0,
        },
        {
            "name": "Skin Biopsy",
            "description": "Diagnostic procedure to examine skin tissue for conditions like cancer, infections, or autoimmune diseases.",
            "department_name": "Dermatology",
            "duration_minutes": 30,
            "cost": 1500.0,
        },
        {
            "name": "Prenatal Check-up",
            "description": "Routine pregnancy monitoring including ultrasound, blood tests, and maternal health assessment.",
            "department_name": "Gynecology & Obstetrics",
            "duration_minutes": 45,
            "cost": 1200.0,
        },
        {
            "name": "EEG (Electroencephalogram)",
            "description": "Brain wave recording to diagnose epilepsy, sleep disorders, and other neurological conditions.",
            "department_name": "Neurology",
            "duration_minutes": 60,
            "cost": 2000.0,
        },
        {
            "name": "Health Check-up Package",
            "description": "Comprehensive health screening including blood tests, ECG, chest X-ray, and doctor consultation.",
            "department_name": "General Medicine",
            "duration_minutes": 120,
            "cost": 3500.0,
        },
    ]

    for svc_data in services_data:
        dept_name = svc_data.pop("department_name")
        dept = departments.get(dept_name)
        if dept:
            svc_data["department_id"] = dept.id
            service = HospitalService(**svc_data)
            db.add(service)

    # Commit all data in a single transaction
    try:
        db.commit()
        logger.info(
            f"Database seeded successfully: "
            f"{len(departments_data)} departments, "
            f"{len(doctors_data)} doctors, "
            f"{len(services_data)} services."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed database: {e}")
        raise
