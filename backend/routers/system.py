import os
import sqlite3
import logging
from datetime import datetime
from pathlib import Path

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from dependencies import require_role
from models.user import User

router = APIRouter(prefix="/api/system", tags=["system"])
logger = logging.getLogger("library-tracker")


def _read_version() -> str:
    """Read version from VERSION file (single source of truth)."""
    for path in ["/app/VERSION", "VERSION", "../VERSION"]:
        try:
            with open(path) as f:
                return f.read().strip()
        except FileNotFoundError:
            continue
    return os.getenv("APP_VERSION", "0.0.0")


CURRENT_VERSION = _read_version()
GITHUB_REPO = "Mustafa-Colak/library-tracker"
GITHUB_API = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"

# Checked once at startup, never refreshed until next restart
_latest = {"version": None, "url": None}


async def check_github_release():
    """Fetch latest release from GitHub. Called once at startup."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(GITHUB_API, headers={
                "Accept": "application/vnd.github.v3+json",
            })
            if resp.status_code == 200:
                data = resp.json()
                tag = data.get("tag_name", "")
                _latest["version"] = tag.lstrip("v")
                _latest["url"] = data.get("html_url", "")
                logger.info(f"GitHub release check: latest={_latest['version']}, current={CURRENT_VERSION}")
    except Exception:
        logger.warning("GitHub release check failed (network error)")


@router.get("/info")
async def system_info():
    """Public endpoint — returns only current version."""
    return {"version": CURRENT_VERSION}


@router.get("/version")
async def check_version(_auth: User = Depends(require_role("admin"))):
    latest_version = _latest["version"]
    release_url = _latest["url"]

    update_available = False
    if latest_version:
        update_available = _is_newer(latest_version, CURRENT_VERSION)

    return {
        "current_version": CURRENT_VERSION,
        "latest_version": latest_version or CURRENT_VERSION,
        "update_available": update_available,
        "release_url": release_url or f"https://github.com/{GITHUB_REPO}/releases",
    }


def _is_newer(latest: str, current: str) -> bool:
    """Compare semantic versions: return True if latest > current."""
    try:
        lat = [int(x) for x in latest.split(".")]
        cur = [int(x) for x in current.split(".")]
        return lat > cur
    except (ValueError, AttributeError):
        return False


# ---------------------------------------------------------------------------
# Database Backup
# ---------------------------------------------------------------------------

BACKUP_DIR = Path("/app/data/backups")
MAX_BACKUPS = 10


def _get_db_path() -> str:
    from database import DATABASE_URL
    return DATABASE_URL.replace("sqlite:///", "")


def _cleanup_old_backups():
    if not BACKUP_DIR.exists():
        return
    backups = sorted(BACKUP_DIR.glob("library_*.db"), key=lambda f: f.stat().st_mtime)
    while len(backups) > MAX_BACKUPS:
        backups.pop(0).unlink()


def _validate_filename(filename: str):
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")


def _do_backup() -> dict:
    """Create a SQLite backup. Called from API and startup."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_filename = f"library_{timestamp}.db"
    backup_path = BACKUP_DIR / backup_filename

    source = sqlite3.connect(_get_db_path())
    dest = sqlite3.connect(str(backup_path))
    try:
        source.backup(dest)
    finally:
        dest.close()
        source.close()

    _cleanup_old_backups()

    return {
        "filename": backup_filename,
        "size": backup_path.stat().st_size,
        "created_at": timestamp,
    }


def auto_backup_on_startup():
    """Create an automatic backup when the application starts."""
    try:
        db_path = _get_db_path()
        if not Path(db_path).exists():
            return
        result = _do_backup()
        logger.info(f"Auto-backup created: {result['filename']}")
    except Exception as e:
        logger.warning(f"Auto-backup failed: {e}")


@router.post("/backups")
def create_backup(_auth: User = Depends(require_role("admin"))):
    return _do_backup()


@router.get("/backups")
def list_backups(_auth: User = Depends(require_role("admin"))):
    if not BACKUP_DIR.exists():
        return {"backups": []}

    backups = []
    for f in sorted(BACKUP_DIR.glob("library_*.db"), reverse=True):
        stat = f.stat()
        backups.append({
            "filename": f.name,
            "size": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        })
    return {"backups": backups}


@router.get("/backups/{filename}/download")
def download_backup(filename: str, _auth: User = Depends(require_role("admin"))):
    _validate_filename(filename)
    filepath = BACKUP_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Backup not found")
    return FileResponse(path=str(filepath), filename=filename, media_type="application/x-sqlite3")


@router.delete("/backups/{filename}")
def delete_backup(filename: str, _auth: User = Depends(require_role("admin"))):
    _validate_filename(filename)
    filepath = BACKUP_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Backup not found")
    # Prevent deleting the last remaining backup
    remaining = list(BACKUP_DIR.glob("library_*.db"))
    if len(remaining) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last backup")
    filepath.unlink()
    return {"ok": True}
