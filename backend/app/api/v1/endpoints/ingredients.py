"""
Ingredient Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.ingredient import Ingredient
from app.schemas import IngredientCreate, IngredientUpdate, IngredientResponse

router = APIRouter()


@router.get("", response_model=List[IngredientResponse])
async def list_ingredients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Search ingredients in master database"""
    query = select(Ingredient)
    
    if search:
        query = query.where(
            Ingredient.name.ilike(f"%{search}%") | 
            Ingredient.name_ar.ilike(f"%{search}%")
        )
    
    if category:
        query = query.where(Ingredient.category == category)
    
    query = query.offset(skip).limit(limit).order_by(Ingredient.name)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{ingredient_id}", response_model=IngredientResponse)
async def get_ingredient(
    ingredient_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get ingredient details"""
    result = await db.execute(
        select(Ingredient).where(Ingredient.id == ingredient_id)
    )
    ingredient = result.scalar_one_or_none()
    
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    return ingredient


@router.post("", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    ingredient_data: IngredientCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a new ingredient to master database"""
    ingredient = Ingredient(**ingredient_data.model_dump())
    
    db.add(ingredient)
    await db.commit()
    await db.refresh(ingredient)
    
    return ingredient


@router.put("/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: UUID,
    ingredient_data: IngredientUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an ingredient"""
    result = await db.execute(
        select(Ingredient).where(Ingredient.id == ingredient_id)
    )
    ingredient = result.scalar_one_or_none()
    
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    update_data = ingredient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ingredient, field, value)
    
    await db.commit()
    await db.refresh(ingredient)
    
    return ingredient
