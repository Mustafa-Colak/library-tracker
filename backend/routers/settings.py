import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_role
from models.setting import Setting

router = APIRouter(prefix="/api/settings", tags=["settings"])

UPLOAD_DIR = "/app/data/uploads"


def get_setting(db: Session, key: str, default: str = "") -> str:
    row = db.query(Setting).filter(Setting.key == key).first()
    return row.value if row else default


def set_setting(db: Session, key: str, value: str):
    row = db.query(Setting).filter(Setting.key == key).first()
    if row:
        row.value = value
    else:
        row = Setting(key=key, value=value)
        db.add(row)
    db.commit()


@router.get("/branding")
def get_branding(db: Session = Depends(get_db)):
    """Public endpoint — returns org name and logo URL for login page etc."""
    return {
        "org_name": get_setting(db, "org_name", ""),
        "logo_url": get_setting(db, "logo_url", ""),
    }


@router.put("/branding")
def update_branding(
    data: dict,
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin")),
):
    if "org_name" in data:
        set_setting(db, "org_name", data["org_name"])
    return {"ok": True}


@router.post("/branding/logo")
def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin")),
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Keep original extension
    ext = os.path.splitext(file.filename or "logo.png")[1] or ".png"
    filename = f"logo{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    logo_url = f"/uploads/{filename}"
    set_setting(db, "logo_url", logo_url)

    return {"logo_url": logo_url}


@router.delete("/branding/logo")
def delete_logo(
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin")),
):
    logo_url = get_setting(db, "logo_url", "")
    if logo_url:
        filepath = os.path.join("/app/data", logo_url.lstrip("/"))
        if os.path.exists(filepath):
            os.remove(filepath)
        set_setting(db, "logo_url", "")
    return {"ok": True}


# ----- Loan Duration Settings -----

LOAN_DEFAULTS = {"student": "15", "teacher": "30", "staff": "30"}


@router.get("/loan-durations")
def get_loan_durations(db: Session = Depends(get_db)):
    return {
        k: int(get_setting(db, f"loan_days_{k}", v))
        for k, v in LOAN_DEFAULTS.items()
    }


@router.put("/loan-durations")
def update_loan_durations(
    data: dict,
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin")),
):
    for k, default in LOAN_DEFAULTS.items():
        val = data.get(k)
        if val is not None:
            days = max(1, min(365, int(val)))
            set_setting(db, f"loan_days_{k}", str(days))
    return get_loan_durations(db)
