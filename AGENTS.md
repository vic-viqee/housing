# AGENTS.md — CampusHaven KE (Embu Edition)

## Project Overview

CampusHaven KE is a student housing platform focused on **Embu, Kenya**, specifically areas near University of Embu. Students browse listings by area/neighbourhood, filter by price/type, view details, and contact landlords. Landlords submit rooms with photos.

## Architecture

- **Frontend**: Vanilla JS SPA. All HTML is rendered client-side by `render.js`. The router (`router.js`) listens to `hashchange` events and loads the appropriate page. API calls go through `api.js`.
- **Backend**: FastAPI with async SQLAlchemy + SQLite. Static files (frontend + uploaded images) are served by FastAPI's `StaticFiles`.
- **Storage**: Images are stored in `backend/uploads/` and served at `/api/images/`.

## Key Files

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app, middleware, static mounts |
| `backend/database.py` | SQLAlchemy async engine, session, init |
| `backend/models.py` | `Listing` ORM model |
| `backend/schemas.py` | Pydantic schemas for API |
| `backend/routers/listings.py` | CRUD for listings + file upload |
| `backend/routers/areas.py` | Area listing with counts (replaces cities) |
| `backend/routers/contact.py` | Contact-landlord endpoint |
| `backend/seed.py` | Seeds 17 Embu listings across 10 areas |
| `frontend/index.html` | SPA shell (header, footer, #app div) |
| `frontend/css/style.css` | All styles, responsive |
| `frontend/js/api.js` | Fetch wrappers for all endpoints |
| `frontend/js/state.js` | `AppState` singleton |
| `frontend/js/render.js` | HTML template functions per view |
| `frontend/js/router.js` | Hash router + filter/contact/submit handlers |
| `frontend/js/app.js` | Initializes router on load/hashchange |

## Data Model

```
Listing {
    id, title, description, price, city (= "Embu"), area,
    listing_type, amenities (comma-sep), images (comma-sep filenames),
    verified (bool), landlord_name, landlord_phone,
    created_at, updated_at
}
```

`listing_type` values: `bedsit`, `single_room`, `one_bedroom`

## Routes (Frontend)

| Hash Route | View | Description |
|------------|------|-------------|
| `#/` | Home | Area grid + featured listings (Embu-only) |
| `#/browse` | Browse | Listings with filters, `?area=`, `?search=` |
| `#/listing/:id` | Detail | Full listing + contact form |
| `#/add` | Add Listing | Landlord submission form (Embu areas in dropdown) |
| `#/about` | About | Safety tips, help, about |

## Common Tasks

### Add a new area/neighbourhood
1. Add the area name to the `<select>` in `renderAddListing()` in `render.js`
2. Add sample listings in `backend/seed.py`
3. Re-seed: delete `backend/campus_haven.db` and run `python -m backend.seed`

### Add a new listing type
1. Add the type to `listing_type` choices in `models.py`
2. Update the `typeLabel` mapping in `render.js` (both `renderCard` and `renderDetail`)
3. Add to the filter buttons in `renderBrowse()`

### Modify the color scheme
Edit CSS variables in `frontend/css/style.css` — the primary green is `#2E7D32`, accent amber is `#FF9800`.

## Running Locally

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m backend.seed
uvicorn backend.main:app --reload --port 8000
```

Opens at http://localhost:8000

## API Conventions

- All endpoints return JSON
- Errors return `{ "detail": "message" }` with appropriate HTTP status
- `POST /api/listings` accepts `multipart/form-data`
- `POST /api/contact/:id` accepts `application/json`
- Listings can be filtered via query params: `city`, `area`, `min_price`, `max_price`, `listing_type`, `search`
- The app is Embu-focused, so `city=Embu` is always sent by the frontend

## Known Areas (10)

Gakwegori, Kangaru, Njukiri, Iveche, Kamiu, Koimugo, Town, Karurumo, Kanyakumu, Kianjokoma
