import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException

from models.loan import Loan
from models.book import Book
from models.member import Member


LOAN_DAYS = int(os.getenv("LOAN_DEFAULT_DAYS", "15"))


def get_loans(db: Session, status: str | None = None, member_id: int | None = None,
              book_id: int | None = None, page: int = 1, limit: int = 20):
    query = db.query(Loan)
    if status:
        query = query.filter(Loan.status == status)
    if member_id:
        query = query.filter(Loan.member_id == member_id)
    if book_id:
        query = query.filter(Loan.book_id == book_id)
    query = query.order_by(Loan.borrowed_at.desc())
    total = query.count()
    loans = query.offset((page - 1) * limit).limit(limit).all()
    return {"items": loans, "total": total, "page": page, "limit": limit}


def create_loan(db: Session, book_id: int, member_id: int):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies < 1:
        raise HTTPException(status_code=400, detail="No available copies")

    member = db.query(Member).filter(Member.id == member_id, Member.is_active == True).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found or inactive")

    existing = db.query(Loan).filter(
        and_(Loan.book_id == book_id, Loan.member_id == member_id, Loan.status == "active")
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Member already has this book on loan")

    now = datetime.utcnow()
    loan = Loan(
        book_id=book_id,
        member_id=member_id,
        borrowed_at=now,
        due_date=now + timedelta(days=LOAN_DAYS),
        status="active",
    )
    book.available_copies -= 1
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


def return_loan(db: Session, loan_id: int):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.status == "returned":
        raise HTTPException(status_code=400, detail="Already returned")

    loan.returned_at = datetime.utcnow()
    loan.status = "returned"

    book = db.query(Book).filter(Book.id == loan.book_id).first()
    if book:
        book.available_copies += 1

    db.commit()
    db.refresh(loan)
    return loan


def get_overdue_loans(db: Session):
    now = datetime.utcnow()
    # First update overdue statuses
    db.query(Loan).filter(
        and_(Loan.status == "active", Loan.due_date < now)
    ).update({"status": "overdue"})
    db.commit()

    loans = db.query(Loan).filter(Loan.status == "overdue").order_by(Loan.due_date.asc()).all()
    return loans
