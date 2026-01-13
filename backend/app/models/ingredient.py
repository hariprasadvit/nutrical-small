"""
Ingredient model - Master ingredient database with nutrition values
"""

from sqlalchemy import Column, String, DateTime, Boolean, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base


class Ingredient(Base):
    """
    Master ingredient list with nutrition data per 100g/100ml
    Based on FDA nutrition label requirements
    """
    __tablename__ = "ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic info
    name = Column(String(255), nullable=False, index=True)
    name_ar = Column(String(255))  # Arabic name
    category = Column(String(100))  # meat, dairy, grain, etc.
    
    # Macronutrients (per 100g or 100ml)
    calories = Column(Numeric(10, 2), default=0)  # kcal
    total_fat = Column(Numeric(10, 2), default=0)  # g
    saturated_fat = Column(Numeric(10, 2), default=0)  # g
    trans_fat = Column(Numeric(10, 2), default=0)  # g
    polyunsaturated_fat = Column(Numeric(10, 2), default=0)  # g (optional)
    monounsaturated_fat = Column(Numeric(10, 2), default=0)  # g (optional)
    
    cholesterol = Column(Numeric(10, 2), default=0)  # mg
    sodium = Column(Numeric(10, 2), default=0)  # mg
    
    total_carbs = Column(Numeric(10, 2), default=0)  # g
    dietary_fiber = Column(Numeric(10, 2), default=0)  # g
    soluble_fiber = Column(Numeric(10, 2), default=0)  # g (optional)
    insoluble_fiber = Column(Numeric(10, 2), default=0)  # g (optional)
    total_sugars = Column(Numeric(10, 2), default=0)  # g
    added_sugars = Column(Numeric(10, 2), default=0)  # g
    sugar_alcohol = Column(Numeric(10, 2), default=0)  # g (optional)
    
    protein = Column(Numeric(10, 2), default=0)  # g
    
    # Micronutrients (mandatory on FDA labels)
    vitamin_d = Column(Numeric(10, 4), default=0)  # mcg
    calcium = Column(Numeric(10, 2), default=0)  # mg
    iron = Column(Numeric(10, 2), default=0)  # mg
    potassium = Column(Numeric(10, 2), default=0)  # mg
    
    # Optional micronutrients
    vitamin_a = Column(Numeric(10, 2), default=0)  # mcg
    vitamin_c = Column(Numeric(10, 2), default=0)  # mg
    vitamin_e = Column(Numeric(10, 2), default=0)  # mg
    vitamin_k = Column(Numeric(10, 2), default=0)  # mcg
    thiamin = Column(Numeric(10, 2), default=0)  # mg (B1)
    riboflavin = Column(Numeric(10, 2), default=0)  # mg (B2)
    niacin = Column(Numeric(10, 2), default=0)  # mg (B3)
    vitamin_b6 = Column(Numeric(10, 2), default=0)  # mg
    folate = Column(Numeric(10, 2), default=0)  # mcg DFE
    vitamin_b12 = Column(Numeric(10, 2), default=0)  # mcg
    biotin = Column(Numeric(10, 2), default=0)  # mcg
    pantothenic_acid = Column(Numeric(10, 2), default=0)  # mg
    phosphorus = Column(Numeric(10, 2), default=0)  # mg
    iodine = Column(Numeric(10, 2), default=0)  # mcg
    magnesium = Column(Numeric(10, 2), default=0)  # mg
    zinc = Column(Numeric(10, 2), default=0)  # mg
    selenium = Column(Numeric(10, 2), default=0)  # mcg
    copper = Column(Numeric(10, 2), default=0)  # mg
    manganese = Column(Numeric(10, 2), default=0)  # mg
    chromium = Column(Numeric(10, 2), default=0)  # mcg
    molybdenum = Column(Numeric(10, 2), default=0)  # mcg
    chloride = Column(Numeric(10, 2), default=0)  # mg
    choline = Column(Numeric(10, 2), default=0)  # mg
    
    # Per unit configuration
    per_amount = Column(Numeric(10, 2), default=100)  # Default 100g
    per_unit = Column(String(10), default="g")  # g or ml
    
    # Metadata
    is_verified = Column(Boolean, default=False)  # Admin verified data
    source = Column(String(255))  # Where the data came from
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
