"""
NutrientDefinition model - Master list of all nutrients
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base


class NutrientDefinition(Base):
    """
    Master nutrient definitions - all possible nutrients that can appear on labels.
    This is the source of truth for nutrient keys, names, and units.
    """
    __tablename__ = "nutrient_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Unique identifier used in code
    key = Column(String(50), unique=True, nullable=False)  # "total_fat", "saturated_fat"

    # Display names (multilingual)
    name_en = Column(String(100), nullable=False)  # "Total Fat"
    name_ar = Column(String(100))                   # "الدهون الكلية"
    name_hi = Column(String(100))                   # Hindi
    name_zh = Column(String(100))                   # Chinese

    # Unit configuration
    unit = Column(String(20), nullable=False)  # g, mg, mcg, kcal, kJ

    # Categorization
    category = Column(String(50), nullable=False)  # energy, macro, vitamin, mineral, other

    # For hierarchical display (indentation)
    # e.g., saturated_fat has parent_key="total_fat"
    parent_key = Column(String(50), nullable=True)

    # Global defaults
    is_mandatory_global = Column(Boolean, default=False)  # Required on all labels globally
    default_order = Column(Integer, default=0)  # Default display order

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<NutrientDefinition {self.key}: {self.name_en}>"
