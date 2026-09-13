import logging
from typing import List, Dict, Any
from shared.llm_client import extract_fees_from_text

logger = logging.getLogger(__name__)


def extract_fees(document_text: str, source_id: int) -> List[Dict[str, Any]]:
    """
    Extracts raw fee candidates from document text using the LLM client
    or its built-in rule-based fallback extractor.
    """
    logger.info(f"Extracting fees for source_id={source_id} (text length: {len(document_text)} chars)...")
    candidates = extract_fees_from_text(document_text)
    logger.info(f"Successfully extracted {len(candidates)} raw fee candidates for source_id={source_id}.")
    return candidates
