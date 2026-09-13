import os
import hashlib
import logging
from typing import Tuple
from api.db.engine import SessionLocal
from api.db.models import Source

logger = logging.getLogger(__name__)


def fetch_document(source_id: int) -> Tuple[str, str]:
    """
    Retrieves document content for a given source_id.
    Reads from local fixture path or downloads from URL.
    Returns (document_text, sha256_hash).
    """
    db = SessionLocal()
    try:
        source = db.query(Source).filter(Source.id == source_id).first()
        if not source:
            raise ValueError(f"Source with id={source_id} not found in database.")

        path_or_url = source.url_or_fixture_path
        content = ""

        if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
            import httpx
            logger.info(f"Retrieving remote document from {path_or_url}...")
            response = httpx.get(path_or_url, timeout=15.0)
            response.raise_for_status()
            content = response.text
        else:
            # Local fixture file
            candidate_paths = [
                path_or_url,
                os.path.join(os.getcwd(), path_or_url),
                os.path.join(os.path.dirname(__file__), "..", path_or_url),
            ]
            found_path = None
            for p in candidate_paths:
                norm = os.path.normpath(p)
                if os.path.exists(norm) and os.path.isfile(norm):
                    found_path = norm
                    break

            if not found_path:
                raise FileNotFoundError(f"Fixture file not found at any candidate location: {candidate_paths}")

            logger.info(f"Reading local fixture file: {found_path}")
            with open(found_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

        sha256 = hashlib.sha256(content.encode("utf-8")).hexdigest()
        return content, sha256
    finally:
        db.close()
