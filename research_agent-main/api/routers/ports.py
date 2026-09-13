from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from api.deps import get_db
from api.db.models import Port
from api.models.port import PortResponse

router = APIRouter(prefix="/v1/ports", tags=["Ports"])


@router.get("", response_model=List[PortResponse])
def get_ports(
    search: Optional[str] = Query(None, description="Search term matching port UN/LOCODE or name"),
    db: Session = Depends(get_db),
):
    """Autocomplete port lookup by UN/LOCODE or port name."""
    query = db.query(Port)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Port.unlocode.ilike(search_term),
                Port.name.ilike(search_term),
                Port.country.ilike(search_term),
            )
        )
    return query.order_by(Port.name).all()
