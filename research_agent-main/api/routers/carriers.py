from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from api.deps import get_db
from api.db.models import Carrier
from api.models.carrier import CarrierResponse

router = APIRouter(prefix="/v1/carriers", tags=["Carriers"])


@router.get("", response_model=List[CarrierResponse])
def get_carriers(
    search: Optional[str] = Query(None, description="Search term matching carrier SCAC or name"),
    db: Session = Depends(get_db),
):
    """Autocomplete carrier lookup by SCAC code or carrier name."""
    query = db.query(Carrier)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Carrier.scac_code.ilike(search_term),
                Carrier.name.ilike(search_term),
            )
        )
    return query.order_by(Carrier.name).all()
