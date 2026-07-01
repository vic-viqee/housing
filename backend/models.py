"""
  =====================================================
  models.py — SQLAlchemy ORM Models
  =====================================================
  This defines the database schema using SQLAlchemy's
  ORM (Object-Relational Mapping) pattern.

  WHAT IS AN ORM?
  Instead of writing SQL like:
      INSERT INTO listings (title, price) VALUES ('Bedsit', 4500);
  We write Python:
      Listing(title='Bedsit', price=4500)
      db.add(listing)

  The ORM translates Python objects to database rows
  and vice versa. This makes the code cleaner and
  database-agnostic (switch from SQLite to PostgreSQL
  by changing one line).

  TABLE: listings
  This table stores all rental listing data.
  Each column is a field in our data model.

  DATA TYPES:
  - Integer:   whole number (for IDs, counts)
  - String:    text with max length
  - Float:     decimal number (for prices)
  - Text:      longer text (unbounded length)
  - Boolean:   True/False
  - DateTime:  date and time
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, func
from backend.database import Base


class Listing(Base):
    """
    The Listing model represents a single rental listing.
    Each attribute is a column in the 'listings' database table.

    SQLAlchemy maps: class attribute → database column
    Example: self.title maps to the 'title' column in SQLite.
    """
    # __tablename__ tells SQLAlchemy the table name in the database
    __tablename__ = "listings"

    # Primary key — unique identifier for each listing
    # Auto-incremented by SQLite
    id = Column(Integer, primary_key=True, index=True)

    # Listing details
    title = Column(String(200), nullable=False)       # e.g., "Modern Tiled Bedsit"
    description = Column(Text, default="")             # Longer description (no length limit)
    price = Column(Float, nullable=False)              # Monthly rent in KSh

    # Location
    city = Column(String(100), nullable=False)         # e.g., "Nairobi", "Embu"
    area = Column(String(200), nullable=False)         # e.g., "Kileleshwa", "Gakwegori"

    # Type of listing
    # Stored as string code: "bedsit", "single_room", or "one_bedroom"
    listing_type = Column(String(50), nullable=False)

    # Comma-separated lists stored as simple strings
    # SQLite doesn't have array types, so this is the simplest approach
    amenities = Column(Text, default="")               # "Wi-Fi,Inside Water,Gated Security"
    images = Column(Text, default="")                  # "abc123.jpg,def456.jpg"

    # Status
    verified = Column(Boolean, default=False)          # Admin verification badge

    # Landlord contact
    landlord_name = Column(String(200), nullable=False)
    landlord_phone = Column(String(50), nullable=False)

    # Timestamps — automatically set by the database
    # server_default=func.now() means the DB sets the time on INSERT
    # onupdate=func.now() means the DB updates on every UPDATE
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Area(Base):
    """
    The Area model represents a neighbourhood/estate in Embu.
    This table stores area names so that:
    1. The admin can add/remove areas
    2. Dropdowns are dynamically populated from the database
    3. Area names stay consistent across listings
    """
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
