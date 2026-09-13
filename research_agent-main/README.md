# Shipping Landed-Cost Research Agent

An intelligent ocean freight cost-aggregation system that calculates the **true landed cost** of container shipments by extracting, normalizing, and combining base freight rates with localized accessorial charges (Terminal Handling Charges (THC), Bunker Adjustment Factor (BAF), Currency Adjustment Factor (CAF), ISPS vessel/port security, documentation tariffs, and demurrage schedules).

---

## Architecture Overview

```
                                 ┌─────────────────────────────────┐
                                 │      React + Vite Frontend      │
                                 │   • Quote Estimator Page        │
                                 │   • Normalized Fee Browser      │
                                 └────────────────┬────────────────┘
                                                  │
                                                  │ REST API (:8001)
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │       FastAPI Application       │
                                 │   • POST /v1/quote              │
                                 │   • GET  /v1/ports              │
                                 │   • GET  /v1/carriers           │
                                 │   • GET  /v1/fees               │
                                 │   • GET  /v1/fees/{id}/source   │
                                 │   • POST /v1/refresh            │
                                 │   • GET  /v1/health             │
                                 └────────────────┬────────────────┘
                                                  │
         ┌────────────────────────────────────────┼────────────────────────────────────────┐
         │                                        │                                        │
         ▼                                        ▼                                        ▼
┌──────────────────┐                     ┌──────────────────┐                     ┌──────────────────┐
│  PostgreSQL DB   │                     │ Redis Task Queue │                     │ Fixture Corpus   │
│  (pgvector /     │                     │ (Broker & Result │                     │ (HTML/PDF        │
│   SQLAlchemy 2)  │                     │  Backend)        │                     │  Schedules)      │
└────────▲─────────┘                     └────────┬─────────┘                     └────────▲─────────┘
         │                                        │                                        │
         │                                        ▼                                        │
         │                             ┌──────────────────────┐                            │
         └─────────────────────────────┤ Celery Worker Pool   ├────────────────────────────┘
                                       │ • Retrieval Agent    │
                                       │ • Extraction Agent   │
                                       │ • Normalization Agent│
                                       │ • Monitoring Agent   │
                                       └──────────────────────┘
```

---

## Directory Structure

```
shipping-cost-agent/
├── api/
│   ├── main.py                # FastAPI entrypoint, lifespan, CORS, health endpoint
│   ├── routers/
│   │   ├── quote.py           # POST /v1/quote landed cost calculation with Incoterms engine
│   │   ├── ports.py           # GET /v1/ports autocomplete
│   │   ├── carriers.py        # GET /v1/carriers autocomplete
│   │   └── fees.py            # GET /v1/fees, /v1/fees/{id}/source, POST /v1/refresh
│   ├── models/                # Pydantic schemas (QuoteRequest, FeeResponse, Port, Carrier)
│   ├── db/                    # SQLAlchemy models (Port, Carrier, Source, Fee, CrawlJob)
│   └── deps.py                # Database session generator, AppSettings, CORS
├── workers/
│   ├── celery_app.py          # Celery configuration, task definitions & sync runner
│   ├── retrieval_agent.py     # Fetches document content & computes SHA-256 hash
│   ├── extraction_agent.py    # Dispatches text to LLM or deterministic fallback parser
│   ├── normalization_agent.py # Keyword taxonomy mapping to CanonicalFee & DB insertion
│   ├── monitoring_agent.py    # Snapshot hashing & diff detection
│   └── discovery_agent.py     # Discovers new source candidates
├── shared/
│   ├── schema.py              # CanonicalFee Pydantic schema and FeeType/Incoterm enums
│   └── llm_client.py          # OpenAI-compatible client wrapper with regex fallback
├── fixtures/
│   ├── sample_carrier_tariff.html       # Maersk ocean freight, BAF, CAF, THC, DOC
│   ├── sample_port_authority_fees.html  # Shanghai, LA, Rotterdam harbor dues & ISPS
│   └── sample_terminal_charges.html     # APM & Eurogate THC, inspection, demurrage
├── migrations/                # Alembic migrations (001_initial_schema.py)
├── frontend/                  # React app (Vite + TypeScript)
│   ├── src/
│   │   ├── api/client.ts      # Typed fetch client
│   │   ├── components/        # Navbar, SourceModal
│   │   ├── pages/             # QuotePage, FeesBrowsePage
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── tests/                     # Automated pytest test suite
├── docker-compose.yml         # Postgres (pgvector), Redis, API, Worker, Celery-Beat
├── Dockerfile.api
├── Dockerfile.worker
├── .env.example
├── seed.py                    # End-to-end seed script executing real pipeline
├── requirements.txt
└── README.md
```

---

## Quickstart: Running with Docker Compose

To bring up the entire backend, Postgres (with pgvector), Redis, and Celery workers:

