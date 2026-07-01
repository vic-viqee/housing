"""
  =====================================================
  schemas.py — Pydantic Request/Response Schemas
  =====================================================
  Pydantic schemas define the shape of data that our API
  accepts and returns. They serve TWO important roles:

  1. VALIDATION: Automatically validate incoming data.
     If a client sends a string where we expect a number,
     Pydantic returns a 422 error with a clear message.

  2. DOCUMENTATION: FastAPI uses these schemas to generate
     OpenAPI/Swagger docs at /docs. The docs show exactly
     what fields are expected and their types.

  ARCHITECTURE PATTERN: Request/Response Schemas
  - ListingCreate:  What the client sends to create a listing
  - ListingUpdate:  What the client sends to update (partial)
  - ListingResponse: What the server returns (includes id, timestamps)
  - CityInfo:        Simple city name + count
  - ContactRequest:  What a student submits to contact a landlord

  WHY SEPARATE CREATE vs RESPONSE?
  - When creating, the client doesn't provide "id", "verified",
    "created_at", etc. — the server handles those.
  - ListingResponse includes those server-generated fields.
  - This separation documents exactly what's needed for each operation.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ListingCreate(BaseModel):
    """
    Schema for creating a new listing.
    The client sends these fields in the request body.
    All are strings from the multipart form, validated by Pydantic.
    """
    title: str                                   # Required: listing title
    description: str = ""                        # Optional: defaults to empty
    price: float                                 # Required: monthly rent
    city: str                                    # Required: city name
    area: str                                    # Required: neighborhood/estate
    listing_type: str                            # Required: bedsit/single_room/one_bedroom
    amenities: str = ""                          # Optional: comma-separated
    landlord_name: str                           # Required: landlord's name
    landlord_phone: str                          # Required: landlord's phone


class ListingUpdate(BaseModel):
    """
    Schema for updating an existing listing.
    ALL fields are Optional (None by default).
    Only the fields that are included will be updated.
    This allows PATCH-style partial updates.
    """
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    listing_type: Optional[str] = None
    amenities: Optional[str] = None
    area: Optional[str] = None
    landlord_name: Optional[str] = None
    landlord_phone: Optional[str] = None
    verified: Optional[bool] = None


class ListingResponse(BaseModel):
    """
    Schema for returning a listing to the client.
    This includes ALL fields, even server-generated ones
    like id, verified, created_at, updated_at.

    model_config = {"from_attributes": True}
    This tells Pydantic to read data from ORM object attributes
    (SQLAlchemy model instances) instead of only from dicts.
    Without this, we'd have to manually convert ORM objects to dicts.
    """
    id: int
    title: str
    description: str
    price: float
    city: str
    area: str
    listing_type: str
    amenities: str
    images: str
    verified: bool
    landlord_name: str
    landlord_phone: str
    created_at: datetime
    updated_at: datetime

    # This is the Pydantic v2 way of enabling ORM mode
    model_config = {"from_attributes": True}


class AreaInfo(BaseModel):
    """
    Schema for listing an area.
    Returns the area id, name, and how many listings it has.
    """
    id: int
    name: str
    count: int = 0


class AreaCreate(BaseModel):
    """
    Schema for creating a new area.
    """
    name: str


class ContactRequest(BaseModel):
    """
    Schema for a student contacting a landlord.
    The student provides their name, phone, and an
    optional message. The landlord's phone is returned
    in the response (but not stored yet — future enhancement).
    """
    student_name: str
    student_phone: str
    message: str = ""
