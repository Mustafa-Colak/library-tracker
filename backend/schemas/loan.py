from datetime import datetime
from pydantic import BaseModel

from schemas.book import BookResponse
from schemas.member import MemberResponse


class LoanCreate(BaseModel):
    book_id: int
    member_id: int


class LoanResponse(BaseModel):
    id: int
    book_id: int
    member_id: int
    borrowed_at: datetime
    due_date: datetime
    returned_at: datetime | None
    status: str
    book: BookResponse | None = None
    member: MemberResponse | None = None

    model_config = {"from_attributes": True}
