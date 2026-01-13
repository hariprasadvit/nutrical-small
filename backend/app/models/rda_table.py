"""
RDATable model - Reference Daily Allowance tables for different regions
"""

from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, date
import uuid

from app.core.database import Base


class RDATable(Base):
    """
    Reference Daily Allowance (RDA) / Nutrient Reference Values (NRV) tables.
    Each table represents a set of daily values from a specific regulatory body.
    Examples: FDA 2020, GSO 2024, EU NRV, etc.
    """
    __tablename__ = "rda_tables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic info
    name = Column(String(100), nullable=False)  # "FDA 2020", "GSO 2024"
    code = Column(String(50), unique=True, nullable=False)  # "fda_2020", "gso_2024"
    description = Column(String(500))

    # Region
    region = Column(String(50))  # USA, GCC, EU, etc.

    # Effective date (when this RDA table became official)
    effective_date = Column(Date, default=date.today)

    # Base calorie level for these values
    calorie_base = Column(Integer, default=2000)

    # The actual daily values
    # Key: nutrient_key, Value: daily_value number
    values = Column(JSON, default=dict)
    # Example: {
    #   "total_fat": 78,
    #   "saturated_fat": 20,
    #   "cholesterol": 300,
    #   "sodium": 2300,
    #   "total_carbs": 275,
    #   "dietary_fiber": 28,
    #   "added_sugars": 50,
    #   "vitamin_d": 20,
    #   "calcium": 1300,
    #   "iron": 18,
    #   "potassium": 4700,
    #   ...
    # }

    # Units for each nutrient (if different from nutrient definition default)
    units = Column(JSON, default=dict)
    # Example: {"vitamin_d": "mcg", "calcium": "mg"}

    # Status
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)  # Default RDA table for the system

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<RDATable {self.code}: {self.name}>"
