from datetime import datetime
from pydantic import BaseModel, Field


class BookCreate(BaseModel):
    isbn: str = Field(..., min_length=1, max_length=20)
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    publisher: str | None = None
    year: int | None = None
    category: str | None = None
    shelf_location: str | None = None
    total_copies: int = Field(default=1, ge=1)


class BookUpdate(BaseModel):
    isbn: str | None = None
    title: str | None = None
    author: str | None = None
    publisher: str | None = None
    year: int | None = None
    category: str | None = None
    shelf_location: str | None = None
    total_copies: int | None = Field(default=None, ge=1)


class BookResponse(BaseModel):
    id: int
    isbn: str
    title: str
    author: str
    publisher: str | None = None
    year: int | None = None
    category: str | None = None
    shelf_location: str | None = None
    total_copies: int
    available_copies: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