```bash
# 1. Clone or navigate to the directory
cd shipping-cost-agent

# 2. Start all services
docker compose up -d

# 3. Apply migrations
docker compose exec api alembic upgrade head

# 4. Run the seed script through the real extraction pipeline
docker compose exec api python seed.py

# 5. Verify the API is healthy
curl http://localhost:8001/v1/health
```

### Starting the React Frontend

The React frontend runs separately via Vite and calls the backend:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Local Development (Without Docker)

You can also run the system locally using Python and Node:

### 1. Python Backend Setup
```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run database migrations (or init_db will automatically create tables)
python seed.py

# Start the FastAPI development server
uvicorn api.main:app --reload --port 8001
```

### 2. Celery Worker (Optional if running Redis locally)
```bash
celery -A workers.celery_app.celery_app worker --loglevel=info
```
*(Note: If Redis is not running, `seed.py` and the API's `/v1/refresh` automatically run synchronously in-process.)*

### 3. Run Automated Tests
```bash
python -m pytest
```

---

## How the LLM Extraction & Fallback Works

The extraction agent (`shared/llm_client.py` and `workers/extraction_agent.py`) is designed to extract structured fee line items from unstructured or semi-structured tariff text:

1. **When `LLM_API_KEY` is provided**:
   - Uses an OpenAI-compatible client (`openai>=1.12.0`).
   - Supports any OpenAI-compatible endpoint (OpenAI, Groq, Ollama, OpenRouter, etc.) configured via `LLM_BASE_URL` and `LLM_MODEL`.
   - Passes a structured system prompt requesting a strict JSON object with a `fees` list containing fee codes, amounts, currencies, units, and applicability conditions.

2. **When `LLM_API_KEY` is NOT provided (Default Fallback Mode)**:
   - Activates `_extract_with_fallback()`.
   - Parses HTML tables using `BeautifulSoup` to map table headers (Charge Name, Fee Code, Origin/Destination Port, Container Type, Amount, Currency, Unit, Conditions).
   - If plain text without tables is provided, falls back to a regex parser that extracts monetary amounts, currencies, and charge names.
   - Assigns extraction confidence scores (0.95 for table parses, 0.80 for regex matches).
   - **Zero external API dependencies required for testing and local runs!**

---

## Incoterms 2020 Landed Cost Allocation

The landed-cost engine (`api/routers/quote.py`) assigns responsibility for each fee line item based on standard maritime Incoterms rules:

| Incoterm | Origin Local Fees | Ocean Freight & Surcharges (BAS, BAF, CAF) | Destination Local Fees | Buyer Landed Cost Includes |
| :--- | :--- | :--- | :--- | :--- |
| **FOB** *(Free on Board)* | Seller pays export DOC & customs; **Origin THC is buyer's carrier responsibility** | Buyer pays | Buyer pays | Origin THC + Ocean Freight + Destination Accessorials |
| **EXW** *(Ex Works)* | Buyer pays | Buyer pays | Buyer pays | All origin charges + Freight + Destination charges |
| **FCA** *(Free Carrier)* | Seller pays origin to handover | Buyer pays | Buyer pays | Ocean Freight + Destination charges |
| **CFR / CIF** | Seller pays | Seller pays | Buyer pays | Destination charges (Import THC, Harbor dues) |
| **DAP** | Seller pays | Seller pays | Buyer pays | Destination import clearance and handling |
| **DDP** | Seller pays | Seller pays | Seller pays | Minimal / zero buyer landed cost |

*Demurrage Alert*: Post-discharge daily demurrage tariffs ($140.00/day after 4 free days) are flagged in the warning list as operational contingencies rather than lumped into upfront shipping costs.

---

## How to Add a New Port, Carrier, or Fixture

1. **Add a Port**:
   Insert a new entry in `seed.py` (e.g. `{"unlocode": "SGSIN", "name": "Singapore", "country": "SG"}`).
2. **Add a Carrier**:
   Insert a new carrier in `seed.py` (e.g. `{"scac_code": "CMAU", "name": "CMA CGM"}`).
3. **Add a Fixture**:
   - Place your HTML or text tariff document under `fixtures/` (e.g. `fixtures/sample_cma_cgm_tariff.html`).
   - Register the source in `seed.py` with `url_or_fixture_path="fixtures/sample_cma_cgm_tariff.html"`.
   - Run `python seed.py` or trigger `POST /v1/refresh`.

---

## Known Limitations / What's Stubbed for Now

- **No live web crawling yet**: Documents are ingested from local fixture files in `fixtures/` instead of live carrier and port websites to ensure reliable and repeatable offline execution.
- **Simplified Incoterm rule table**: The Incoterms engine implements a simplified ruleset distinguishing Buyer vs. Seller responsibility across standard maritime terms (FOB, EXW, CIF, CFR, FCA, DAP, DDP). Edge-case bilateral buyer-seller amendments are not evaluated.
- **No authentication on the API yet**: API endpoints are unauthenticated for development and evaluation purposes.
- **No human-review queue yet**: Extracted fees are normalized directly into the database. A human verification workflow for low-confidence (<0.85) fees can be added to the Celery pipeline.
