from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    isbn: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))

    # FK relationships
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("authors.id"), index=True)
    publisher_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("publishers.id"), nullable=True)
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categories.id"), nullable=True)

    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    shelf_location: Mapped[str | None] = mapped_column(String(50), nullable=True)
    total_copies: Mapped[int] = mapped_column(Integer, default=1)
    available_copies: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=None)

    # Relationships
    author_rel = relationship("Author", lazy="joined")
    publisher_rel = relationship("Publisher", lazy="joined")
    category_rel = relationship("Category", lazy="joined")

    # Properties for backward-compatible API responses
    @property
    def author(self) -> str:
        return self.author_rel.name if self.author_rel else ""

    @property
    def publisher(self) -> str | None:
        return self.publisher_rel.name if self.publisher_rel else None

    @property
    def category(self) -> str | None:
        return self.category_rel.name if self.category_rel else None
