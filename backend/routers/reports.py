from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from database import get_db
from dependencies import require_role
from models.user import User
from models.book import Book
from models.member import Member
from models.loan import Loan

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), _auth: User = Depends(require_role("admin", "operator"))):
    total_books = db.query(func.sum(Book.total_copies)).scalar() or 0
    unique_titles = db.query(func.count(Book.id)).scalar() or 0
    total_members = db.query(func.count(Member.id)).filter(Member.is_active == True).scalar() or 0
    active_loans = db.query(func.count(Loan.id)).filter(Loan.status == "active").scalar() or 0
    overdue_loans = db.query(func.count(Loan.id)).filter(Loan.status == "overdue").scalar() or 0

    now = datetime.utcnow()
    newly_overdue = db.query(Loan).filter(
        and_(Loan.status == "active", Loan.due_date < now)
    ).count()
    if newly_overdue > 0:
        db.query(Loan).filter(
            and_(Loan.status == "active", Loan.due_date < now)
        ).update({"status": "overdue"})
        db.commit()
        overdue_loans += newly_overdue
        active_loans -= newly_overdue

    return {
        "total_books": total_books,
        "unique_titles": unique_titles,
        "total_members": total_members,
        "active_loans": active_loans,
        "overdue_loans": overdue_loans,
    }


@router.get("/popular-books")
def popular_books(db: Session = Depends(get_db), _auth: User = Depends(require_role("admin", "operator"))):
    results = (
        db.query(Book.id, Book.title, Book.author, Book.isbn, func.count(Loan.id).label("loan_count"))
        .join(Loan, Loan.book_id == Book.id)
        .group_by(Book.id)
        .order_by(func.count(Loan.id).desc())
        .limit(10)
        .all()
    )
    return [
        {"id": r[0], "title": r[1], "author": r[2], "isbn": r[3], "loan_count": r[4]}
        for r in results
    ]


@router.get("/active-loans")
def active_loans(db: Session = Depends(get_db), _auth: User = Depends(require_role("admin", "operator"))):
    loans = (
        db.query(Loan)
        .filter(Loan.status == "active")
        .order_by(Loan.due_date.asc())
        .all()
    )
    return loans


@router.get("/overdue")
def overdue_report(db: Session = Depends(get_db), _auth: User = Depends(require_role("admin", "operator"))):
    now = datetime.utcnow()
    db.query(Loan).filter(
        and_(Loan.status == "active", Loan.due_date < now)
    ).update({"status": "overdue"})
    db.commit()

    loans = (
        db.query(Loan)
        .filter(Loan.status == "overdue")
        .order_by(Loan.due_date.asc())
        .all()
    )
    return loans
