"""
Admin RDA Table Endpoints
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_admin
from app.models.rda_table import RDATable
from app.models.label_type import LabelType
from app.models.label_type_nutrient import LabelTypeNutrient
from app.models.nutrient_definition import NutrientDefinition
from app.schemas import (
    RDATableCreate,
    RDATableUpdate,
    RDATableResponse,
)

router = APIRouter()


@router.get("", response_model=List[RDATableResponse])
async def list_rda_tables(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    region: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """List all RDA tables (admin only)"""
    query = select(RDATable)

    if region:
        query = query.where(RDATable.region == region)
    if is_active is not None:
        query = query.where(RDATable.is_active == is_active)

    query = query.order_by(RDATable.name).offset(skip).limit(limit)

    result = await db.execute(query)
    rda_tables = result.scalars().all()

    return rda_tables


@router.post("", response_model=RDATableResponse, status_code=status.HTTP_201_CREATED)
async def create_rda_table(
    data: RDATableCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Create a new RDA table (admin only)"""
    # Check if code already exists
    result = await db.execute(
        select(RDATable).where(RDATable.code == data.code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"RDA table with code '{data.code}' already exists"
        )

    # If setting as default, unset other defaults for this region
    if data.is_default:
        result = await db.execute(
            select(RDATable).where(
                RDATable.region == data.region,
                RDATable.is_default == True
            )
        )
        existing_defaults = result.scalars().all()
        for rda in existing_defaults:
            rda.is_default = False

    # Convert values and units dicts - ensure they're serializable
    rda_data = data.model_dump()
    if rda_data.get("values"):
        rda_data["values"] = {k: float(v) if v is not None else None for k, v in rda_data["values"].items()}

    rda_table = RDATable(**rda_data)
    db.add(rda_table)
    await db.commit()
    await db.refresh(rda_table)

    return rda_table


@router.get("/{rda_table_id}", response_model=RDATableResponse)
async def get_rda_table(
    rda_table_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Get an RDA table by ID (admin only)"""
    result = await db.execute(
        select(RDATable).where(RDATable.id == rda_table_id)
    )
    rda_table = result.scalar_one_or_none()

    if not rda_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RDA table not found"
        )

    return rda_table


@router.get("/by-code/{code}", response_model=RDATableResponse)
async def get_rda_table_by_code(
    code: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Get an RDA table by code (admin only)"""
    result = await db.execute(
        select(RDATable).where(RDATable.code == code)
    )
    rda_table = result.scalar_one_or_none()

    if not rda_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"RDA table with code '{code}' not found"
        )

    return rda_table


@router.put("/{rda_table_id}", response_model=RDATableResponse)
async def update_rda_table(
    rda_table_id: UUID,
    data: RDATableUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Update an RDA table (admin only)"""
    result = await db.execute(
        select(RDATable).where(RDATable.id == rda_table_id)
    )
    rda_table = result.scalar_one_or_none()

    if not rda_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RDA table not found"
        )

    # Check code uniqueness if changing
    if data.code and data.code != rda_table.code:
        result = await db.execute(
            select(RDATable).where(RDATable.code == data.code)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"RDA table with code '{data.code}' already exists"
            )

    update_data = data.model_dump(exclude_unset=True)

    # If setting as default, unset other defaults for this region
    if update_data.get("is_default"):
        region = update_data.get("region", rda_table.region)
        result = await db.execute(
            select(RDATable).where(
                RDATable.region == region,
                RDATable.is_default == True,
                RDATable.id != rda_table_id
            )
        )
        existing_defaults = result.scalars().all()
        for rda in existing_defaults:
            rda.is_default = False

    # Convert values if present
    if "values" in update_data and update_data["values"]:
        update_data["values"] = {k: float(v) if v is not None else None for k, v in update_data["values"].items()}

    # Update fields
    for field, value in update_data.items():
        setattr(rda_table, field, value)

    await db.commit()
    await db.refresh(rda_table)

    return rda_table


@router.delete("/{rda_table_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rda_table(
    rda_table_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Delete an RDA table (admin only)"""
    result = await db.execute(
        select(RDATable).where(RDATable.id == rda_table_id)
    )
    rda_table = result.scalar_one_or_none()

    if not rda_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RDA table not found"
        )

    await db.delete(rda_table)
    await db.commit()


@router.post("/{rda_table_id}/apply/{label_type_id}", status_code=status.HTTP_200_OK)
async def apply_rda_to_label_type(
    rda_table_id: UUID,
    label_type_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Apply RDA values from a table to a label type's nutrient configurations (admin only)

    This updates the daily_value and daily_value_unit for each nutrient in the label type
    based on the values in the RDA table.
    """
    # Get RDA table
    result = await db.execute(
        select(RDATable).where(RDATable.id == rda_table_id)
    )
    rda_table = result.scalar_one_or_none()

    if not rda_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RDA table not found"
        )

    # Get label type
    result = await db.execute(
        select(LabelType).where(LabelType.id == label_type_id)
    )
    label_type = result.scalar_one_or_none()

    if not label_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label type not found"
        )

    # Get nutrient configs for this label type with nutrient info
    result = await db.execute(
        select(LabelTypeNutrient)
        .options(selectinload(LabelTypeNutrient.nutrient))
        .where(LabelTypeNutrient.label_type_id == label_type_id)
    )
    configs = result.scalars().all()

    updated_count = 0
    rda_values = rda_table.values or {}
    rda_units = rda_table.units or {}

    for config in configs:
        if config.nutrient and config.nutrient.key in rda_values:
            rda_value = rda_values[config.nutrient.key]
            if rda_value is not None:
                config.daily_value = rda_value
                if config.nutrient.key in rda_units:
                    config.daily_value_unit = rda_units[config.nutrient.key]
                updated_count += 1

    await db.commit()

    return {
        "message": f"Applied RDA values to {updated_count} nutrient configurations",
        "rda_table": rda_table.name,
        "label_type": label_type.name,
        "updated_count": updated_count
    }


@router.post("/{rda_table_id}/duplicate", response_model=RDATableResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_rda_table(
    rda_table_id: UUID,
    new_code: str = Query(..., min_length=1, max_length=50),
    new_name: str = Query(..., min_length=1, max_length=100),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Duplicate an RDA table with a new code and name (admin only)"""
    # Get original
    result = await db.execute(
        select(RDATable).where(RDATable.id == rda_table_id)
    )
    original = result.scalar_one_or_none()

    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RDA table not found"
        )

    # Check new code doesn't exist
    result = await db.execute(
        select(RDATable).where(RDATable.code == new_code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"RDA table with code '{new_code}' already exists"
        )

    # Create copy
    new_rda_table = RDATable(
        name=new_name,
        code=new_code,
        description=original.description,
        region=original.region,
        effective_date=original.effective_date,
        calorie_base=original.calorie_base,
        values=original.values.copy() if original.values else {},
        units=original.units.copy() if original.units else {},
        is_active=True,
        is_default=False,  # Duplicates are never default
    )
    db.add(new_rda_table)
    await db.commit()
    await db.refresh(new_rda_table)

    return new_rda_table


@router.get("/regions/list", response_model=List[str])
async def get_rda_regions(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Get all unique regions from RDA tables (admin only)"""
    result = await db.execute(
        select(RDATable.region)
        .distinct()
        .where(RDATable.region.isnot(None))
        .order_by(RDATable.region)
    )
    regions = [row[0] for row in result.fetchall()]
    return regions
