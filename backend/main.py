from pathlib import Path
import sys
import os
import time
import traceback

from fastapi import FastAPI, Request, status, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError

# Project root
project_root = Path(__file__).resolve().parents[1]
os.chdir(project_root)

if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Backend imports
from backend.config import settings
from backend.database import (
    engine,
    Base,
    get_db,
    DATABASE_URL as ACTIVE_DATABASE_URL,
)

# IMPORTANT: Import models BEFORE create_all()
import backend.models

from backend.routes import (
    auth,
    transactions,
    goals,
    fraud,
    subscriptions,
    payments,
    students,
    ai_assistant,
    serpapi,
    notifications,
    friendsplit,
)

# Create all database tables
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully.")
except Exception:
    traceback.print_exc()

# FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Futuristic Unified Full-Stack Banking Intelligence & Autonomous Forensic Security Core.",
    version="1.0.0",
    docs_url="/docs" if os.environ.get("ENV") != "production" else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": str(exc.detail),
        },
    )


@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    print(exc)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
        },
    )


# Middleware
@app.middleware("http")
async def process_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time-Ms"] = str(int((time.time() - start) * 1000))
    return response


# Health API
@app.get("/health")
def health():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        return {
            "status": "healthy",
            "database": ACTIVE_DATABASE_URL,
            "tables": tables,
        }

    except SQLAlchemyError as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }


# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(fraud.router, prefix="/api")
app.include_router(subscriptions.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(ai_assistant.router, prefix="/api")
app.include_router(serpapi.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(friendsplit.router, prefix="/api")


@app.post("/api/user/spend-alerts")
def toggle_spend_alerts(payload: dict, request: Request, db=Depends(get_db)):
    from backend.routes.auth import get_current_user, USER_CONFIGS

    user = get_current_user(request, db)

    enabled = payload.get("enabled", False)
    USER_CONFIGS[user.id] = enabled

    return {
        "success": True,
        "spendAlertsEnabled": enabled,
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )