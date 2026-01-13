"""
API v1 Router - Combines all endpoint routers
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, products, ingredients, templates, labels, allergens
from app.api.v1.endpoints.admin import label_types, nutrients, rda_tables

api_router = APIRouter()

# Public endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(ingredients.router, prefix="/ingredients", tags=["Ingredients"])
api_router.include_router(templates.router, prefix="/templates", tags=["Templates"])
api_router.include_router(labels.router, prefix="/labels", tags=["Labels"])
api_router.include_router(allergens.router, prefix="/allergens", tags=["Allergens"])

# Admin endpoints
api_router.include_router(label_types.router, prefix="/admin/label-types", tags=["Admin - Label Types"])
api_router.include_router(nutrients.router, prefix="/admin/nutrients", tags=["Admin - Nutrients"])
api_router.include_router(rda_tables.router, prefix="/admin/rda-tables", tags=["Admin - RDA Tables"])
