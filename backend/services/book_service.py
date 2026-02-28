from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from models.book import Book
from models.author import Author
from models.publisher import Publisher
from models.category import Category
from schemas.book import BookCreate, BookUpdate


def _get_or_create_author(db: Session, name: str) -> Author:
    obj = db.query(Author).filter(Author.name == name).first()
    if not obj:
        obj = Author(name=name)
        db.add(obj)
        db.flush()
    return obj


def _get_or_create_publisher(db: Session, name: str) -> Publisher:
    obj = db.query(Publisher).filter(Publisher.name == name).first()
    if not obj:
        obj = Publisher(name=name)
        db.add(obj)
        db.flush()
    return obj


def _get_or_create_category(db: Session, name: str) -> Category:
    obj = db.query(Category).filter(Category.name == name).first()
    if not obj:
        obj = Category(name=name)
        db.add(obj)
        db.flush()
    return obj


def get_suggestions(db: Session):
    """Return distinct authors, publishers, and categories for autocomplete."""
    authors = db.query(Author).order_by(Author.name).all()
    publishers = db.query(Publisher).order_by(Publisher.name).all()
    categories = db.query(Category).order_by(Category.name).all()
    return {
        "authors": [a.name for a in authors],
        "publishers": [p.name for p in publishers],
        "categories": [c.name for c in categories],
    }


def get_books(db: Session, search: str | None = None, category: str | None = None,
              page: int = 1, limit: int = 20):
    query = db.query(Book)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Book.title.ilike(term),
                Book.isbn.ilike(term),
                Book.author_rel.has(Author.name.ilike(term)),
            )
        )
    if category:
        query = query.filter(Book.category_rel.has(Category.name == category))
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

    author = _get_or_create_author(db, data.author)
    publisher = _get_or_create_publisher(db, data.publisher) if data.publisher else None
    category = _get_or_create_category(db, data.category) if data.category else None

    book = Book(
        isbn=data.isbn,
        title=data.title,
        author_id=author.id,
        publisher_id=publisher.id if publisher else None,
        category_id=category.id if category else None,
        year=data.year,
        shelf_location=data.shelf_location,
        total_copies=data.total_copies,
        available_copies=data.total_copies,
    )
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

    # Handle FK fields via get_or_create
    if "author" in update_data and update_data["author"]:
        author = _get_or_create_author(db, update_data.pop("author"))
        book.author_id = author.id
    else:
        update_data.pop("author", None)

    if "publisher" in update_data:
        val = update_data.pop("publisher")
        if val:
            publisher = _get_or_create_publisher(db, val)
            book.publisher_id = publisher.id
        else:
            book.publisher_id = None

    if "category" in update_data:
        val = update_data.pop("category")
        if val:
            category = _get_or_create_category(db, val)
            book.category_id = category.id
        else:
            book.category_id = None

    # Set remaining simple fields
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
