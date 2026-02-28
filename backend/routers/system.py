import os
import logging
import httpx
from fastapi import APIRouter, Depends

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
