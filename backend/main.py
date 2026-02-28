import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base, SessionLocal
from routers import books_router, members_router, loans_router, reports_router, auth_router, settings_router, system_router, metadata_router
from models import User, Setting, Author, Publisher, Category  # noqa: F401 — ensure tables are created

# Create tables
Base.metadata.create_all(bind=engine)

def _read_version() -> str:
    for path in ["/app/VERSION", "VERSION", "../VERSION"]:
        try:
            with open(path) as f:
                return f.read().strip()
        except FileNotFoundError:
            continue
    return "0.0.0"

app = FastAPI(title="Library Tracker API", version=_read_version())

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
app.include_router(system_router)
app.include_router(metadata_router)

# Serve uploaded files (logo etc.)
UPLOAD_DIR = "/app/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
async def startup():
    from services import auth_service
    from routers.system import check_github_release, auto_backup_on_startup

    db = SessionLocal()
    try:
        auth_service.create_default_admin(db)
        _migrate_book_text_to_fk(db)
        _migrate_soft_delete_columns(db)
    finally:
        db.close()

    # Auto-backup database on every startup
    auto_backup_on_startup()

    # Check for updates once at startup
    await check_github_release()


def _migrate_soft_delete_columns(db):
    """Add deleted_at column to books and members tables if missing."""
    import sqlalchemy
    import logging
    logger = logging.getLogger("library-tracker")

    try:
        inspector = sqlalchemy.inspect(engine)
        for table_name in ("books", "members"):
            if table_name not in inspector.get_table_names():
                continue
            columns = [c["name"] for c in inspector.get_columns(table_name)]
            if "deleted_at" not in columns:
                db.execute(sqlalchemy.text(
                    f"ALTER TABLE {table_name} ADD COLUMN deleted_at DATETIME NULL"
                ))
                db.commit()
                logger.info(f"Added deleted_at column to {table_name}")
    except Exception as e:
        logger.warning(f"Soft delete migration failed: {e}")


def _migrate_book_text_to_fk(db):
    """Migrate old text-based author/publisher/category columns to FK references."""
    import sqlalchemy
    import logging
    logger = logging.getLogger("library-tracker")

    try:
        inspector = sqlalchemy.inspect(engine)
        if "books" not in inspector.get_table_names():
            return
        columns = [c["name"] for c in inspector.get_columns("books")]
    except Exception:
        return

    # Already migrated or fresh install
    if "author_id" in columns:
        return

    # Old schema: text-based columns exist
    if "author" not in columns:
        return

    logger.info("Migrating books table from text to FK schema...")

    # Read old data
    rows = db.execute(sqlalchemy.text("SELECT * FROM books")).fetchall()
    col_names = columns

    # Create lookup entries
    for row in rows:
        row_dict = dict(zip(col_names, row))
        for name, Model in [("author", Author), ("publisher", Publisher), ("category", Category)]:
            val = row_dict.get(name)
            if val:
                existing = db.query(Model).filter(Model.name == val).first()
                if not existing:
                    db.add(Model(name=val))
    db.commit()

    # Drop old table completely and recreate with new schema
    db.execute(sqlalchemy.text("DROP TABLE IF EXISTS books"))
    db.commit()

    # Close session to avoid caching issues
    db.close()

    # Recreate books table with FK schema
    Base.metadata.tables["books"].create(engine, checkfirst=True)

    # Reopen session and copy data
    db2 = SessionLocal()
    try:
        for row in rows:
            row_dict = dict(zip(col_names, row))
            author = db2.query(Author).filter(Author.name == row_dict.get("author")).first()
            publisher = db2.query(Publisher).filter(Publisher.name == row_dict.get("publisher")).first() if row_dict.get("publisher") else None
            category = db2.query(Category).filter(Category.name == row_dict.get("category")).first() if row_dict.get("category") else None

            db2.execute(sqlalchemy.text(
                "INSERT INTO books (id, isbn, title, author_id, publisher_id, category_id, year, "
                "shelf_location, total_copies, available_copies, created_at, updated_at) "
                "VALUES (:id, :isbn, :title, :aid, :pid, :cid, :year, :shelf, :total, :avail, :cat, :uat)"
            ), {
                "id": row_dict["id"], "isbn": row_dict["isbn"], "title": row_dict["title"],
                "aid": author.id if author else None,
                "pid": publisher.id if publisher else None,
                "cid": category.id if category else None,
                "year": row_dict.get("year"), "shelf": row_dict.get("shelf_location"),
                "total": row_dict.get("total_copies", 1), "avail": row_dict.get("available_copies", 1),
                "cat": row_dict.get("created_at"), "uat": row_dict.get("updated_at"),
            })
        db2.commit()
        logger.info(f"Migration complete: {len(rows)} books migrated.")
    finally:
        db2.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}
