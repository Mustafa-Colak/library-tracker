from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from fastapi import HTTPException

from models.book import Book
from schemas.book import BookCreate, BookUpdate


def get_suggestions(db: Session):
    """Return distinct authors, publishers, and categories for autocomplete."""
    authors = (
        db.query(Book.author)
        .filter(Book.author.isnot(None), Book.author != "")
        .distinct()
        .order_by(Book.author)
        .all()
    )
    publishers = (
        db.query(Book.publisher)
        .filter(Book.publisher.isnot(None), Book.publisher != "")
        .distinct()
        .order_by(Book.publisher)
        .all()
    )
    categories = (
        db.query(Book.category)
        .filter(Book.category.isnot(None), Book.category != "")
        .distinct()
        .order_by(Book.category)
        .all()
    )
    return {
        "authors": [a[0] for a in authors],
        "publishers": [p[0] for p in publishers],
        "categories": [c[0] for c in categories],
    }


def get_books(db: Session, search: str | None = None, category: str | None = None,
              page: int = 1, limit: int = 20):
    query = db.query(Book)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(Book.title.ilike(term), Book.author.ilike(term), Book.isbn.ilike(term))
        )
    if category:
        query = query.filter(Book.category == category)
    total = query.count()
    books = query.offset((page - 1) * limit).limit(limit).all()
    return {"items": books, "total": total, "page": page, "limit": limit}


def get_book(db: Session, book_id: int):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


def get_book_by_isbn(db: Session, isbn: str):
    book = db.query(Book).filter(Book.isbn == isbn).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


def create_book(db: Session, data: BookCreate):
    existing = db.query(Book).filter(Book.isbn == data.isbn).first()
    if existing:
        raise HTTPException(status_code=400, detail="ISBN already exists")
    book = Book(**data.model_dump(), available_copies=data.total_copies)
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def update_book(db: Session, book_id: int, data: BookUpdate):
    book = get_book(db, book_id)
    update_data = data.model_dump(exclude_unset=True)
    if "total_copies" in update_data:
        diff = update_data["total_copies"] - book.total_copies
        book.available_copies = max(0, book.available_copies + diff)
    for key, value in update_data.items():
        setattr(book, key, value)
    db.commit()
    db.refresh(book)
    return book


def delete_book(db: Session, book_id: int):
    book = get_book(db, book_id)
    if book.available_copies < book.total_copies:
        raise HTTPException(status_code=400, detail="Cannot delete book with active loans")
    db.delete(book)
    db.commit()
    return {"detail": "Book deleted"}
