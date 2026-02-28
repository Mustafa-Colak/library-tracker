from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_role
from models.user import User
from schemas.book import BookCreate, BookUpdate, BookResponse
from services import book_service

router = APIRouter(prefix="/api/books", tags=["books"])


@router.get("")
def list_books(
    search: str | None = None,
    category: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return book_service.get_books(db, search=search, category=category, page=page, limit=limit)


@router.get("/suggestions")
def get_suggestions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return distinct authors and publishers for autocomplete."""
    return book_service.get_suggestions(db)


@router.get("/barcode/{isbn}", response_model=BookResponse)
def get_by_isbn(isbn: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return book_service.get_book_by_isbn(db, isbn)


@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return book_service.get_book(db, book_id)


@router.post("", response_model=BookResponse, status_code=201)
def create_book(data: BookCreate, db: Session = Depends(get_db), _auth: User = Depends(require_role("admin", "operator"))):
    return book_service.create_book(db, data)


@router.put("/{book_id}", response_model=BookResponse)
def update_book(book_id: int, data: BookUpdate, db: Session = Depends(get_db), _auth: User = Depends(require_role("admin", "operator"))):
    return book_service.update_book(db, book_id, data)


@router.delete("/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db), _auth: User = Depends(require_role("admin"))):
    return book_service.delete_book(db, book_id)
