import os
import httpx
from fastapi import APIRouter, Depends

from dependencies import require_role
from models.user import User

router = APIRouter(prefix="/api/system", tags=["system"])


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

# Cache: avoid hitting GitHub API on every request
_cache = {"version": None, "url": None, "checked_at": 0}
CACHE_TTL = 3600  # 1 hour


@router.get("/info")
async def system_info():
    """Public endpoint — returns only current version."""
    return {"version": CURRENT_VERSION}


@router.get("/version")
async def check_version(_auth: User = Depends(require_role("admin"))):
    import time
    now = time.time()

    latest_version = _cache["version"]
    release_url = _cache["url"]

    # Fetch from GitHub if cache expired
    if latest_version is None or (now - _cache["checked_at"]) > CACHE_TTL:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(GITHUB_API, headers={
                    "Accept": "application/vnd.github.v3+json",
                })
                if resp.status_code == 200:
                    data = resp.json()
                    tag = data.get("tag_name", "")
                    latest_version = tag.lstrip("v")
                    release_url = data.get("html_url", "")
                    _cache["version"] = latest_version
                    _cache["url"] = release_url
                    _cache["checked_at"] = now
        except Exception:
            pass  # Network error — return current info only

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
