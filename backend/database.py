"""
  =====================================================
  database.py — Database Engine & Session Setup
  =====================================================
  This module sets up the connection to our SQLite
  database using SQLAlchemy's async API.

  WHY SQLite + SQLAlchemy Async?
  - SQLite: Zero-config, file-based database. Perfect for
    development and small projects. No server to install.
  - SQLAlchemy: The most popular Python ORM. It lets us
    work with database rows as Python objects instead of
    writing raw SQL. The async version allows FastAPI to
    handle other requests while waiting for the database.

  KEY COMPONENTS:
  1. engine    — The database connection pool
  2. session   — A short-lived "conversation" with the DB
  3. Base      — Declarative base class for our models
  4. get_db    — FastAPI dependency that provides a session
  5. init_db   — Creates tables on startup

  CONNECTION URL:
  sqlite+aiosqlite:///./backend/campus_haven.db
  - sqlite:    using SQLite database
  - +aiosqlite: using the async driver (supports async/await)
  - ///./:     relative path from the project root
  - campus_haven.db: the actual file that stores all data
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

# The database file path (relative to the project root)
# "echo=True" would log all SQL queries to console
DATABASE_URL = "sqlite+aiosqlite:///./backend/campus_haven.db"

# Create the async engine — this is the connection pool
# that manages all database connections.
engine = create_async_engine(DATABASE_URL, echo=False)

# Create a session factory. Each session is a database
# "transaction context" that we use for queries and commits.
# expire_on_commit=False means objects remain usable after commit.
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """
    Base class for all database models.
    Every SQLAlchemy model inherits from this.
    It provides the metadata that SQLAlchemy uses to
    map Python classes to database tables.
    """
    pass


async def get_db():
    """
    FastAPI dependency that provides a database session.
    When a route function includes "db: AsyncSession = Depends(get_db)",
    FastAPI automatically:
    1. Opens a new session
    2. Passes it to the route function
    3. Closes the session when the request ends

    The 'yield' pattern makes this an async generator.
    FastAPI handles the lifecycle (open → yield → close).
    """
    async with async_session() as session:
        yield session


async def init_db():
    """
    Create all database tables if they don't exist.
    This is called on application startup (in main.py's lifespan).

    How it works:
    1. engine.begin() starts a database connection
    2. Base.metadata.create_all reads all models that inherit
       from Base and generates CREATE TABLE statements
    3. run_sync runs the synchronous SQLAlchemy method in
       the async event loop via a thread pool

    This only creates tables that DON'T already exist.
    It will NOT update existing tables if you change a model.
    For that you'd need migrations (Alembic).
    """
    async with engine.begin() as conn:
        from backend.models import Listing, Area
        await conn.run_sync(Base.metadata.create_all)
