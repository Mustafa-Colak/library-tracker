from pydantic import BaseModel, Field


class MetadataCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class MetadataUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class MetadataResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}
