from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings
import os

DATABASE_URL = settings.DATABASE_URL
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured. Please set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, and optionally DB_DRIVER."
    )

is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

try:
    print("DATABASE_URL:", DATABASE_URL)
    print("repr:", repr(DATABASE_URL))
    engine = create_engine(DATABASE_URL, future=True, connect_args=connect_args)
except Exception as create_err:
    raise RuntimeError(
        f"Failed to create database engine for '{DATABASE_URL}'. "
        f"Check DB_DRIVER, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT and DB_NAME. "
        f"Original error: {create_err}"
    ) from create_err

try:
    url_obj = make_url(DATABASE_URL)
    redacted_url = url_obj.render_as_string(hide_password=True)
except Exception:
    redacted_url = "<invalid-database-url>"

try:
    with engine.connect() as conn:
        pass
    print(f"Database Node: Successfully connected to database at {redacted_url}.")
except Exception as conn_err:
    raise RuntimeError(
        f"Failed to connect to database at {redacted_url}. "
        f"Ensure MySQL is reachable and credentials are correct. Original error: {conn_err}"
    ) from conn_err

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
