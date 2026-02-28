import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base, SessionLocal
from routers import books_router, members_router, loans_router, reports_router, auth_router, settings_router
from models import User, Setting  # noqa: F401 — ensure tables are created

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Library Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(books_router)
app.include_router(members_router)
app.include_router(loans_router)
app.include_router(reports_router)
app.include_router(settings_router)

# Serve uploaded files (logo etc.)
UPLOAD_DIR = "/app/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def startup():
    from services import auth_service
    db = SessionLocal()
    try:
        auth_service.create_default_admin(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}
