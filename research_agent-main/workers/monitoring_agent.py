import logging
from typing import Dict, Any
from api.db.engine import SessionLocal
from api.db.models import Source
from .retrieval_agent import fetch_document

logger = logging.getLogger(__name__)


def check_for_changes(source_id: int) -> Dict[str, Any]:
    """
    Monitors a source for updates by comparing content SHA-256 hash.
    Returns status dictionary indicating if change was detected.
    """
    db = SessionLocal()
    try:
        source = db.query(Source).filter(Source.id == source_id).first()
        if not source:
            raise ValueError(f"Source with id={source_id} not found.")

        old_hash = source.content_hash
        _, new_hash = fetch_document(source_id)

        has_changed = (old_hash is not None and old_hash != new_hash)
        if has_changed:
            logger.info(f"Source id={source_id} has changed: old={old_hash} -> new={new_hash}")
            source.content_hash = new_hash
            db.commit()
        else:
            if not old_hash:
                source.content_hash = new_hash
                db.commit()
            logger.info(f"Source id={source_id} unchanged. Hash: {new_hash}")

        return {
            "source_id": source_id,
            "changed": has_changed,
            "old_hash": old_hash,
            "new_hash": new_hash,
        }
    finally:
        db.close()
