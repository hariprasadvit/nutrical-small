"""
Product model - User's products/recipes with calculated nutrition
"""

from sqlalchemy import Column, String, DateTime, Numeric, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Product(Base):
    """
    User's product/recipe with ingredients and calculated nutrition
    """
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Basic info
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255))  # Arabic name
    description = Column(Text)
    description_ar = Column(Text)
    
    # Serving configuration
    serving_size = Column(Numeric(10, 2), nullable=False)  # e.g., 250
    serving_unit = Column(String(20), nullable=False)  # g, ml, cup, etc.
    serving_description = Column(String(100))  # e.g., "1 Cup" or "2 slices"
    servings_per_container = Column(Numeric(10, 2))  # e.g., 8
    
    # Calculated totals (auto-calculated from ingredients)
    total_weight = Column(Numeric(10, 2))  # Total weight of recipe in grams
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="products")
    ingredients = relationship("ProductIngredient", back_populates="product", cascade="all, delete-orphan")
    allergens = relationship("ProductAllergen", back_populates="product", cascade="all, delete-orphan")
    labels = relationship("Label", back_populates="product", cascade="all, delete-orphan")


class ProductIngredient(Base):
    """
    Junction table linking products to ingredients with quantities
    """
    __tablename__ = "product_ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False)
    
    # Quantity used in recipe
    quantity = Column(Numeric(10, 2), nullable=False)  # Amount of ingredient
    unit = Column(String(20), nullable=False)  # g, ml, cup, tbsp, etc.
    
    # For ingredients list display
    display_name = Column(String(255))  # Override name for label
    display_name_ar = Column(String(255))
    display_order = Column(Integer, default=0)  # Order in ingredients list
    
    # Relationships
    product = relationship("Product", back_populates="ingredients")
    ingredient = relationship("Ingredient")


class ProductAllergen(Base):
    """
    Junction table for product allergens
    """
    __tablename__ = "product_allergens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    allergen_id = Column(UUID(as_uuid=True), ForeignKey("allergens.id"), nullable=False)
    
    # Contains, may contain, or free from
    status = Column(String(20), default="contains")  # contains, may_contain, free_from
    
    # Relationships
    product = relationship("Product", back_populates="allergens")
    allergen = relationship("Allergen")
