from datetime import datetime
from pydantic import BaseModel, Field, field_validator


def _check_isbn(v: str) -> str:
    clean = v.replace('-', '').replace(' ', '')
    if len(clean) == 10:
        if not (clean[:9].isdigit() and (clean[9].isdigit() or clean[9] == 'X')):
            raise ValueError('Invalid ISBN-10 format')
    elif len(clean) == 13:
        if not clean.isdigit():
            raise ValueError('Invalid ISBN-13 format')
    else:
        raise ValueError('ISBN must be 10 or 13 digits')
    return v


class BookCreate(BaseModel):
    isbn: str = Field(..., min_length=1, max_length=20)

    @field_validator('isbn')
    @classmethod
    def validate_isbn(cls, v):
        return _check_isbn(v)
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    publisher: str | None = None
    year: int | None = None
    category: str | None = None
    shelf_location: str | None = None
    total_copies: int = Field(default=1, ge=1)


class BookUpdate(BaseModel):
    isbn: str | None = None

    @field_validator('isbn')
    @classmethod
    def validate_isbn(cls, v):
        if v is not None:
            return _check_isbn(v)
        return v
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
