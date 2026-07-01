"""
  =====================================================
  main.py — FastAPI Application Entry Point
  =====================================================
  This is the file you run to start the server:
      uvicorn backend.main:app --reload --port 8000

  It creates the FastAPI application, registers:
  - CORS middleware (so the frontend can make requests)
  - API routers (listings, cities, contact)
  - Static file mounts for uploaded images and frontend files

  APPLICATION LIFECYCLE:
  When the server starts:
  1. lifespan() runs → database tables are created
  2. The server starts listening for requests

  When a request comes in:
  1. FastAPI matches the URL to a route
  2. Runs middleware (CORS checks)
  3. Calls the route function
  4. Returns the response

  STATIC FILE SERVING:
  FastAPI serves our frontend HTML/CSS/JS files directly
  using StaticFiles. This means we don't need a separate
  web server like nginx for development. The frontend is
  served at http://localhost:8000/ and the API at /api/...
"""

import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db
from backend.routers import listings, areas, contact


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan handler — runs code on startup and shutdown.
    This replaces the deprecated on_event("startup") pattern.

    The code before "yield" runs on startup.
    The code after "yield" runs on shutdown (we don't have any).

    Here we initialize the database tables when the app starts.
    """
    await init_db()     # Create database tables if they don't exist
    yield
    # Cleanup code would go here (if needed)


# Create the FastAPI application instance
app = FastAPI(
    title="CampusHaven KE",
    version="1.0.0",
    lifespan=lifespan,              # Register the lifecycle handler
)


# ===================== CORS MIDDLEWARE =====================
# CORS (Cross-Origin Resource Sharing) controls which websites
# can make requests to our API. In development, the frontend and
# backend are on the same domain (:8000), so CORS isn't strictly
# needed. But it's good practice to have it for future use
# (e.g., a separate mobile app or different domain).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],             # Allow requests from any origin
    allow_credentials=True,
    allow_methods=["*"],             # Allow all HTTP methods
    allow_headers=["*"],             # Allow all headers
)


# ===================== API ROUTES =====================
# Register our three API routers.
# Each router has its own prefix defined in the router file.
app.include_router(listings.router)   # /api/listings/*
app.include_router(areas.router)      # /api/areas/*
app.include_router(contact.router)    # /api/contact/*


# ===================== STATIC FILES: IMAGES =====================
# Mount the uploads directory at /api/images/ so uploaded
# images are accessible via URLs like /api/images/abc123.jpg
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
os.makedirs(str(UPLOAD_DIR), exist_ok=True)

app.mount(
    "/api/images",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads",
)


# ===================== STATIC FILES: FRONTEND =====================
# Mount the entire frontend directory at "/" (root).
# html=True means index.html is served automatically when
# a directory is requested (e.g., "/" serves frontend/index.html).
# This is how our SPA shell gets loaded.
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
os.makedirs(str(FRONTEND_DIR), exist_ok=True)

if FRONTEND_DIR.exists():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIR), html=True),
        name="frontend",
    )
