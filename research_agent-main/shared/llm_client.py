import os
import json
import logging
import re
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

LLM_API_KEY = os.getenv("LLM_API_KEY", "").strip()
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "").strip() or None


def _extract_with_llm(text: str) -> List[Dict[str, Any]]:
    """Calls OpenAI-compatible API to extract structured fees from text."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)

        prompt = (
            "You are an expert ocean freight tariff analyst. Extract all fee items from the following tariff text/HTML.\n"
            "Return a JSON object with a single key 'fees' containing a list of objects with the following fields:\n"
            "- fee_name: string (e.g. 'Origin Terminal Handling Charge')\n"
            "- fee_code: string (e.g. 'THC', 'BAF', 'CAF', 'ISPS', 'DOC', 'DEMURRAGE', 'OTHER')\n"
            "- port_unlocode: string (5-letter UN/LOCODE, e.g. 'CNSHA', 'USLAX', 'NLRTM')\n"
            "- carrier_scac: string or null (e.g. 'MAEU', 'MSCU')\n"
            "- container_type: string or null (e.g. '20GP', '40GP', '40HC', 'ALL')\n"
            "- amount: float\n"
            "- currency: string (3-letter ISO code: USD, EUR, CNY, etc.)\n"
            "- unit: string (e.g. 'per_container', 'per_bl', 'per_day', 'per_ton')\n"
            "- conditions: string (applicability or restrictions)\n"
            "- confidence: float between 0.0 and 1.0\n\n"
            f"Document text:\n{text[:15000]}"
        )

        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You output strictly valid JSON with key 'fees'."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )

        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)
        fees = parsed.get("fees", [])
        if isinstance(fees, list):
            return fees
        return []
    except Exception as exc:
        logger.warning(f"LLM extraction failed ({exc}); falling back to rule-based parser.")
        return _extract_with_fallback(text)


def _extract_with_fallback(text: str) -> List[Dict[str, Any]]:
    """Deterministic rule-based and HTML table parser fallback when no LLM API key is provided."""
    fees: List[Dict[str, Any]] = []

    # 1. Parse HTML tables if present
    soup = BeautifulSoup(text, "html.parser")
    tables = soup.find_all("table")

    for table in tables:
        headers = []
        thead = table.find("thead")
        if thead:
            headers = [th.get_text(strip=True).lower() for th in thead.find_all("th")]

        tbody = table.find("tbody") or table
        for tr in tbody.find_all("tr"):
            tds = tr.find_all("td")
            if not tds or len(tds) < 4:
                continue

            row_values = [td.get_text(strip=True) for td in tds]

            # Match columns by header or position
            fee_name = ""
            fee_code = ""
            port_unlocode = ""
            container_type = "ALL"
            amount = 0.0
            currency = "USD"
            unit = "per_container"
            conditions = ""

            if headers and len(headers) == len(row_values):
                col_map = dict(zip(headers, row_values))
                fee_name = col_map.get("charge name") or col_map.get("fee name") or col_map.get("item") or ""
                fee_code = col_map.get("fee code") or col_map.get("code") or ""
                port_unlocode = (
                    col_map.get("port un/locode")
                    or col_map.get("port")
                    or col_map.get("applicable port")
                    or col_map.get("origin port")
                    or col_map.get("destination port")
                    or ""
                )
                container_type = col_map.get("container type") or "ALL"
                raw_amt = col_map.get("amount") or "0"
                currency = col_map.get("currency") or "USD"
                unit = col_map.get("unit") or "per_container"
                conditions = col_map.get("conditions") or col_map.get("notes") or ""
            else:
                fee_name = row_values[0]
                if len(row_values) > 1:
                    fee_code = row_values[1]
                if len(row_values) > 2:
                    port_unlocode = row_values[2]
                if len(row_values) > 3:
                    container_type = row_values[3]
                raw_amt = row_values[4] if len(row_values) > 4 else "0"
                currency = row_values[5] if len(row_values) > 5 else "USD"
                unit = row_values[6] if len(row_values) > 6 else "per_container"
                conditions = row_values[7] if len(row_values) > 7 else ""

            # Parse numeric amount
            try:
                clean_amt = re.sub(r"[^\d.]", "", str(raw_amt))
                amount = float(clean_amt) if clean_amt else 0.0
            except ValueError:
                amount = 0.0

            if amount > 0 or "demurrage" in fee_name.lower():
                fees.append({
                    "fee_name": fee_name or fee_code or "Accessorial Charge",
                    "fee_code": fee_code or "OTHER",
                    "port_unlocode": port_unlocode.upper() if port_unlocode else "GLOBAL",
                    "carrier_scac": "MAEU" if "maersk" in text.lower() else ("MSCU" if "msc" in text.lower() else None),
                    "container_type": container_type.upper() if container_type else "ALL",
                    "amount": amount,
                    "currency": currency.upper() if currency else "USD",
                    "unit": unit.lower() if unit else "per_container",
                    "conditions": conditions,
                    "confidence": 0.95,
                })

    # 2. If no table rows matched, fall back to line-by-line regex
    if not fees:
        pattern = re.compile(
            r"(?P<name>[A-Za-z\s\-/]+?)\s*[:\-]\s*(?P<currency>USD|EUR|CNY|\$)?\s*(?P<amount>[0-9]+(?:\.[0-9]{2})?)\s*(?P<curr2>USD|EUR|CNY)?\s*(?:per\s+(?P<unit>[a-zA-Z_]+))?",
            re.IGNORECASE
        )
        for line in text.splitlines():
            m = pattern.search(line)
            if m:
                curr = m.group("currency") or m.group("curr2") or "USD"
                if curr == "$":
                    curr = "USD"
                fees.append({
                    "fee_name": m.group("name").strip(),
                    "fee_code": "OTHER",
                    "port_unlocode": "CNSHA" if "CNSHA" in text else "GLOBAL",
                    "carrier_scac": None,
                    "container_type": "ALL",
                    "amount": float(m.group("amount")),
                    "currency": curr.upper(),
                    "unit": m.group("unit") or "per_container",
                    "conditions": line.strip(),
                    "confidence": 0.80,
                })

    return fees


def extract_fees_from_text(text: str) -> List[Dict[str, Any]]:
    """Extract fees using LLM if API key configured, otherwise use rule-based fallback."""
    if LLM_API_KEY:
        return _extract_with_llm(text)
    return _extract_with_fallback(text)
