"""
Appointment scheduling service
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from ..models import Appointment, AppointmentStatus, AppointmentType
from ..config import settings
import logging

logger = logging.getLogger(__name__)


class AppointmentService:
    """Service for managing appointments"""
    
    @staticmethod
    def create_appointment(db: Session, appointment_data: dict) -> Appointment:
        """
        Create a new appointment
        
        Args:
            db: Database session
            appointment_data: Dictionary with appointment details
            
        Returns:
            Created appointment object
        """
        try:
            appointment = Appointment(**appointment_data)
            db.add(appointment)
            db.commit()
            db.refresh(appointment)
            logger.info(f"Created appointment {appointment.id} for {appointment.patient_name}")
            return appointment
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating appointment: {e}")
            raise
    
    @staticmethod
    def get_appointment(db: Session, appointment_id: int) -> Appointment:
        """Get appointment by ID"""
        return db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    @staticmethod
    def get_appointments(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: AppointmentStatus = None
    ) -> list[Appointment]:
        """
        Get list of appointments with optional filtering
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by appointment status
            
        Returns:
            List of appointments
        """
        query = db.query(Appointment)
        
        if status:
            query = query.filter(Appointment.status == status)
        
        return query.order_by(Appointment.appointment_date.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_appointment(
        db: Session,
        appointment_id: int,
        update_data: dict
    ) -> Appointment:
        """
        Update an existing appointment
        
        Args:
            db: Database session
            appointment_id: ID of appointment to update
            update_data: Dictionary with fields to update
            
        Returns:
            Updated appointment object
        """
        try:
            appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
            if not appointment:
                raise ValueError(f"Appointment {appointment_id} not found")
            
            for key, value in update_data.items():
                if hasattr(appointment, key):
                    setattr(appointment, key, value)
            
            appointment.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(appointment)
            logger.info(f"Updated appointment {appointment_id}")
            return appointment
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating appointment: {e}")
            raise
    
    @staticmethod
    def cancel_appointment(db: Session, appointment_id: int) -> Appointment:
        """Cancel an appointment"""
        return AppointmentService.update_appointment(
            db,
            appointment_id,
            {"status": AppointmentStatus.CANCELLED}
        )
    
    @staticmethod
    def get_available_slots(db: Session, date: datetime, duration_minutes: int = 30) -> list:
        """
        Get available appointment slots for a given date
        
        Args:
            db: Database session
            date: Date to check availability
            duration_minutes: Appointment duration
            
        Returns:
            List of available datetime slots
        """
        # Get existing appointments for the day
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        existing_appointments = db.query(Appointment).filter(
            Appointment.appointment_date >= start_of_day,
            Appointment.appointment_date < end_of_day,
            Appointment.status != AppointmentStatus.CANCELLED
        ).all()
        
        # Generate all possible slots
        available_slots = []
        working_start = settings.WORKING_HOURS_START
        working_end = settings.WORKING_HOURS_END
        
        current_time = start_of_day.replace(hour=working_start, minute=0)
        end_time = start_of_day.replace(hour=working_end, minute=0)
        
        while current_time < end_time:
            # Check if slot is available
            is_available = True
            for apt in existing_appointments:
                apt_end = apt.appointment_date + timedelta(minutes=duration_minutes)
                slot_end = current_time + timedelta(minutes=duration_minutes)
                
                # Check for overlap
                if (current_time < apt_end and slot_end > apt.appointment_date):
                    is_available = False
                    break
            
            if is_available and current_time > datetime.now(timezone.utc):
                available_slots.append(current_time)
            
            current_time += timedelta(minutes=duration_minutes)
        
        return available_slots


# Global instance
appointment_service = AppointmentService()
