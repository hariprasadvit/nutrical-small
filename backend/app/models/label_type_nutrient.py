"""
LabelTypeNutrient model - Configuration for each nutrient within a label type
"""

from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class LabelTypeNutrient(Base):
    """
    Configuration for how a specific nutrient appears in a specific label type.
    This is the junction table between LabelType and NutrientDefinition,
    with additional configuration specific to that combination.
    """
    __tablename__ = "label_type_nutrients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    label_type_id = Column(UUID(as_uuid=True), ForeignKey("label_types.id", ondelete="CASCADE"), nullable=False)
    nutrient_id = Column(UUID(as_uuid=True), ForeignKey("nutrient_definitions.id", ondelete="CASCADE"), nullable=False)

    # Display configuration for this label type
    is_mandatory = Column(Boolean, default=False)  # Must appear on this label type
    show_by_default = Column(Boolean, default=True)  # Shown unless explicitly hidden
    show_percent_dv = Column(Boolean, default=True)  # Show % Daily Value column

    # Ordering & styling
    display_order = Column(Integer, default=0)  # Order in the nutrition panel
    indent_level = Column(Integer, default=0)  # 0=root, 1=child, 2=grandchild
    is_bold = Column(Boolean, default=False)  # Bold text display

    # RDA/NRV specific to this label type
    # This allows different regions to have different daily values
    daily_value = Column(Numeric(10, 4), nullable=True)  # e.g., 78 for fat
    daily_value_unit = Column(String(20), nullable=True)  # g, mg, etc.

    # Relationships
    label_type = relationship("LabelType", back_populates="nutrient_configs")
    nutrient = relationship("NutrientDefinition")

    def __repr__(self):
        return f"<LabelTypeNutrient {self.label_type_id}:{self.nutrient_id}>"
