from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_role
from models.user import User
from schemas.member import MemberCreate, MemberUpdate, MemberResponse
from services import member_service

router = APIRouter(prefix="/api/members", tags=["members"])


@router.get("")
def list_members(
    search: str | None = None,
    type: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return member_service.get_members(db, search=search, member_type=type, page=page, limit=limit)


@router.get("/barcode/{member_no}", response_model=MemberResponse)
def get_by_barcode(member_no: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return member_service.get_member_by_no(db, member_no)


@router.get("/{member_id}", response_model=MemberResponse)
def get_member(member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return member_service.get_member(db, member_id)


@router.post("", response_model=MemberResponse, status_code=201)
def create_member(data: MemberCreate, db: Session = Depends(get_db), _auth: User = Depends(require_role("admin", "operator"))):
    return member_service.create_member(db, data)


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(member_id: int, data: MemberUpdate, db: Session = Depends(get_db), _auth: User = Depends(require_role("admin", "operator"))):
    return member_service.update_member(db, member_id, data)


@router.delete("/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db), _auth: User = Depends(require_role("admin"))):
    return member_service.delete_member(db, member_id)
