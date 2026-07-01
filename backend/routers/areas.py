"""
  =====================================================
  areas.py — Area API Routes (CRUD + Counts)
  =====================================================
  Manages neighbourhoods/estates in Embu:
  - GET    /api/areas       → List areas with listing counts
  - POST   /api/areas       → Create a new area
  - DELETE /api/areas/{id}  → Delete an area

  Areas are stored in their own database table so the
  admin can add/remove them and dropdowns stay in sync.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Listing, Area
from backend.schemas import AreaInfo, AreaCreate

router = APIRouter(prefix="/api/areas", tags=["areas"])


@router.get("", response_model=list[AreaInfo])
async def list_areas(db: AsyncSession = Depends(get_db)):
    """
    GET /api/areas
    Returns all areas with listing counts, ordered
    by most listings first. Only Embu listings count.
    """
    # Get all areas from the Area table
    area_rows = await db.execute(select(Area).order_by(Area.name))
    areas = area_rows.scalars().all()

    # Get listing counts per area (Embu only)
    count_rows = await db.execute(
        select(Listing.area, func.count(Listing.id).label("count"))
        .where(Listing.city == "Embu")
        .group_by(Listing.area)
    )
    counts = {row[0]: row[1] for row in count_rows.all()}

    return [
        AreaInfo(id=a.id, name=a.name, count=counts.get(a.name, 0))
        for a in areas
    ]


@router.post("", response_model=AreaInfo, status_code=201)
async def create_area(
    data: AreaCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/areas
    Create a new area. Name must be unique.
    """
    existing = await db.execute(select(Area).where(Area.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Area already exists")

    area = Area(name=data.name)
    db.add(area)
    await db.commit()
    await db.refresh(area)
    return AreaInfo(id=area.id, name=area.name, count=0)


@router.delete("/{area_id}", status_code=204)
async def delete_area(
    area_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    DELETE /api/areas/{area_id}
    Delete an area. Only succeeds if no listings use this area.
    """
    result = await db.execute(select(Area).where(Area.id == area_id))
    area = result.scalar_one_or_none()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    # Check if any listings use this area
    stmt = select(Listing).where(Listing.area == area.name).limit(1)
    existing_listing = await db.execute(stmt)
    if existing_listing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete area '{area.name}' — it still has active listings. Delete or reassign them first.",
        )

    await db.delete(area)
    await db.commit()
