"""
Seed runner script for NutriCal CMS
Run with: python -m app.db.seeds.run_seeds
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import engine, AsyncSessionLocal, Base
from app.models.nutrient_definition import NutrientDefinition
from app.models.label_type import LabelType
from app.models.label_type_nutrient import LabelTypeNutrient
from app.models.rda_table import RDATable

from app.db.seeds.nutrients import NUTRIENT_DEFINITIONS
from app.db.seeds.rda_tables import RDA_TABLES
from app.db.seeds.label_types import LABEL_TYPES


async def seed_nutrients(session: AsyncSession) -> dict:
    """Seed nutrient definitions and return a mapping of key -> id"""
    print("Seeding nutrient definitions...")

    nutrient_map = {}

    for nutrient_data in NUTRIENT_DEFINITIONS:
        # Check if nutrient already exists
        result = await session.execute(
            select(NutrientDefinition).where(NutrientDefinition.key == nutrient_data["key"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"  - Nutrient '{nutrient_data['key']}' already exists, skipping")
            nutrient_map[nutrient_data["key"]] = existing.id
        else:
            nutrient = NutrientDefinition(**nutrient_data)
            session.add(nutrient)
            await session.flush()  # Get the ID
            nutrient_map[nutrient_data["key"]] = nutrient.id
            print(f"  + Created nutrient: {nutrient_data['name_en']}")

    await session.commit()
    print(f"✓ Seeded {len(NUTRIENT_DEFINITIONS)} nutrients")
    return nutrient_map


async def seed_rda_tables(session: AsyncSession) -> None:
    """Seed RDA tables"""
    print("\nSeeding RDA tables...")

    for rda_data in RDA_TABLES:
        # Check if RDA table already exists
        result = await session.execute(
            select(RDATable).where(RDATable.code == rda_data["code"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"  - RDA table '{rda_data['code']}' already exists, skipping")
        else:
            rda_table = RDATable(**rda_data)
            session.add(rda_table)
            print(f"  + Created RDA table: {rda_data['name']}")

    await session.commit()
    print(f"✓ Seeded {len(RDA_TABLES)} RDA tables")


async def seed_label_types(session: AsyncSession, nutrient_map: dict) -> None:
    """Seed label types and their nutrient configurations"""
    print("\nSeeding label types...")

    for label_type_data in LABEL_TYPES:
        # Extract nutrients config
        nutrients_config = label_type_data.pop("nutrients", [])

        # Check if label type already exists
        result = await session.execute(
            select(LabelType).where(LabelType.code == label_type_data["code"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"  - Label type '{label_type_data['code']}' already exists, skipping")
            label_type = existing
        else:
            label_type = LabelType(**label_type_data)
            session.add(label_type)
            await session.flush()  # Get the ID
            print(f"  + Created label type: {label_type_data['name']}")

        # Seed nutrient configurations for this label type
        for order, nutrient_config in enumerate(nutrients_config):
            nutrient_key = nutrient_config["key"]
            nutrient_id = nutrient_map.get(nutrient_key)

            if not nutrient_id:
                print(f"    ! Warning: Nutrient '{nutrient_key}' not found, skipping")
                continue

            # Check if config already exists
            result = await session.execute(
                select(LabelTypeNutrient).where(
                    LabelTypeNutrient.label_type_id == label_type.id,
                    LabelTypeNutrient.nutrient_id == nutrient_id
                )
            )
            existing_config = result.scalar_one_or_none()

            if existing_config:
                continue  # Skip if already configured

            label_nutrient = LabelTypeNutrient(
                label_type_id=label_type.id,
                nutrient_id=nutrient_id,
                is_mandatory=nutrient_config.get("is_mandatory", False),
                show_by_default=True,
                show_percent_dv=nutrient_config.get("show_percent_dv", True),
                display_order=order,
                indent_level=nutrient_config.get("indent_level", 0),
                is_bold=nutrient_config.get("is_bold", False),
            )
            session.add(label_nutrient)

    await session.commit()
    print(f"✓ Seeded {len(LABEL_TYPES)} label types with nutrient configs")


async def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Database tables created")


async def run_all_seeds():
    """Run all seed operations"""
    print("=" * 50)
    print("NutriCal CMS - Database Seeding")
    print("=" * 50)

    # Create tables first
    await create_tables()

    async with AsyncSessionLocal() as session:
        try:
            # Seed in order (nutrients first, then RDA tables, then label types)
            nutrient_map = await seed_nutrients(session)
            await seed_rda_tables(session)
            await seed_label_types(session, nutrient_map)

            print("\n" + "=" * 50)
            print("✓ All seeds completed successfully!")
            print("=" * 50)

        except Exception as e:
            await session.rollback()
            print(f"\n✗ Seeding failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(run_all_seeds())
