from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_role
from models.user import User
from schemas.metadata import MetadataCreate, MetadataUpdate, MetadataResponse
from services import metadata_service

router = APIRouter(prefix="/api/metadata", tags=["metadata"])

VALID_TYPES = ("authors", "publishers", "categories")


def _validate_type(entity_type: str):
    if entity_type not in VALID_TYPES:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid type. Use: {', '.join(VALID_TYPES)}")


@router.get("/{entity_type}", response_model=list[MetadataResponse])
def list_items(entity_type: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    _validate_type(entity_type)
    return metadata_service.list_items(db, entity_type)


@router.post("/{entity_type}", response_model=MetadataResponse, status_code=201)
def create_item(entity_type: str, data: MetadataCreate, db: Session = Depends(get_db),
                _: User = Depends(require_role("admin", "operator"))):
    _validate_type(entity_type)
    return metadata_service.create_item(db, entity_type, data.name)


@router.put("/{entity_type}/{item_id}", response_model=MetadataResponse)
def update_item(entity_type: str, item_id: int, data: MetadataUpdate,
                db: Session = Depends(get_db), _: User = Depends(require_role("admin", "operator"))):
    _validate_type(entity_type)
    return metadata_service.update_item(db, entity_type, item_id, data.name)


@router.delete("/{entity_type}/{item_id}")
def delete_item(entity_type: str, item_id: int, db: Session = Depends(get_db),
                _: User = Depends(require_role("admin"))):
    _validate_type(entity_type)
    return metadata_service.delete_item(db, entity_type, item_id)
