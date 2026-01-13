"""
Database Models
"""

from app.models.user import User
from app.models.ingredient import Ingredient
from app.models.product import Product, ProductIngredient, ProductAllergen
from app.models.template import Template
from app.models.label import Label
from app.models.allergen import Allergen

# CMS Models
from app.models.nutrient_definition import NutrientDefinition
from app.models.label_type import LabelType
from app.models.label_type_nutrient import LabelTypeNutrient
from app.models.rda_table import RDATable

__all__ = [
    "User",
    "Ingredient",
    "Product",
    "ProductIngredient",
    "ProductAllergen",
    "Template",
    "Label",
    "Allergen",
    # CMS Models
    "NutrientDefinition",
    "LabelType",
    "LabelTypeNutrient",
    "RDATable",
]
