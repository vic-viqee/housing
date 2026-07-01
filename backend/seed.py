"""
  =====================================================
  seed.py — Database Seeder (Embu Edition)
  =====================================================
  This script populates the database with sample data
  for student housing near University of Embu.

  HOW TO RUN:
      python -m backend.seed

  AREAS COVERED:
  - Gakwegori (near Gate A) — most popular student area
  - Kangaru — market area, affordable rooms
  - Njukiri — quiet residential area
  - Iveche — near the university
  - Kamiu — estate with good access
  - Koimugo — student-friendly compound area
  - Town (Embu Town) — central location
  - Karurumo — nearby residential
  - Kanyakumu — growing student area
  - Kianjokoma — mixed residential
"""

import asyncio
from sqlalchemy import select

from backend.database import async_session, init_db
from backend.models import Listing, Area

# All city values are "Embu" since this app is Embu-focused.
# The 'area' field distinguishes different neighborhoods.

ALL_AREAS = [
    "Gakwegori", "Kangaru", "Njukiri", "Iveche", "Kamiu",
    "Koimugo", "Town", "Karurumo", "Kanyakumu", "Kianjokoma",
]

SAMPLE_LISTINGS = [
    # ======== GAKWEGORI (near Gate A) ========
    {"title": "Modern Tiled Bedsit near Gate A", "description": "Tiled bedsit just 5 minutes from University of Embu Gate A. Quiet compound with reliable water.", "price": 4500, "city": "Embu", "area": "Gakwegori", "listing_type": "bedsit", "amenities": "Inside Water,Token Meter,Wi-Fi", "verified": True, "landlord_name": "Njagi Mwangi", "landlord_phone": "0711122334"},
    {"title": "Single Room with Wi-Fi", "description": "Spacious single room in a secure compound. Walking distance to the university.", "price": 3500, "city": "Embu", "area": "Gakwegori", "listing_type": "single_room", "amenities": "Borehole,Electricity,Gated Security", "verified": True, "landlord_name": "Muthoni Kirimi", "landlord_phone": "0722233445"},

    # ======== KANGARU ========
    {"title": "Affordable Bedsit near Kangaru Market", "description": "Ground floor bedsit near Kangaru market. Close to shops and matatu stage.", "price": 4000, "city": "Embu", "area": "Kangaru", "listing_type": "bedsit", "amenities": "Inside Water,Gated Security", "verified": True, "landlord_name": "Nyaga Kirimi", "landlord_phone": "0722233445"},
    {"title": "Single Room in Kangaru Estate", "description": "Budget-friendly single room with shared compound. Good for students on a tight budget.", "price": 3000, "city": "Embu", "area": "Kangaru", "listing_type": "single_room", "amenities": "Borehole,Electricity", "verified": False, "landlord_name": "Wanjiku Njoroge", "landlord_phone": "0733344556"},

    # ======== NJUKIRI ========
    {"title": "Spacious 1-Bedroom in Njukiri", "description": "Self-contained unit in Njukiri. Quiet area, good for focused study.", "price": 6000, "city": "Embu", "area": "Njukiri", "listing_type": "one_bedroom", "amenities": "Inside Water,Own Meter,Parking", "verified": True, "landlord_name": "Mugambi Gitonga", "landlord_phone": "0733344556"},
    {"title": "Bedsit near Njukiri Shopping Centre", "description": "Convenient bedsit close to shops and the university. Tiled floor.", "price": 4800, "city": "Embu", "area": "Njukiri", "listing_type": "bedsit", "amenities": "Inside Water,Token Meter,Wi-Fi", "verified": True, "landlord_name": "Njue Kinyua", "landlord_phone": "0744455667"},

    # ======== IVECHE ========
    {"title": "Bedsit in Iveche Area", "description": "Nice bedsit in Iveche with easy access to the university.", "price": 4200, "city": "Embu", "area": "Iveche", "listing_type": "bedsit", "amenities": "Borehole,Token Meter,Gated Security", "verified": True, "landlord_name": "Kinya Mugo", "landlord_phone": "0755566778"},
    {"title": "Single Room in Iveche", "description": "Single room with shared amenities. Near a kiosk and matatu route.", "price": 3200, "city": "Embu", "area": "Iveche", "listing_type": "single_room", "amenities": "Borehole,Electricity", "verified": False, "landlord_name": "Ciamwiri Njeru", "landlord_phone": "0766677889"},

    # ======== KAMIU ========
    {"title": "Executive 1-Bedroom in Kamiu", "description": "Modern 1-bedroom with own water meter and parking. Great for postgraduate students.", "price": 7000, "city": "Embu", "area": "Kamiu", "listing_type": "one_bedroom", "amenities": "Inside Water,Own Meter,Wi-Fi,Parking", "verified": True, "landlord_name": "Murithi Mugambi", "landlord_phone": "0777788990"},
    {"title": "Bedsit in Kamiu Estate", "description": "Popular among university students. Gated compound with reliable water.", "price": 5000, "city": "Embu", "area": "Kamiu", "listing_type": "bedsit", "amenities": "Inside Water,Token Meter,Wi-Fi,Gated Security", "verified": True, "landlord_name": "Njeru Nthiga", "landlord_phone": "0788899001"},

    # ======== KOIMUGO ========
    {"title": "Affordable Single Room in Koimugo", "description": "Budget-friendly room in Koimugo. Close to university bus route.", "price": 2800, "city": "Embu", "area": "Koimugo", "listing_type": "single_room", "amenities": "Borehole,Electricity", "verified": True, "landlord_name": "Kariuki Mugo", "landlord_phone": "0799900112"},
    {"title": "Bedsit in Koimugo Compound", "description": "Nice bedsit with good security. Water included in the rent.", "price": 3800, "city": "Embu", "area": "Koimugo", "listing_type": "bedsit", "amenities": "Inside Water,Gated Security", "verified": False, "landlord_name": "Wambeti Njeru", "landlord_phone": "0710011223"},

    # ======== TOWN (Embu Town) ========
    {"title": "1-Bedroom in Embu Town Centre", "description": "Self-contained unit in town. Close to supermarkets, banks, and transport.", "price": 8000, "city": "Embu", "area": "Town", "listing_type": "one_bedroom", "amenities": "Inside Water,Token Meter,Wi-Fi,Parking,Gated Security", "verified": True, "landlord_name": "Mbaabu Muthamia", "landlord_phone": "0721122334"},
    {"title": "Single Room near Town Bus Stop", "description": "Convenient single room in town. Easy matatu access to the university.", "price": 4000, "city": "Embu", "area": "Town", "listing_type": "single_room", "amenities": "Borehole,Electricity,Gated Security", "verified": True, "landlord_name": "Kiura Njeru", "landlord_phone": "0732233445"},

    # ======== KARURUMO ========
    {"title": "Bedsit in Karurumo", "description": "Spacious bedsit with plenty of natural light. Near a shopping centre.", "price": 4500, "city": "Embu", "area": "Karurumo", "listing_type": "bedsit", "amenities": "Inside Water,Token Meter,Wi-Fi", "verified": True, "landlord_name": "Ireri Njue", "landlord_phone": "0743344556"},

    # ======== KANYAKUMU ========
    {"title": "Single Room in Kanyakumu", "description": "Growing student area with good road access. Room in a modern block.", "price": 3500, "city": "Embu", "area": "Kanyakumu", "listing_type": "single_room", "amenities": "Borehole,Electricity,Gated Security", "verified": False, "landlord_name": "Njeru Nyaga", "landlord_phone": "0754455667"},

    # ======== KIANJOKOMA ========
    {"title": "1-Bedroom in Kianjokoma", "description": "Self-contained near Kianjokoma. Reliable water and own meter.", "price": 5500, "city": "Embu", "area": "Kianjokoma", "listing_type": "one_bedroom", "amenities": "Inside Water,Own Meter,Parking", "verified": True, "landlord_name": "Muriuki Ithai", "landlord_phone": "0765566778"},
]


async def seed():
    """
    Main seed function — Embu focused.
    Safe to run multiple times (idempotent — skips if data exists).
    To re-seed: delete campus_haven.db and run again.
    """
    await init_db()
    async with async_session() as session:
        # Check if data already exists
        existing = await session.execute(select(Listing))
        if existing.scalars().all():
            print("Database already has data. Skipping seed.")
            return

        # Step 1: Seed areas
        for name in ALL_AREAS:
            session.add(Area(name=name))
        await session.flush()
        print(f"Seeded {len(ALL_AREAS)} areas.")

        # Step 2: Seed listings
        for data in SAMPLE_LISTINGS:
            listing = Listing(**data)
            session.add(listing)

        await session.commit()
        print(f"Seeded {len(SAMPLE_LISTINGS)} Embu listings successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
