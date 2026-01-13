"""
Template model - Label template designs
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Template(Base):
    """
    Label template - stores the visual layout configuration
    """
    __tablename__ = "templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Null for preset templates
    label_type_id = Column(UUID(as_uuid=True), ForeignKey("label_types.id"), nullable=True)  # Link to label type config

    # Basic info
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Template type
    type = Column(String(50), nullable=False)  # vertical, tabular, dual-column, linear, aggregate, simplified
    
    # Canvas dimensions (in pixels at 96 DPI)
    width = Column(Integer, default=400)
    height = Column(Integer, default=600)

    # Canvas shape settings
    shape = Column(String(50), default="rectangle")  # rectangle, circle, oval, pill, rounded-rect
    corner_radius = Column(Integer, default=0)  # For rounded-rect shape

    # Language settings
    language = Column(String(10), default="en")  # en, ar, bilingual
    
    # Template elements (Fabric.js JSON or custom format)
    # Stores all visual elements: nutrition box, ingredients list, allergens, etc.
    elements = Column(JSON, default=list)
    
    # Global styles
    styles = Column(JSON, default=dict)
    # Example:
    # {
    #   "fontFamily": "Arial",
    #   "fontSize": 12,
    #   "borderWidth": 1,
    #   "borderColor": "#000000",
    #   "backgroundColor": "#ffffff"
    # }
    
    # Nutrition box configuration
    nutrition_config = Column(JSON, default=dict)
    # Example:
    # {
    #   "showCalories": true,
    #   "showServingSize": true,
    #   "showDailyValue": true,
    #   "nutrients": [
    #     {"key": "total_fat", "show": true, "indent": 0},
    #     {"key": "saturated_fat", "show": true, "indent": 1},
    #     ...
    #   ]
    # }
    
    # Display preferences
    display_preferences = Column(JSON, default=dict)
    # Example:
    # {
    #   "hideIngredients": false,
    #   "hideAllergens": false,
    #   "hideBusinessDetails": false,
    #   "hideSugarAlcohol": true,
    #   "showAdditionalMicronutrients": false,
    #   "preferSodiumOverSalt": true,
    #   "preferCalorieOverJoule": true
    # }
    
    # Flags
    is_preset = Column(Boolean, default=False)  # System preset template
    is_public = Column(Boolean, default=False)  # Shared with other users
    is_compliant = Column(Boolean, default=True)  # Meets FDA requirements

    # Override label type settings (if needed)
    custom_nutrients = Column(JSON, nullable=True)  # Override nutrient display
    custom_typography = Column(JSON, nullable=True)  # Override fonts
    custom_footnotes = Column(JSON, nullable=True)  # Override footnotes

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="templates")
    labels = relationship("Label", back_populates="template")
    label_type = relationship("LabelType", back_populates="templates")


# Default element structure for reference
DEFAULT_NUTRITION_BOX_ELEMENT = {
    "id": "nutrition-box-1",
    "type": "nutrition-box",
    "x": 20,
    "y": 20,
    "width": 360,
    "height": 500,
    "properties": {
        "title": "Nutrition Facts",
        "titleAr": "القيمة الغذائية",
        "fontSize": 12,
        "titleFontSize": 24,
        "fontFamily": "Arial",
        "borderWidth": 2,
        "showDailyValue": True,
        "dailyValueFootnote": True,
    }
}

DEFAULT_INGREDIENTS_ELEMENT = {
    "id": "ingredients-1",
    "type": "ingredients-list",
    "x": 20,
    "y": 530,
    "width": 360,
    "height": 50,
    "properties": {
        "prefix": "Ingredients:",
        "prefixAr": "المكونات:",
        "fontSize": 10,
        "fontFamily": "Arial",
        "separator": ", ",
        "sortByWeight": True,
    }
}

DEFAULT_ALLERGENS_ELEMENT = {
    "id": "allergens-1",
    "type": "allergens",
    "x": 20,
    "y": 590,
    "width": 360,
    "height": 30,
    "properties": {
        "prefix": "Contains:",
        "prefixAr": "يحتوي على:",
        "fontSize": 10,
        "fontWeight": "bold",
    }
}
