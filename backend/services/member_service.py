from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from models.member import Member
from schemas.member import MemberCreate, MemberUpdate


def get_members(db: Session, search: str | None = None, member_type: str | None = None,
                page: int = 1, limit: int = 20):
    query = db.query(Member).filter(Member.is_active == True)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(Member.name.ilike(term), Member.surname.ilike(term),
                Member.member_no.ilike(term))
        )
    if member_type:
        query = query.filter(Member.member_type == member_type)
    total = query.count()
    members = query.offset((page - 1) * limit).limit(limit).all()
    return {"items": members, "total": total, "page": page, "limit": limit}


def get_member(db: Session, member_id: int):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


def get_member_by_no(db: Session, member_no: str):
    member = db.query(Member).filter(Member.member_no == member_no, Member.is_active == True).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


def create_member(db: Session, data: MemberCreate):
    existing = db.query(Member).filter(Member.member_no == data.member_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="Member number already exists")
    member = Member(**data.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def update_member(db: Session, member_id: int, data: MemberUpdate):
    member = get_member(db, member_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(member, key, value)
    db.commit()
    db.refresh(member)
    return member


def delete_member(db: Session, member_id: int):
    member = get_member(db, member_id)
    member.is_active = False
    db.commit()
    return {"detail": "Member deactivated"}
