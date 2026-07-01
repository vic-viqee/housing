"""
  =====================================================
  listings.py — Listing CRUD API Routes
  =====================================================
  This router handles ALL operations related to listings:
  - GET  /api/listings       → List listings (with filters)
  - GET  /api/listings/:id   → Get one listing
  - POST /api/listings       → Create a listing
  - PUT  /api/listings/:id   → Update a listing
  - DELETE /api/listings/:id → Delete a listing

  CRUD stands for Create, Read, Update, Delete.
  These are the four basic operations for persistent storage.

  Each route function is an async Python function that:
  1. Receives URL parameters and/or request body
  2. Gets a database session (from the get_db dependency)
  3. Performs database operations
  4. Returns a response (Pydantic model or dict)
  5. If something goes wrong, raises HTTPException

  HOW FASTAPI ROUTES WORK:
  @router.get("/path") — decorator that registers this function
  to handle GET requests at the given path.
  The function parameters define what FastAPI expects:
  - Query params (city, min_price, etc.): just name them
  - Path params ({listing_id}): match the URL pattern
  - Request body (data: ListingCreate): validated by Pydantic
  - Dependencies (db: AsyncSession = Depends(get_db)): injected
"""

import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Listing
from backend.schemas import ListingCreate, ListingResponse, ListingUpdate

# Create the router. prefix="/api/listings" means all routes
# here are mounted at /api/listings. So @router.get("") becomes
# GET /api/listings, @router.get("/{id}") becomes GET /api/listings/5.
router = APIRouter(prefix="/api/listings", tags=["listings"])

# Directory where uploaded images are stored
# Path is relative to the project root
UPLOAD_DIR = "backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ===================== LIST (with filters) =====================
@router.get("", response_model=list[ListingResponse])
async def list_listings(
    # Query parameters (optional — user can include none, some, or all)
    city: Optional[str] = None,           # Filter by city name (defaults to Embu on frontend)
    area: Optional[str] = None,           # Filter by specific area/estate (e.g., "Gakwegori")
    min_price: Optional[float] = None,    # Minimum price (KSh)
    max_price: Optional[float] = None,    # Maximum price (KSh)
    listing_type: Optional[str] = None,   # "bedsit", "single_room", "one_bedroom"
    search: Optional[str] = None,         # Text search across title, area, description, city
    db: AsyncSession = Depends(get_db),   # Database session from FastAPI dependency injection
):
    """
    GET /api/listings
    Returns a list of listings, newest first.
    All filter parameters are optional — omit them to get everything.

    SQLAlchemy: Building queries with .where()
    We start with a base query (select all, newest first) and
    chain .where() calls for each active filter.
    ilike() is case-insensitive LIKE — matches "nairobi", "Nairobi", "NAIROBI".
    The % symbols are SQL wildcards — %search% matches any string containing "search".
    """

    # Base query: select all listings, ordered by newest first
    stmt = select(Listing).order_by(Listing.created_at.desc())

    # Apply filters one by one if they're provided
    if city:
        # ilike does case-insensitive matching
        stmt = stmt.where(Listing.city.ilike(f"%{city}%"))
    if area:
        # Exact match on area (case-insensitive)
        stmt = stmt.where(Listing.area.ilike(f"%{area}%"))
    if min_price is not None:
        # >= means "greater than or equal to"
        stmt = stmt.where(Listing.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Listing.price <= max_price)
    if listing_type:
        # Exact match on listing_type
        stmt = stmt.where(Listing.listing_type == listing_type)
    if search:
        # Search across multiple fields using OR (|)
        like = f"%{search}%"
        stmt = stmt.where(
            Listing.title.ilike(like)
            | Listing.area.ilike(like)              # Area/estate name
            | Listing.description.ilike(like)        # Full description
            | Listing.city.ilike(like)               # City name
        )

    # Execute the query and get all results
    result = await db.execute(stmt)
    listings = result.scalars().all()
    return listings


# ===================== GET ONE =====================
@router.get("/{listing_id}", response_model=ListingResponse)
async def get_listing(
    listing_id: int,                              # From URL path: /api/listings/5
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/listings/{listing_id}
    Returns a single listing by its ID.
    If not found, returns 404 with an error message.
    """
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


# ===================== CREATE =====================
@router.post("", response_model=ListingResponse, status_code=201)
async def create_listing(
    # Form fields (not JSON!) because the client sends multipart/form-data with images
    title: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    city: str = Form(...),
    area: str = Form(...),
    listing_type: str = Form(...),
    amenities: str = Form(""),
    landlord_name: str = Form(...),
    landlord_phone: str = Form(...),
    # Uploaded files — list of files, default empty
    images: list[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/listings
    Creates a new listing. Accepts multipart/form-data so
    clients can upload images along with text fields.

    IMAGE STORAGE PATTERN:
    1. For each uploaded image, generate a unique filename
       using UUID (universally unique identifier).
    2. Save the file to backend/uploads/
    3. Store only the filename (not the full path) in the database
    4. Images are served via the /api/images/ static mount

    Why UUID instead of the original filename?
    - Avoids filename collisions (two users uploading "room.jpg")
    - Prevents security issues (e.g., "../etc/passwd" in filename)
    """
    saved_images = []
    for img in images:
        # Extract file extension from original filename (e.g., ".jpg")
        ext = os.path.splitext(img.filename)[1] if img.filename else ".jpg"
        # Generate a unique UUID-based filename
        filename = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(UPLOAD_DIR, filename)
        # Read the uploaded file contents and write to disk
        content = await img.read()
        with open(path, "wb") as f:
            f.write(content)
        saved_images.append(filename)

    # Create a new Listing ORM object
    listing = Listing(
        title=title,
        description=description,
        price=price,
        city=city,
        area=area,
        listing_type=listing_type,
        amenities=amenities,
        images=",".join(saved_images),      # Comma-separated filenames
        landlord_name=landlord_name,
        landlord_phone=landlord_phone,
    )

    # Add to database session, commit, and refresh
    # refresh() reloads the object from DB (gets the auto-generated id, timestamps)
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing


# ===================== UPDATE =====================
@router.put("/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: int,
    data: ListingUpdate,                          # Only fields that are included get updated
    db: AsyncSession = Depends(get_db),
):
    """
    PUT /api/listings/{listing_id}
    Updates an existing listing. Partial updates are supported
    — only include the fields you want to change.

    model_dump(exclude_unset=True) returns only the fields
    that the client actually sent (not the default None values).
    """
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Update only the fields that were provided
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(listing, key, value)

    await db.commit()
    await db.refresh(listing)
    return listing


# ===================== DELETE =====================
@router.delete("/{listing_id}", status_code=204)
async def delete_listing(
    listing_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    DELETE /api/listings/{listing_id}
    Deletes a listing and its associated image files.
    Returns 204 No Content on success.
    """
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Clean up: delete associated image files from disk
    images = listing.images.split(",") if listing.images else []
    for img in images:
        path = os.path.join(UPLOAD_DIR, img.strip())
        if os.path.exists(path):
            os.remove(path)

    # Delete the database record
    await db.delete(listing)
    await db.commit()
