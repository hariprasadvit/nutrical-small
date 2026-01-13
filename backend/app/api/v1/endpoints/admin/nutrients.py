"""
Admin Nutrient Definition Endpoints
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import require_admin
from app.models.nutrient_definition import NutrientDefinition
from app.models.label_type_nutrient import LabelTypeNutrient
from app.schemas import (
    NutrientDefinitionCreate,
    NutrientDefinitionUpdate,
    NutrientDefinitionResponse,
    PaginatedResponse,
)

router = APIRouter()


@router.get("", response_model=List[NutrientDefinitionResponse])
async def list_nutrients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """List all nutrient definitions (admin only)"""
    query = select(NutrientDefinition)

    if category:
        query = query.where(NutrientDefinition.category == category)
    if is_active is not None:
        query = query.where(NutrientDefinition.is_active == is_active)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (NutrientDefinition.name_en.ilike(search_pattern)) |
            (NutrientDefinition.key.ilike(search_pattern))
        )

    query = query.order_by(NutrientDefinition.default_order, NutrientDefinition.name_en)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    nutrients = result.scalars().all()

    return nutrients


@router.get("/categories", response_model=List[str])
async def get_nutrient_categories(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Get all unique nutrient categories (admin only)"""
    result = await db.execute(
        select(NutrientDefinition.category)
        .distinct()
        .where(NutrientDefinition.category.isnot(None))
        .order_by(NutrientDefinition.category)
    )
    categories = [row[0] for row in result.fetchall()]
    return categories


@router.post("", response_model=NutrientDefinitionResponse, status_code=status.HTTP_201_CREATED)
async def create_nutrient(
    data: NutrientDefinitionCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Create a new nutrient definition (admin only)"""
    # Check if key already exists
    result = await db.execute(
        select(NutrientDefinition).where(NutrientDefinition.key == data.key)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nutrient with key '{data.key}' already exists"
        )

    # Validate parent_key if provided
    if data.parent_key:
        result = await db.execute(
            select(NutrientDefinition).where(NutrientDefinition.key == data.parent_key)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parent nutrient with key '{data.parent_key}' not found"
            )

    nutrient = NutrientDefinition(**data.model_dump())
    db.add(nutrient)
    await db.commit()
    await db.refresh(nutrient)

    return nutrient


@router.get("/{nutrient_id}", response_model=NutrientDefinitionResponse)
async def get_nutrient(
    nutrient_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Get a nutrient definition by ID (admin only)"""
    result = await db.execute(
        select(NutrientDefinition).where(NutrientDefinition.id == nutrient_id)
    )
    nutrient = result.scalar_one_or_none()

    if not nutrient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nutrient not found"
        )

    return nutrient


@router.get("/by-key/{key}", response_model=NutrientDefinitionResponse)
async def get_nutrient_by_key(
    key: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Get a nutrient definition by key (admin only)"""
    result = await db.execute(
        select(NutrientDefinition).where(NutrientDefinition.key == key)
    )
    nutrient = result.scalar_one_or_none()

    if not nutrient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nutrient with key '{key}' not found"
        )

    return nutrient


@router.put("/{nutrient_id}", response_model=NutrientDefinitionResponse)
async def update_nutrient(
    nutrient_id: UUID,
    data: NutrientDefinitionUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Update a nutrient definition (admin only)"""
    result = await db.execute(
        select(NutrientDefinition).where(NutrientDefinition.id == nutrient_id)
    )
    nutrient = result.scalar_one_or_none()

    if not nutrient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nutrient not found"
        )

    # Check key uniqueness if changing
    if data.key and data.key != nutrient.key:
        result = await db.execute(
            select(NutrientDefinition).where(NutrientDefinition.key == data.key)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nutrient with key '{data.key}' already exists"
            )

    # Validate parent_key if provided
    update_data = data.model_dump(exclude_unset=True)
    if "parent_key" in update_data and update_data["parent_key"]:
        result = await db.execute(
            select(NutrientDefinition).where(NutrientDefinition.key == update_data["parent_key"])
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parent nutrient with key '{update_data['parent_key']}' not found"
            )

    # Update fields
    for field, value in update_data.items():
        setattr(nutrient, field, value)

    await db.commit()
    await db.refresh(nutrient)

    return nutrient


@router.delete("/{nutrient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_nutrient(
    nutrient_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Delete a nutrient definition (admin only)

    Will fail if nutrient is used in any label type configurations.
    """
    result = await db.execute(
        select(NutrientDefinition).where(NutrientDefinition.id == nutrient_id)
    )
    nutrient = result.scalar_one_or_none()

    if not nutrient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nutrient not found"
        )

    # Check if nutrient is used in any label type configurations
    result = await db.execute(
        select(func.count(LabelTypeNutrient.id))
        .where(LabelTypeNutrient.nutrient_id == nutrient_id)
    )
    usage_count = result.scalar()

    if usage_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete nutrient: it is used in {usage_count} label type configuration(s)"
        )

    # Check if any nutrients have this as parent
    result = await db.execute(
        select(func.count(NutrientDefinition.id))
        .where(NutrientDefinition.parent_key == nutrient.key)
    )
    child_count = result.scalar()

    if child_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete nutrient: {child_count} nutrient(s) have it as parent"
        )

    await db.delete(nutrient)
    await db.commit()


@router.post("/bulk", response_model=List[NutrientDefinitionResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_nutrients(
    nutrients: List[NutrientDefinitionCreate],
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Bulk create nutrient definitions (admin only)

    Skips nutrients that already exist by key.
    """
    created = []

    for nutrient_data in nutrients:
        # Check if key already exists
        result = await db.execute(
            select(NutrientDefinition).where(NutrientDefinition.key == nutrient_data.key)
        )
        if result.scalar_one_or_none():
            continue  # Skip existing

        nutrient = NutrientDefinition(**nutrient_data.model_dump())
        db.add(nutrient)
        created.append(nutrient)

    await db.commit()

    # Refresh all created nutrients
    for nutrient in created:
        await db.refresh(nutrient)

    return created


@router.put("/{nutrient_id}/toggle-active", response_model=NutrientDefinitionResponse)
async def toggle_nutrient_active(
    nutrient_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Toggle nutrient active status (admin only)"""
    result = await db.execute(
        select(NutrientDefinition).where(NutrientDefinition.id == nutrient_id)
    )
    nutrient = result.scalar_one_or_none()

    if not nutrient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nutrient not found"
        )

    nutrient.is_active = not nutrient.is_active
    await db.commit()
    await db.refresh(nutrient)

    return nutrient
