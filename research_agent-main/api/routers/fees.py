from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from api.deps import get_db
from api.db.models import Fee, Source, Port, Carrier
from api.models.fee import FeeResponse, SourceResponse, RefreshRequest, RefreshResponse
from workers.celery_app import run_pipeline_for_source, run_pipeline_sync
from workers.retrieval_agent import fetch_document

router = APIRouter(prefix="/v1", tags=["Fees"])


@router.get("/fees", response_model=List[FeeResponse])
def get_fees(
    port: Optional[str] = Query(None, description="Filter by Port UN/LOCODE or Port ID"),
    carrier: Optional[str] = Query(None, description="Filter by Carrier SCAC or Carrier ID"),
    fee_type: Optional[str] = Query(None, description="Filter by canonical fee type (THC, BAF, etc.)"),
    db: Session = Depends(get_db),
):
    """Browse normalized fees with optional port and carrier filters."""
    query = (
        db.query(Fee)
        .options(joinedload(Fee.port), joinedload(Fee.carrier), joinedload(Fee.source))
    )

    if port:
        port_val = port.strip()
        if port_val.isdigit():
            query = query.filter(Fee.port_id == int(port_val))
        else:
            query = query.join(Fee.port).filter(Port.unlocode.ilike(port_val))

    if carrier:
        carrier_val = carrier.strip()
        if carrier_val.isdigit():
            query = query.filter(Fee.carrier_id == int(carrier_val))
        else:
            query = query.join(Fee.carrier).filter(Carrier.scac_code.ilike(carrier_val))

    if fee_type:
        query = query.filter(Fee.fee_type == fee_type.strip().upper())

    fees = query.order_by(Fee.id.desc()).all()

    # Map to FeeResponse
    results = []
    for f in fees:
        source_ref = (
            f"{f.source.doc_type} (Source #{f.source_id} - {f.source.url_or_fixture_path})"
            if f.source
            else f"Source #{f.source_id}"
        )
        results.append(
            FeeResponse(
                id=f.id,
                source_id=f.source_id,
                fee_code=f.fee_code,
                fee_type=f.fee_type,
                port_id=f.port_id,
                port_unlocode=f.port.unlocode if f.port else None,
                port_name=f.port.name if f.port else None,
                carrier_id=f.carrier_id,
                carrier_name=f.carrier.name if f.carrier else None,
                carrier_scac=f.carrier.scac_code if f.carrier else None,
                container_type=f.container_type,
                amount=f.amount,
                currency=f.currency,
                unit=f.unit,
                conditions_json=f.conditions_json,
                effective_date=f.effective_date,
                expiry_date=f.expiry_date,
                confidence=f.confidence,
                extracted_at=f.extracted_at,
                source_reference=source_ref,
            )
        )
    return results


@router.get("/fees/{fee_id}/source", response_model=SourceResponse)
def get_fee_source(
    fee_id: int,
    db: Session = Depends(get_db),
):
    """Returns the source snippet and document reference from which a fee was extracted."""
    fee = (
        db.query(Fee)
        .options(joinedload(Fee.source), joinedload(Fee.port), joinedload(Fee.carrier))
        .filter(Fee.id == fee_id)
        .first()
    )
    if not fee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fee #{fee_id} not found.")

    source = fee.source
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated source record not found.")

    snippet = None
    try:
        raw_doc, _ = fetch_document(source.id)
        # Find lines mentioning this fee
        lines = [line.strip() for line in raw_doc.splitlines() if line.strip()]
        matches = [line for line in lines if fee.fee_code.lower() in line.lower() or str(int(fee.amount)) in line]
        snippet = "\n".join(matches[:10]) if matches else raw_doc[:500]
    except Exception as e:
        snippet = f"Could not extract snippet from fixture: {e}"

    return SourceResponse(
        id=source.id,
        url_or_fixture_path=source.url_or_fixture_path,
        doc_type=source.doc_type,
        port_id=source.port_id,
        port_unlocode=source.port.unlocode if source.port else None,
        carrier_id=source.carrier_id,
        carrier_scac=source.carrier.scac_code if source.carrier else None,
        last_crawled_at=source.last_crawled_at,
        content_hash=source.content_hash,
        raw_snippet=snippet,
    )


@router.post("/refresh", response_model=RefreshResponse)
def refresh_source(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
):
    """
    Triggers re-run of the extraction pipeline for a given source_id
    or all sources if source_id is not specified.
    """
    sources_to_run = []
    if payload.source_id:
        src = db.query(Source).filter(Source.id == payload.source_id).first()
        if not src:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Source #{payload.source_id} not found.")
        sources_to_run.append(src)
    else:
        sources_to_run = db.query(Source).all()

    if not sources_to_run:
        return RefreshResponse(
            status="error",
            message="No sources registered in database to refresh.",
            extracted_fees_count=0,
        )

    total_extracted = 0
    task_ids = []

    # Attempt Celery task dispatch; if broker unavailable, fallback to sync execution
    for src in sources_to_run:
        try:
            task = run_pipeline_for_source.delay(src.id)
            task_ids.append(task.id)
        except Exception:
            # Fallback to direct synchronous execution
            count = run_pipeline_sync(src.id)
            total_extracted += count

    if task_ids:
        return RefreshResponse(
            status="queued",
            message=f"Pipeline refresh tasks dispatched for {len(sources_to_run)} source(s).",
            task_id=",".join(task_ids),
            source_id=payload.source_id,
        )
    else:
        return RefreshResponse(
            status="completed",
            message=f"Pipeline refresh completed synchronously for {len(sources_to_run)} source(s).",
            source_id=payload.source_id,
            extracted_fees_count=total_extracted,
        )
