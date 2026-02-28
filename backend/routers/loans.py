from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_role
from models.user import User
from schemas.loan import LoanCreate, LoanResponse
from services import loan_service

router = APIRouter(prefix="/api/loans", tags=["loans"])


@router.get("")
def list_loans(
    status: str | None = None,
    member_id: int | None = None,
    book_id: int | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return loan_service.get_loans(db, status=status, member_id=member_id,
                                  book_id=book_id, page=page, limit=limit)


@router.post("", response_model=LoanResponse, status_code=201)
def create_loan(data: LoanCreate, db: Session = Depends(get_db), _auth: User = Depends(require_role("admin", "operator"))):
    return loan_service.create_loan(db, data.book_id, data.member_id)


@router.put("/{loan_id}/return", response_model=LoanResponse)
def return_loan(loan_id: int, db: Session = Depends(get_db), _auth: User = Depends(require_role("admin", "operator"))):
    return loan_service.return_loan(db, loan_id)


@router.get("/overdue")
def overdue_loans(db: Session = Depends(get_db), _auth: User = Depends(require_role("admin", "operator"))):
    return loan_service.get_overdue_loans(db)
