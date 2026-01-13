"""
Label Endpoints - Generate and export labels
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.label import Label
from app.models.product import Product
from app.models.template import Template
from app.schemas import LabelCreate, LabelResponse, LabelExportRequest
from app.services.label_exporter import LabelExporter
from app.services.nutrition_calculator import NutritionCalculator

router = APIRouter()
exporter = LabelExporter()


@router.get("", response_model=List[LabelResponse])
async def list_labels(
    product_id: UUID = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List generated labels"""
    query = (
        select(Label)
        .join(Product)
        .where(Product.user_id == current_user["id"])
    )
    
    if product_id:
        query = query.where(Label.product_id == product_id)
    
    query = query.order_by(Label.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/preview")
async def preview_label(
    request: LabelExportRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate label preview (returns HTML)"""
    # Get product
    product_result = await db.execute(
        select(Product)
        .where(Product.id == request.product_id, Product.user_id == current_user["id"])
        .options(selectinload(Product.ingredients))
    )
    product = product_result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get template
    template_result = await db.execute(
        select(Template).where(Template.id == request.template_id)
    )
    template = template_result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Calculate nutrition (simplified for preview)
    nutrition = {
        "serving_size": float(product.serving_size),
        "serving_unit": product.serving_unit,
        "calories": 0,
        "total_fat": 0,
        "saturated_fat": 0,
        "trans_fat": 0,
        "cholesterol": 0,
        "sodium": 0,
        "total_carbs": 0,
        "dietary_fiber": 0,
        "total_sugars": 0,
        "added_sugars": 0,
        "protein": 0,
        "vitamin_d": 0,
        "calcium": 0,
        "iron": 0,
        "potassium": 0,
    }
    
    # Generate HTML preview
    html = await exporter.render_html(
        template_data={
            "type": template.type,
            "width": template.width,
            "height": template.height,
            "language": template.language,
            "elements": template.elements,
            "styles": template.styles,
            "nutrition_config": template.nutrition_config,
            "display_preferences": template.display_preferences,
        },
        product_data={
            "name": product.name,
            "ingredients_text": "",  # TODO: Build from product ingredients
            "allergens_text": "",    # TODO: Build from product allergens
        },
        nutrition=nutrition
    )
    
    return Response(content=html, media_type="text/html")


@router.post("/export")
async def export_label(
    request: LabelExportRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export label as PNG, PDF, or SVG"""
    # Get product
    product_result = await db.execute(
        select(Product)
        .where(Product.id == request.product_id, Product.user_id == current_user["id"])
        .options(selectinload(Product.ingredients))
    )
    product = product_result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get template
    template_result = await db.execute(
        select(Template).where(Template.id == request.template_id)
    )
    template = template_result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Calculate nutrition
    nutrition = {
        "serving_size": float(product.serving_size),
        "serving_unit": product.serving_unit,
        "calories": 0,  # TODO: Calculate from ingredients
    }
    
    template_data = {
        "type": template.type,
        "width": template.width,
        "height": template.height,
        "language": template.language,
        "elements": template.elements,
        "styles": template.styles,
        "nutrition_config": template.nutrition_config,
        "display_preferences": template.display_preferences,
    }
    
    product_data = {
        "name": product.name,
        "ingredients_text": "",
        "allergens_text": "",
    }
    
    # Export based on format
    if request.format == "png":
        data = await exporter.export_png(template_data, product_data, nutrition)
        return Response(
            content=data,
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename={product.name}_label.png"}
        )
    
    elif request.format == "pdf":
        data = await exporter.export_pdf(template_data, product_data, nutrition)
        return Response(
            content=data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={product.name}_label.pdf"}
        )
    
    elif request.format == "svg":
        data = await exporter.export_svg(template_data, product_data, nutrition)
        return Response(
            content=data,
            media_type="image/svg+xml",
            headers={"Content-Disposition": f"attachment; filename={product.name}_label.svg"}
        )
    
    else:
        raise HTTPException(status_code=400, detail="Invalid export format")


@router.post("", response_model=LabelResponse, status_code=status.HTTP_201_CREATED)
async def create_label(
    label_data: LabelCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save a generated label"""
    # Verify product belongs to user
    product_result = await db.execute(
        select(Product)
        .where(Product.id == label_data.product_id, Product.user_id == current_user["id"])
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Verify template exists
    template_result = await db.execute(
        select(Template).where(Template.id == label_data.template_id)
    )
    if not template_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Create label
    label = Label(
        product_id=label_data.product_id,
        template_id=label_data.template_id,
        name=label_data.name,
        nutrition_snapshot={},  # TODO: Capture nutrition at time of creation
    )
    
    db.add(label)
    await db.commit()
    await db.refresh(label)
    
    return label


@router.delete("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_label(
    label_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a saved label"""
    result = await db.execute(
        select(Label)
        .join(Product)
        .where(Label.id == label_id, Product.user_id == current_user["id"])
    )
    label = result.scalar_one_or_none()
    
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    
    await db.delete(label)
    await db.commit()
