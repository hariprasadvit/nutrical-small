"""
Product Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.product import Product, ProductIngredient
from app.models.ingredient import Ingredient
from app.schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductIngredientCreate, ProductIngredientResponse,
    NutritionSummary
)
from app.services.nutrition_calculator import NutritionCalculator

router = APIRouter()


@router.get("", response_model=List[ProductResponse])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all products for current user"""
    query = select(Product).where(Product.user_id == current_user["id"])
    
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    
    query = query.offset(skip).limit(limit).options(selectinload(Product.ingredients))
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    return products


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new product"""
    product = Product(
        user_id=current_user["id"],
        name=product_data.name,
        name_ar=product_data.name_ar,
        description=product_data.description,
        description_ar=product_data.description_ar,
        serving_size=product_data.serving_size,
        serving_unit=product_data.serving_unit,
        serving_description=product_data.serving_description,
        servings_per_container=product_data.servings_per_container,
    )
    
    db.add(product)
    await db.commit()
    await db.refresh(product)
    
    # Add ingredients if provided
    if product_data.ingredients:
        for ing_data in product_data.ingredients:
            product_ingredient = ProductIngredient(
                product_id=product.id,
                ingredient_id=ing_data.ingredient_id,
                quantity=ing_data.quantity,
                unit=ing_data.unit,
                display_name=ing_data.display_name,
                display_name_ar=ing_data.display_name_ar,
                display_order=ing_data.display_order,
            )
            db.add(product_ingredient)
        await db.commit()
    
    return product


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get product by ID with calculated nutrition"""
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.user_id == current_user["id"])
        .options(selectinload(Product.ingredients))
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product_data: ProductUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a product"""
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.user_id == current_user["id"])
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update fields
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    await db.commit()
    await db.refresh(product)
    
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a product"""
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.user_id == current_user["id"])
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.delete(product)
    await db.commit()


@router.get("/{product_id}/nutrition", response_model=NutritionSummary)
async def get_product_nutrition(
    product_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Calculate nutrition facts for a product"""
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.user_id == current_user["id"])
        .options(selectinload(Product.ingredients))
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get ingredient details
    ingredients_data = []
    total_weight = 0
    
    for pi in product.ingredients:
        ing_result = await db.execute(
            select(Ingredient).where(Ingredient.id == pi.ingredient_id)
        )
        ingredient = ing_result.scalar_one_or_none()
        if ingredient:
            ingredients_data.append({
                "ingredient": {
                    "calories": float(ingredient.calories),
                    "total_fat": float(ingredient.total_fat),
                    "saturated_fat": float(ingredient.saturated_fat),
                    "trans_fat": float(ingredient.trans_fat),
                    "cholesterol": float(ingredient.cholesterol),
                    "sodium": float(ingredient.sodium),
                    "total_carbs": float(ingredient.total_carbs),
                    "dietary_fiber": float(ingredient.dietary_fiber),
                    "total_sugars": float(ingredient.total_sugars),
                    "added_sugars": float(ingredient.added_sugars),
                    "protein": float(ingredient.protein),
                    "vitamin_d": float(ingredient.vitamin_d),
                    "calcium": float(ingredient.calcium),
                    "iron": float(ingredient.iron),
                    "potassium": float(ingredient.potassium),
                    "per_amount": float(ingredient.per_amount),
                },
                "quantity": float(pi.quantity),
            })
            total_weight += float(pi.quantity)
    
    # Calculate nutrition
    from decimal import Decimal
    nutrition = NutritionCalculator.calculate_from_ingredients(
        ingredients=ingredients_data,
        serving_size=Decimal(str(product.serving_size)),
        serving_unit=product.serving_unit,
        total_recipe_weight=Decimal(str(total_weight)),
    )
    
    return nutrition


@router.post("/{product_id}/ingredients", response_model=ProductIngredientResponse)
async def add_ingredient_to_product(
    product_id: UUID,
    ingredient_data: ProductIngredientCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add an ingredient to a product"""
    # Verify product belongs to user
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.user_id == current_user["id"])
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Verify ingredient exists
    result = await db.execute(
        select(Ingredient).where(Ingredient.id == ingredient_data.ingredient_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    # Add to product
    product_ingredient = ProductIngredient(
        product_id=product_id,
        ingredient_id=ingredient_data.ingredient_id,
        quantity=ingredient_data.quantity,
        unit=ingredient_data.unit,
        display_name=ingredient_data.display_name,
        display_name_ar=ingredient_data.display_name_ar,
        display_order=ingredient_data.display_order,
    )
    
    db.add(product_ingredient)
    await db.commit()
    await db.refresh(product_ingredient)
    
    return product_ingredient


@router.delete("/{product_id}/ingredients/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_ingredient_from_product(
    product_id: UUID,
    ingredient_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove an ingredient from a product"""
    result = await db.execute(
        select(ProductIngredient)
        .join(Product)
        .where(
            ProductIngredient.product_id == product_id,
            ProductIngredient.ingredient_id == ingredient_id,
            Product.user_id == current_user["id"]
        )
    )
    pi = result.scalar_one_or_none()
    
    if not pi:
        raise HTTPException(status_code=404, detail="Product ingredient not found")
    
    await db.delete(pi)
    await db.commit()
