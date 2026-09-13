import os
import logging
from datetime import datetime
from typing import List, Dict, Any
from celery import Celery
from api.db.engine import SessionLocal
from api.db.models import CrawlJob, Source
from .retrieval_agent import fetch_document
from .extraction_agent import extract_fees
from .normalization_agent import normalize
from .monitoring_agent import check_for_changes

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "shipping_cost_workers",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=True,
)


@celery_app.task(name="workers.fetch_document")
def task_fetch_document(source_id: int) -> Dict[str, Any]:
    text, sha256 = fetch_document(source_id)
    return {"source_id": source_id, "text": text, "sha256": sha256}


@celery_app.task(name="workers.extract_fees")
def task_extract_fees(retrieval_result: Dict[str, Any]) -> Dict[str, Any]:
    source_id = retrieval_result["source_id"]
    text = retrieval_result["text"]
    raw_fees = extract_fees(text, source_id)
    return {"source_id": source_id, "raw_fees": raw_fees}


@celery_app.task(name="workers.normalize_fees")
def task_normalize_fees(extraction_result: Dict[str, Any]) -> Dict[str, Any]:
    source_id = extraction_result["source_id"]
    raw_fees = extraction_result["raw_fees"]
    saved_count = 0

    db = SessionLocal()
    try:
        for rf in raw_fees:
            normalize(rf, source_id, db=db)
            saved_count += 1

        source = db.query(Source).filter(Source.id == source_id).first()
        if source:
            source.last_crawled_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()

    return {"source_id": source_id, "saved_count": saved_count}


@celery_app.task(name="workers.check_for_changes")
def task_check_for_changes(source_id: int) -> Dict[str, Any]:
    return check_for_changes(source_id)


def run_pipeline_sync(source_id: int) -> int:
    """
    Direct synchronous execution of the full retrieval -> extraction -> normalization pipeline.
    Useful for seed data generation, CLI execution, or test runs without active Celery worker.
    """
    db = SessionLocal()
    job = CrawlJob(source_id=source_id, status="RUNNING", started_at=datetime.utcnow())
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        text, sha256 = fetch_document(source_id)
        raw_fees = extract_fees(text, source_id)

        saved = 0
        for rf in raw_fees:
            normalize(rf, source_id, db=db)
            saved += 1

        source = db.query(Source).filter(Source.id == source_id).first()
        if source:
            source.content_hash = sha256
            source.last_crawled_at = datetime.utcnow()

        job.status = "COMPLETED"
        job.finished_at = datetime.utcnow()
        db.commit()
        logger.info(f"Pipeline finished successfully for source_id={source_id}. Saved {saved} fees.")
        return saved
    except Exception as exc:
        job.status = "FAILED"
        job.finished_at = datetime.utcnow()
        job.error = str(exc)
        db.commit()
        logger.error(f"Pipeline failed for source_id={source_id}: {exc}")
        raise
    finally:
        db.close()


@celery_app.task(name="workers.run_pipeline_for_source")
def run_pipeline_for_source(source_id: int) -> Dict[str, Any]:
    """
    Celery task orchestrator to run the entire pipeline end-to-end for a source.
    """
    count = run_pipeline_sync(source_id)
    return {"source_id": source_id, "status": "COMPLETED", "normalized_fees_count": count}
