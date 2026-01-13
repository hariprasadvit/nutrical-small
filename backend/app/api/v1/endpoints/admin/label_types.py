"""
Admin Label Types Endpoints
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_admin
from app.models.label_type import LabelType
from app.models.label_type_nutrient import LabelTypeNutrient
from app.models.nutrient_definition import NutrientDefinition
from app.schemas import (
    LabelTypeCreate,
    LabelTypeUpdate,
    LabelTypeResponse,
    LabelTypeDetailResponse,
    LabelTypeNutrientCreate,
    LabelTypeNutrientUpdate,
    LabelTypeNutrientResponse,
    LabelTypeNutrientBulkUpdate,
    PaginatedResponse,
)

router = APIRouter()


@router.get("", response_model=List[LabelTypeResponse])
async def list_label_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    region: Optional[str] = None,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """List all label types (admin only)"""
    query = select(LabelType)

    if region:
        query = query.where(LabelType.region == region)
    if category:
        query = query.where(LabelType.category == category)
    if is_active is not None:
        query = query.where(LabelType.is_active == is_active)

    query = query.order_by(LabelType.name).offset(skip).limit(limit)

    result = await db.execute(query)
    label_types = result.scalars().all()

    return label_types


@router.post("", response_model=LabelTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_label_type(
    data: LabelTypeCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Create a new label type (admin only)"""
    # Check if code already exists
    result = await db.execute(
        select(LabelType).where(LabelType.code == data.code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Label type with code '{data.code}' already exists"
        )

    # Convert nested Pydantic models to dicts
    label_type_data = data.model_dump()
    if label_type_data.get("typography"):
        label_type_data["typography"] = dict(label_type_data["typography"])
    if label_type_data.get("border_config"):
        label_type_data["border_config"] = dict(label_type_data["border_config"])
    if label_type_data.get("color_scheme"):
        label_type_data["color_scheme"] = dict(label_type_data["color_scheme"])
    if label_type_data.get("footnotes"):
        label_type_data["footnotes"] = [dict(f) for f in label_type_data["footnotes"]]

    label_type = LabelType(**label_type_data)
    db.add(label_type)
    await db.commit()
    await db.refresh(label_type)

    return label_type


@router.get("/{label_type_id}", response_model=LabelTypeDetailResponse)
async def get_label_type(
    label_type_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Get a label type by ID with nutrient configurations (admin only)"""
    result = await db.execute(
        select(LabelType)
        .options(selectinload(LabelType.nutrient_configs).selectinload(LabelTypeNutrient.nutrient))
        .where(LabelType.id == label_type_id)
    )
    label_type = result.scalar_one_or_none()

    if not label_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label type not found"
        )

    # Build response with nutrient info
    response_data = {
        "id": label_type.id,
        "name": label_type.name,
        "code": label_type.code,
        "category": label_type.category,
        "description": label_type.description,
        "region": label_type.region,
        "languages": label_type.languages,
        "display_modes": label_type.display_modes,
        "daily_calorie_base": label_type.daily_calorie_base,
        "energy_unit": label_type.energy_unit,
        "sodium_display": label_type.sodium_display,
        "default_width": label_type.default_width,
        "default_height": label_type.default_height,
        "typography": label_type.typography,
        "border_config": label_type.border_config,
        "color_scheme": label_type.color_scheme,
        "footnotes": label_type.footnotes,
        "is_active": label_type.is_active,
        "is_system": label_type.is_system,
        "created_at": label_type.created_at,
        "updated_at": label_type.updated_at,
        "nutrient_configs": []
    }

    for config in label_type.nutrient_configs:
        config_data = {
            "id": config.id,
            "label_type_id": config.label_type_id,
            "nutrient_id": config.nutrient_id,
            "is_mandatory": config.is_mandatory,
            "show_by_default": config.show_by_default,
            "show_percent_dv": config.show_percent_dv,
            "display_order": config.display_order,
            "indent_level": config.indent_level,
            "is_bold": config.is_bold,
            "daily_value": config.daily_value,
            "daily_value_unit": config.daily_value_unit,
            "nutrient_key": config.nutrient.key if config.nutrient else None,
            "nutrient_name_en": config.nutrient.name_en if config.nutrient else None,
        }
        response_data["nutrient_configs"].append(config_data)

    return response_data


@router.put("/{label_type_id}", response_model=LabelTypeResponse)
async def update_label_type(
    label_type_id: UUID,
    data: LabelTypeUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Update a label type (admin only)"""
    result = await db.execute(
        select(LabelType).where(LabelType.id == label_type_id)
    )
    label_type = result.scalar_one_or_none()

    if not label_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label type not found"
        )

    # Prevent editing system label types (only allow is_active toggle)
    if label_type.is_system:
        update_data = data.model_dump(exclude_unset=True)
        if set(update_data.keys()) - {"is_active"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify system label types. Only is_active can be changed."
            )

    # Check for code uniqueness if code is being changed
    if data.code and data.code != label_type.code:
        result = await db.execute(
            select(LabelType).where(LabelType.code == data.code)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Label type with code '{data.code}' already exists"
            )

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(value, "model_dump"):
            value = value.model_dump()
        setattr(label_type, field, value)

    await db.commit()
    await db.refresh(label_type)

    return label_type


@router.delete("/{label_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_label_type(
    label_type_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Delete a label type (admin only, non-system only)"""
    result = await db.execute(
        select(LabelType).where(LabelType.id == label_type_id)
    )
    label_type = result.scalar_one_or_none()

    if not label_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label type not found"
        )

    if label_type.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system label types"
        )

    await db.delete(label_type)
    await db.commit()


@router.post("/{label_type_id}/duplicate", response_model=LabelTypeResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_label_type(
    label_type_id: UUID,
    new_code: str = Query(..., min_length=1, max_length=50),
    new_name: str = Query(..., min_length=1, max_length=100),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Duplicate a label type with a new code and name (admin only)"""
    # Get original
    result = await db.execute(
        select(LabelType)
        .options(selectinload(LabelType.nutrient_configs))
        .where(LabelType.id == label_type_id)
    )
    original = result.scalar_one_or_none()

    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label type not found"
        )

    # Check new code doesn't exist
    result = await db.execute(
        select(LabelType).where(LabelType.code == new_code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Label type with code '{new_code}' already exists"
        )

    # Create copy
    new_label_type = LabelType(
        name=new_name,
        code=new_code,
        category=original.category,
        description=original.description,
        region=original.region,
        languages=original.languages,
        display_modes=original.display_modes,
        daily_calorie_base=original.daily_calorie_base,
        energy_unit=original.energy_unit,
        sodium_display=original.sodium_display,
        default_width=original.default_width,
        default_height=original.default_height,
        typography=original.typography,
        border_config=original.border_config,
        color_scheme=original.color_scheme,
        footnotes=original.footnotes,
        is_system=False,  # Duplicates are never system types
    )
    db.add(new_label_type)
    await db.flush()

    # Copy nutrient configs
    for config in original.nutrient_configs:
        new_config = LabelTypeNutrient(
            label_type_id=new_label_type.id,
            nutrient_id=config.nutrient_id,
            is_mandatory=config.is_mandatory,
            show_by_default=config.show_by_default,
            show_percent_dv=config.show_percent_dv,
            display_order=config.display_order,
            indent_level=config.indent_level,
            is_bold=config.is_bold,
            daily_value=config.daily_value,
            daily_value_unit=config.daily_value_unit,
        )
        db.add(new_config)

    await db.commit()
    await db.refresh(new_label_type)

    return new_label_type


# ============== Nutrient Configuration Endpoints ==============


@router.get("/{label_type_id}/nutrients", response_model=List[LabelTypeNutrientResponse])
async def get_label_type_nutrients(
    label_type_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Get nutrient configurations for a label type (admin only)"""
    # Verify label type exists
    result = await db.execute(
        select(LabelType).where(LabelType.id == label_type_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label type not found"
        )

    # Get configs with nutrient info
    result = await db.execute(
        select(LabelTypeNutrient)
        .options(selectinload(LabelTypeNutrient.nutrient))
        .where(LabelTypeNutrient.label_type_id == label_type_id)
        .order_by(LabelTypeNutrient.display_order)
    )
    configs = result.scalars().all()

    # Build response with nutrient details
    response = []
    for config in configs:
        response.append({
            "id": config.id,
            "label_type_id": config.label_type_id,
            "nutrient_id": config.nutrient_id,
            "is_mandatory": config.is_mandatory,
            "show_by_default": config.show_by_default,
            "show_percent_dv": config.show_percent_dv,
            "display_order": config.display_order,
            "indent_level": config.indent_level,
            "is_bold": config.is_bold,
            "daily_value": config.daily_value,
            "daily_value_unit": config.daily_value_unit,
            "nutrient_key": config.nutrient.key if config.nutrient else None,
            "nutrient_name_en": config.nutrient.name_en if config.nutrient else None,
        })

    return response


@router.put("/{label_type_id}/nutrients", response_model=List[LabelTypeNutrientResponse])
async def bulk_update_label_type_nutrients(
    label_type_id: UUID,
    data: LabelTypeNutrientBulkUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Bulk update nutrient configurations for a label type (admin only)

    This replaces all existing nutrient configs with the provided list.
    """
    # Verify label type exists and is not system
    result = await db.execute(
        select(LabelType).where(LabelType.id == label_type_id)
    )
    label_type = result.scalar_one_or_none()

    if not label_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label type not found"
        )

    # Delete existing configs
    result = await db.execute(
        select(LabelTypeNutrient).where(LabelTypeNutrient.label_type_id == label_type_id)
    )
    existing_configs = result.scalars().all()
    for config in existing_configs:
        await db.delete(config)

    # Create new configs
    for nutrient_data in data.nutrients:
        # Verify nutrient exists
        result = await db.execute(
            select(NutrientDefinition).where(NutrientDefinition.id == nutrient_data.nutrient_id)
        )
        nutrient = result.scalar_one_or_none()
        if not nutrient:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nutrient with ID '{nutrient_data.nutrient_id}' not found"
            )

        config = LabelTypeNutrient(
            label_type_id=label_type_id,
            **nutrient_data.model_dump()
        )
        db.add(config)

    await db.commit()

    # Return updated list
    return await get_label_type_nutrients(label_type_id, db, _admin)


@router.post("/{label_type_id}/nutrients/reorder", response_model=List[LabelTypeNutrientResponse])
async def reorder_label_type_nutrients(
    label_type_id: UUID,
    nutrient_ids: List[UUID],
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Reorder nutrients for a label type by providing ordered list of nutrient IDs (admin only)"""
    # Verify label type exists
    result = await db.execute(
        select(LabelType).where(LabelType.id == label_type_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label type not found"
        )

    # Get existing configs
    result = await db.execute(
        select(LabelTypeNutrient)
        .where(LabelTypeNutrient.label_type_id == label_type_id)
    )
    configs = {config.nutrient_id: config for config in result.scalars().all()}

    # Update display order based on provided order
    for order, nutrient_id in enumerate(nutrient_ids):
        if nutrient_id in configs:
            configs[nutrient_id].display_order = order

    await db.commit()

    # Return updated list
    return await get_label_type_nutrients(label_type_id, db, _admin)
