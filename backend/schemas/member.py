from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class MemberType(str, Enum):
    student = "student"
    teacher = "teacher"
    staff = "staff"


class MemberBase(BaseModel):
    member_no: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=100)
    surname: str = Field(..., min_length=1, max_length=100)
    member_type: MemberType
    class_grade: str | None = None
    email: str | None = None
    phone: str | None = None


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    member_no: str | None = None
    name: str | None = None
    surname: str | None = None
    member_type: MemberType | None = None
    class_grade: str | None = None
    email: str | None = None
    phone: str | None = None


class MemberResponse(MemberBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
