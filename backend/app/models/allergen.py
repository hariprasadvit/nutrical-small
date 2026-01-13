"""
Allergen model - Master list of allergens
"""

from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base


class Allergen(Base):
    """
    Master allergen list - FDA major allergens and custom additions
    """
    __tablename__ = "allergens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Names
    name = Column(String(100), nullable=False, unique=True)
    name_ar = Column(String(100))  # Arabic
    
    # Display
    icon = Column(String(50))  # Icon identifier
    color = Column(String(7))  # Hex color for UI
    
    # Flags
    is_major = Column(Boolean, default=False)  # FDA major allergen
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


# FDA Major Allergens (Big 9)
FDA_MAJOR_ALLERGENS = [
    {"name": "Milk", "name_ar": "حليب", "is_major": True},
    {"name": "Eggs", "name_ar": "بيض", "is_major": True},
    {"name": "Fish", "name_ar": "سمك", "is_major": True},
    {"name": "Shellfish", "name_ar": "المحار", "is_major": True},
    {"name": "Tree Nuts", "name_ar": "المكسرات", "is_major": True},
    {"name": "Peanuts", "name_ar": "فول سوداني", "is_major": True},
    {"name": "Wheat", "name_ar": "قمح", "is_major": True},
    {"name": "Soybeans", "name_ar": "فول الصويا", "is_major": True},
    {"name": "Sesame", "name_ar": "سمسم", "is_major": True},
]

# Additional common allergens
ADDITIONAL_ALLERGENS = [
    {"name": "Gluten", "name_ar": "غلوتين", "is_major": False},
    {"name": "Mustard", "name_ar": "خردل", "is_major": False},
    {"name": "Celery", "name_ar": "كرفس", "is_major": False},
    {"name": "Lupin", "name_ar": "ترمس", "is_major": False},
    {"name": "Molluscs", "name_ar": "رخويات", "is_major": False},
    {"name": "Sulphites", "name_ar": "كبريتات", "is_major": False},
]
