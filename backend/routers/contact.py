"""
  =====================================================
  contact.py — Contact Landlord API Route
  =====================================================
  This endpoint allows a student to submit a contact
  enquiry about a specific listing.

  HOW IT WORKS:
  1. Student fills in their name, phone, and message
  2. Frontend sends POST /api/contact/{listing_id}
  3. Backend finds the listing (or returns 404)
  4. Backend returns the landlord's name and phone
  5. Frontend shows the landlord's contact info to the student

  FUTURE ENHANCEMENT:
  Currently we just return the landlord's phone number.
  A production version would store the enquiry in the
  database and send an SMS/email notification to the landlord.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Listing
from backend.schemas import ContactRequest

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("/{listing_id}")
async def contact_landlord(
    listing_id: int,                              # Which listing the student is enquiring about
    data: ContactRequest,                         # Student's name, phone, message
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/contact/{listing_id}
    Submit a contact enquiry for a specific listing.

    Step 1: Find the listing by ID
    Step 2: If not found, return 404
    Step 3: Return the landlord's contact info so the
            student can reach out directly
    """
    # Find the listing
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Return success with landlord details
    return {
        "success": True,
        "message": f"Your enquiry has been sent to {listing.landlord_name}. They will contact you at {data.student_phone}.",
        "landlord_name": listing.landlord_name,
        "landlord_phone": listing.landlord_phone,
    }
