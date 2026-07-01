CampusHaven KE is a student housing platform focused on **Embu, Kenya** — specifically areas around University of Embu.

---

## Features

- **Area-based browsing** — Pick a neighbourhood (Gakwegori, Kangaru, Njukiri, etc.)
- **Search & filter** — Filter by price range, room type, or keyword search
- **Listing detail** — Full info, amenities, photos, and landlord contact
- **Contact landlords** — Send an enquiry directly from a listing
- **List your room** — Landlords can submit rooms with photos
- **Safety tips** — Help and guidance for students

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (SPA) |
| Backend | Python 3.10+, FastAPI |
| Database | SQLite (via SQLAlchemy async) |
| Image storage | Local filesystem (`backend/uploads/`) |

## Getting Started

### 1. Create and activate a Python virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Seed the database

```bash
python -m backend.seed
```

### 4. Run the server

```bash
uvicorn backend.main:app --reload --port 8000
```

Open http://localhost:8000 in your browser.

## Areas Covered

| Area | Description |
|------|-------------|
| Gakwegori | Near University of Embu Gate A |
| Kangaru | Market area, affordable rooms |
| Njukiri | Quiet residential |
| Iveche | Near the university |
| Kamiu | Student-friendly estate |
| Koimugo | Residential compound area |
| Town | Embu Town centre |
| Karurumo | Nearby residential |
| Kanyakumu | Growing student area |
| Kianjokoma | Mixed residential |

## Project Structure

```
housing/
├── README.md
├── AGENTS.md
├── requirements.txt
├── backend/
│   ├── main.py              # FastAPI app + static file serving
│   ├── database.py           # Async SQLAlchemy engine + session
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── seed.py               # Database seeder (sample data)
│   ├── uploads/              # Uploaded images (gitignored)
│   └── routers/
│       ├── listings.py       # CRUD + search/filter for listings
│       ├── cities.py         # City list with listing counts
│       └── contact.py        # Contact-landlord endpoint
├── frontend/
│   ├── index.html            # SPA shell
│   ├── css/
│   │   └── style.css         # All styles
│   └── js/
│       ├── api.js            # API fetch wrappers
│       ├── state.js          # App state object
│       ├── render.js         # HTML render functions per page
│       ├── router.js         # Hash-based SPA router + event handlers
│       └── app.js            # Entry point
└── images/                   # Static placeholder images
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/listings` | List listings (query: `city`, `area`, `min_price`, `max_price`, `listing_type`, `search`) |
| GET | `/api/listings/:id` | Get a single listing |
| POST | `/api/listings` | Create a listing (multipart form with optional images) |
| PUT | `/api/listings/:id` | Update a listing |
| DELETE | `/api/listings/:id` | Delete a listing |
| GET | `/api/areas` | List areas within Embu with listing counts |
| POST | `/api/contact/:id` | Submit a contact enquiry for a listing |
| GET | `/api/images/:filename` | Serve uploaded images |

## License

MIT
