"""
Allergen Endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.allergen import Allergen
from app.schemas import AllergenResponse

router = APIRouter()


@router.get("", response_model=List[AllergenResponse])
async def list_allergens(
    major_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """List all allergens"""
    query = select(Allergen).where(Allergen.is_active == True)
    
    if major_only:
        query = query.where(Allergen.is_major == True)
    
    query = query.order_by(Allergen.is_major.desc(), Allergen.name)
    
    result = await db.execute(query)
    return result.scalars().all()
