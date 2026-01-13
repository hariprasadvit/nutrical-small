"""
LabelType model - Configurable label type definitions (FDA, GSO, EU, etc.)
"""

from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class LabelType(Base):
    """
    Label type configuration - defines how a nutrition label should be displayed.
    Each label type (FDA, GSO, EU, etc.) has its own configuration for:
    - Which nutrients to show
    - Display modes (per serving, per 100g)
    - Languages supported
    - Daily values / RDA
    - Styling defaults
    """
    __tablename__ = "label_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic info
    name = Column(String(100), nullable=False)  # "GSO Label", "FDA Vertical"
    code = Column(String(50), unique=True, nullable=False)  # "gso", "fda_vertical"
    category = Column(String(50), default="regulatory")  # regulatory, marketing, custom
    description = Column(Text)

    # Regional settings
    region = Column(String(50))  # GCC, USA, EU, UK, etc.
    languages = Column(JSON, default=["en"])  # ["en", "ar"]

    # Display modes supported
    display_modes = Column(JSON, default=["per_serving"])
    # Options: per_serving, per_100g, per_100ml, per_container, as_packaged, as_prepared

    # Calorie/Energy settings
    daily_calorie_base = Column(Integer, default=2000)  # 2000, 2500, etc.
    energy_unit = Column(String(10), default="kcal")  # kcal, kJ, both
    sodium_display = Column(String(10), default="sodium")  # sodium, salt

    # Layout defaults
    default_width = Column(Integer, default=400)
    default_height = Column(Integer, default=600)

    # Typography defaults (can be overridden per template)
    typography = Column(JSON, default=dict)
    # Example: {
    #   "fontFamily": "Arial",
    #   "titleFontSize": 24,
    #   "headerFontSize": 14,
    #   "bodyFontSize": 12,
    #   "footnoteSize": 8
    # }

    # Border configuration
    border_config = Column(JSON, default=dict)
    # Example: {
    #   "width": 2,
    #   "color": "#000000",
    #   "style": "solid"
    # }

    # Color scheme
    color_scheme = Column(JSON, default=dict)
    # Example: {
    #   "background": "#ffffff",
    #   "text": "#000000",
    #   "accent": "#000000",
    #   "divider": "#000000"
    # }

    # Footnotes & disclaimers
    footnotes = Column(JSON, default=list)
    # Example: [
    #   {"text": "* Percent Daily Values...", "textAr": "...", "required": True},
    #   {"text": "Calories per gram: Fat 9...", "textAr": "...", "required": False}
    # ]

    # Status flags
    is_active = Column(Boolean, default=True)
    is_system = Column(Boolean, default=False)  # Built-in vs user-created

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    nutrient_configs = relationship("LabelTypeNutrient", back_populates="label_type", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="label_type")

    def __repr__(self):
        return f"<LabelType {self.code}: {self.name}>"
