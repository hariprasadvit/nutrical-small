"""
Template Endpoints - Label Template Builder
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.template import Template
from app.schemas import TemplateCreate, TemplateUpdate, TemplateResponse

router = APIRouter()


@router.get("", response_model=List[TemplateResponse])
async def list_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = None,
    include_presets: bool = True,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List templates (user's own + public presets)"""
    query = select(Template)
    
    if include_presets:
        # User's templates OR preset templates
        query = query.where(
            or_(
                Template.user_id == current_user["id"],
                Template.is_preset == True
            )
        )
    else:
        query = query.where(Template.user_id == current_user["id"])
    
    if type:
        query = query.where(Template.type == type)
    
    query = query.offset(skip).limit(limit).order_by(Template.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/presets", response_model=List[TemplateResponse])
async def list_preset_templates(
    type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List system preset templates"""
    query = select(Template).where(Template.is_preset == True)
    
    if type:
        query = query.where(Template.type == type)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get template by ID"""
    result = await db.execute(
        select(Template).where(
            Template.id == template_id,
            or_(
                Template.user_id == current_user["id"],
                Template.is_preset == True,
                Template.is_public == True
            )
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new template"""
    template = Template(
        user_id=current_user["id"],
        name=template_data.name,
        description=template_data.description,
        type=template_data.type,
        width=template_data.width,
        height=template_data.height,
        language=template_data.language,
        elements=[e.model_dump() for e in template_data.elements] if template_data.elements else [],
        styles=template_data.styles.model_dump() if template_data.styles else {},
        nutrition_config=template_data.nutrition_config.model_dump() if template_data.nutrition_config else {},
        display_preferences=template_data.display_preferences.model_dump() if template_data.display_preferences else {},
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    return template


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: UUID,
    template_data: TemplateUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a template"""
    result = await db.execute(
        select(Template).where(
            Template.id == template_id,
            Template.user_id == current_user["id"]
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found or not owned by user")
    
    update_data = template_data.model_dump(exclude_unset=True)
    
    # Handle nested objects
    if "elements" in update_data and update_data["elements"]:
        update_data["elements"] = [e.model_dump() if hasattr(e, 'model_dump') else e for e in update_data["elements"]]
    if "styles" in update_data and update_data["styles"]:
        update_data["styles"] = update_data["styles"].model_dump() if hasattr(update_data["styles"], 'model_dump') else update_data["styles"]
    if "nutrition_config" in update_data and update_data["nutrition_config"]:
        update_data["nutrition_config"] = update_data["nutrition_config"].model_dump() if hasattr(update_data["nutrition_config"], 'model_dump') else update_data["nutrition_config"]
    if "display_preferences" in update_data and update_data["display_preferences"]:
        update_data["display_preferences"] = update_data["display_preferences"].model_dump() if hasattr(update_data["display_preferences"], 'model_dump') else update_data["display_preferences"]
    
    for field, value in update_data.items():
        setattr(template, field, value)
    
    await db.commit()
    await db.refresh(template)
    
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a template"""
    result = await db.execute(
        select(Template).where(
            Template.id == template_id,
            Template.user_id == current_user["id"]
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found or not owned by user")
    
    await db.delete(template)
    await db.commit()


@router.post("/{template_id}/duplicate", response_model=TemplateResponse)
async def duplicate_template(
    template_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Duplicate a template (including presets)"""
    result = await db.execute(
        select(Template).where(
            Template.id == template_id,
            or_(
                Template.user_id == current_user["id"],
                Template.is_preset == True,
                Template.is_public == True
            )
        )
    )
    original = result.scalar_one_or_none()
    
    if not original:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Create copy
    new_template = Template(
        user_id=current_user["id"],
        name=f"{original.name} (Copy)",
        description=original.description,
        type=original.type,
        width=original.width,
        height=original.height,
        language=original.language,
        elements=original.elements,
        styles=original.styles,
        nutrition_config=original.nutrition_config,
        display_preferences=original.display_preferences,
        is_preset=False,
        is_public=False,
    )
    
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)
    
    return new_template
