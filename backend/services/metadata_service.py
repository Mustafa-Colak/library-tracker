from sqlalchemy.orm import Session
from fastapi import HTTPException

from models.author import Author
from models.publisher import Publisher
from models.category import Category
from models.book import Book


MODEL_MAP = {
    "authors": Author,
    "publishers": Publisher,
    "categories": Category,
}

FK_MAP = {
    "authors": "author_id",
    "publishers": "publisher_id",
    "categories": "category_id",
}


def list_items(db: Session, entity_type: str):
    Model = MODEL_MAP[entity_type]
    return db.query(Model).order_by(Model.name).all()


def create_item(db: Session, entity_type: str, name: str):
    Model = MODEL_MAP[entity_type]
    existing = db.query(Model).filter(Model.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already exists")
    obj = Model(name=name)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_item(db: Session, entity_type: str, item_id: int, name: str):
    Model = MODEL_MAP[entity_type]
    obj = db.query(Model).filter(Model.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    # Check duplicate
    dup = db.query(Model).filter(Model.name == name, Model.id != item_id).first()
    if dup:
        raise HTTPException(status_code=400, detail="Name already exists")
    obj.name = name
    db.commit()
    db.refresh(obj)
    return obj


def delete_item(db: Session, entity_type: str, item_id: int):
    Model = MODEL_MAP[entity_type]
    obj = db.query(Model).filter(Model.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    # Check if used by any book
    fk_field = FK_MAP[entity_type]
    in_use = db.query(Book).filter(getattr(Book, fk_field) == item_id).count()
    if in_use:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete: used by {in_use} books"
        )
    db.delete(obj)
    db.commit()
    return {"detail": "Deleted"}
