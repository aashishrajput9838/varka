<div align="center">

# ⚓ VARKA
### *Prediction se decision tak — Make every voyage smarter*

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-3776ab?style=for-the-badge&logo=python)](https://python.org/)
[![Gemini 2.5 Flash](https://img.shields.io/badge/AI-Gemini_2.5_Flash-8e75c2?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost_Ensemble-ff7f0e?style=for-the-badge)](https://xgboost.readthedocs.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**VARKA** is an enterprise-grade maritime intelligence platform bridging the gap between dry-bulk market predictions and decisive commercial execution. From 60-day machine learning freight forecasts and accessorial landed-cost calculation to decarbonized Just-in-Time (JIT) arrival planning and live AIS telemetry, VARKA provides charterers, shipowners, and commodity traders with an end-to-end operational cockpit.

[Platform Overview](#-platform-overview) • [Architecture](#-architecture) • [Workspace Modules](#-workspace-modules) • [Directory Structure](#-directory-structure) • [Quick Start](#-quick-start) • [Port Reference](#-network--port-matrix)

---

</div>

## 🌐 Platform Overview

Maritime freight markets are notoriously opaque, volatile, and burdened by hidden accessorial charges. **VARKA** solves this through five interconnected pillars:

1. **Dry-Bulk Machine Learning Forecasting**: Multi-horizon XGBoost models predicting $/MT rates and laycan windows with explainable SHAP-style attribution.
2. **True Landed-Cost Research Agent**: Ingests, normalizes, and itemizes carrier tariffs, origin/destination Terminal Handling Charges (THC), bunker surcharges (BAF/CAF), and destination demurrage schedules.
3. **Decarbonized JIT Digital Twin**: Simulates slow-steaming instructions aligned with real-time port berth queues, slashing bunker consumption and CO₂ emissions.
4. **Live AIS Global Ship Tracking**: Real-time streaming integration with AISStream over WebSockets, visualizing vessel coordinates, speed, and headings on interactive nautical maps.
5. **VARKA INTELLIGENCE**: A native floating contextual AI copilot powered by Google Gemini 2.5 Flash with live bidirectional WebSocket synchronization of charter state.

---

## 🏗️ Architecture

```
                                      ┌────────────────────────────────────────┐
                                      │        VARKA DESKTOP DASHBOARD         │
                                      │        (Next.js 15 + React 19)         │
                                      │        http://localhost:3000           │
                                      └───────────────────┬────────────────────┘
                                                          │
                   ┌──────────────────────────────────────┼──────────────────────────────────────┐
                   │                                      │                                      │
                   ▼                                      ▼                                      ▼
     ┌───────────────────────────┐          ┌───────────────────────────┐          ┌───────────────────────────┐
     │      EXPRESS BACKEND      │          │    PORT PREDICTION API    │          │     LANDED-COST AGENT     │
     │      (Node.js + TS)       │          │     (FastAPI + ML)        │          │    (FastAPI + Celery)     │
     │   http://localhost:3030   │          │   http://localhost:8000   │          │   http://localhost:8001   │
     └─────────────┬─────────────┘          └───────────────────────────┘          └─────────────┬─────────────┘
                   │                                                                             │
                   ├───────────────────────┐                                                     ▼
                   │                       │                                       ┌───────────────────────────┐
                   ▼                       ▼                                       │   REACT VITE TARIFF APP   │
     ┌───────────────────────────┐   ┌───────────────────────────┐                 │   http://localhost:5173   │
     │    VARKA INTELLIGENCE     │   │     LIVE SHIP TRACKER     │                 └───────────────────────────┘
     │      (WebSocket WS)       │   │    (Node.js + Leaflet)    │
     │   /ws/varka-intelligence  │   │   http://localhost:3001   │
     └─────────────┬─────────────┘   └─────────────┬─────────────┘
                   │                               │
                   ▼                               ▼
     ┌───────────────────────────┐   ┌───────────────────────────┐
     │   Gemini 2.5 Flash LLM    │   │   AISStream WebSocket     │
     │  (Google GenAI SDK 2.22)  │   │ (wss://stream.aisstream)  │
     └───────────────────────────┘   └───────────────────────────┘
```

---

## 🗂️ Workspace Modules

### 1. 🧭 Tracking (`/`)
- Real-time voyage progression tracking across Indian coastal and international trade lanes (e.g. *M/V Ocean Sentinel*, *VRK-9021-IN*).
- Interactive waypoint progression, milestone timestamps, speed over ground, and ETA confidence bands.

### 2. 💲 Landed-Cost Agent (`landed-cost`)
- High-precision calculation of total landed freight cost combining liner rates with local port accessorials.
- Automatic liability apportionment based on **Incoterms 2020** (FOB, CIF, CFR, EXW, DDP).
- Itemized fee categorization: Base Freight (BAS), Bunker Adjustment (BAF), Currency Adjustment (CAF), Terminal Handling (THC), Documentation (DOC), ISPS Security, and daily Demurrage contingency rules.
- Interactive Source Provenance modal displaying SHA-256 verified tariff schedule extracts.

### 3. 🛡️ Charter Decision Cockpit (`cockpit`)
- Executive briefing card quantifying charter commercial posture, contract exposure, and spot savings.
- Risk radar detecting laycan delays, adverse marine weather, and congestion spikes before fixture sign-off.

### 4. ⚙️ Vessel Optimizer (`optimizer`)
- Multi-objective bulk carrier allocation engine.
- Ranks candidate hulls by freight cost per metric ton, total CO₂ emissions, parcel capacity fit, and commercial readiness score.

### 5. ⚡ JIT Digital Twin (`jit`)
- Berth-aligned arrival speed governor.
- Recommends slow steaming (e.g., 14.5 kn → 10.8 kn) to eliminate idle waiting at outer anchorages.
- Directly models fuel expenditure reduction and metric tons of CO₂ abated.

### 6. 📈 Port Forecast (`prediction`)
- 60-day dry-bulk freight forecasting trained with gradient boosting (XGBoost) across major trade routes (e.g. Australia Newcastle `AUNTL` → Paradip `INPAR`).
- Explainable AI (XAI) feature importance attributing predictions to bunker prices, port wait times, and macroeconomic indicators.

### 7. 🎛️ Scenario Studio (`scenarios`)
- Monte Carlo stress-testing environment for 60-day charter commitments.
- Simulates market paths across Baseline, Congestion Escalation, Bull Market, and Global Recession scenarios.

### 8. 🏆 Port Scorecard (`scorecard`)
- Operational performance benchmarks for key Indian ports: Chennai, Paradip, Haldia, Visakhapatnam, and Tuticorin.
- Compares berth availability, cargo throughput rates (MT/day), and average pre-berthing wait times.

### 9. 🚢 Fleet & Multi-Voyage (`fleet`)
- Real hull roster visibility by laycan dates (Capesize, Kamsarmax, Panamax, Supramax).
- Commercial strategy evaluator comparing single spot fixtures against 3-voyage and 6-voyage Contract of Affreightment (CoA) agreements.

### 10. ⚠️ Risk & Audit (`risk`)
- Composite risk scoring (0–100) aggregating port delay, freight variance, fleet availability, and weather drivers.
- Tamper-proof, immutable decision audit trail logging timestamped fixtures and parameters.

### 11. 🌐 Standards & Data (`standards`)
- Standards-ready data interoperability mapping dashboard fields directly to **DCSA Port Call Standards** and **IMO Maritime Single Window**.
- Enriched with live external signals from World Bank Logistics Indices and Open-Meteo marine wave models.

### 12. 🤖 VARKA Intelligence (Contextual AI Copilot)
- Persistent floating copilot in the bottom-right corner of the authenticated dashboard.
- Live operational context synchronization: The assistant dynamically knows your active tab, active voyage reference, vessel name, and route.
- One-click contextual chips for instantaneous tactical maritime analysis.

### 13. 🛰️ Live Ship Tracker (`ship-tracking`)
- Standalone real-time vessel tracking application powered by direct WebSocket connection to AISStream.
- Features dynamic OpenStreetMap / Leaflet map, speed-coded vessel icons, historical vessel trajectories, and MMSI search.

---

## 📁 Directory Structure

```
varka/
├── backend/                       # Express + TypeScript API Server (:3030)
│   ├── src/
│   │   ├── config/                # Environment variables & constants
│   │   ├── controllers/           # Auth, voyage, and user handlers
│   │   ├── routes/                # REST endpoints
│   │   ├── services/              # Gemini 2.5 Flash SDK & Context engine
│   │   ├── websocket/             # Bidirectional Varka Intelligence WS
│   │   └── server.ts              # HTTP & WebSocket bootstrap
│   └── package.json
│
├── landing-page/                  # Next.js 15 Production Frontend (:3000)
│   ├── app/
│   │   ├── landing/               # Public promotional landing page
│   │   ├── signin/                # Authentication page
│   │   ├── page.tsx               # Authenticated workspace dashboard
│   │   └── globals.css            # Luxury dark maritime design system
│   ├── components/
│   │   └── dashboard/
│   │       ├── LandedCostPanel.tsx# Embedded ocean freight landed-cost UI
│   │       ├── PortPredictionPanel.tsx # ML rate forecast & optimizer tabs
│   │       ├── Sidebar.tsx        # Responsive left navigation
│   │       ├── TrackingPanel.tsx  # Voyage live monitoring
│   │       └── varka-intelligence/# Floating contextual AI Copilot
│   └── package.json
│
├── port_prediction--main/         # Dry-Bulk ML Prediction Engine (:8000)
│   ├── api/
│   │   ├── main.py                # FastAPI endpoints (/api/v1/predict/...)
│   │   └── routes.py              # Weather, scorecard, fleet, and JIT routes
│   ├── model/                     # Serialized XGBoost models & weights
│   ├── engine.py                  # Core inference pipeline & XAI feature attribution
│   ├── decision_support.py        # Charter fixture recommendation logic
│   └── requirements.txt
│
├── research_agent-main/           # Landed-Cost & Tariff Aggregator (:8001)
│   ├── api/                       # FastAPI Landed-Cost endpoints (/v1/quote)
│   ├── workers/                   # Celery extraction & normalization pipeline
│   ├── shared/                    # Pydantic schemas & LLM client wrapper
│   ├── fixtures/                  # Local carrier & terminal tariff schedules
│   ├── seed.py                    # End-to-end database initialization script
│   ├── frontend/                  # React + Vite standalone tariff portal (:5173)
│   └── requirements.txt
│
├── ship-tracking/                 # Real-Time AISStream Vessel Tracker (:3001)
│   ├── server.js                  # Express backend + AISStream WS client
│   ├── index.html                 # Interactive Leaflet map & vessel list
│   └── package.json
│
├── .gitignore                     # Repository-wide recursive ignore rules
└── README.md                      # Platform documentation
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** 20.x or higher
- **Python** 3.12 or higher
- **npm** or **pnpm**
- **Git**

---

### 1. Clone the Repository
```bash
git clone https://github.com/aashishrajput9838/varka.git
cd varka
```

---

### 2. Run the Main Backend (:3030)
```powershell
cd backend
npm install
npm run dev
```
*Creates HTTP server at `http://localhost:3030` and WebSocket at `ws://localhost:3030/ws/varka-intelligence`.*

---

### 3. Run the Next.js Dashboard (:3000)
```powershell
cd landing-page
npm install
npm run dev
```
*Access the main Varka interface at [http://localhost:3000](http://localhost:3000).*

---

### 4. Run the Port Prediction ML Engine (:8000)
```powershell
cd port_prediction--main
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```
*API documentation available at [http://localhost:8000/docs](http://localhost:8000/docs).*

---

### 5. Run the Landed-Cost Research Agent (:8001 & :5173)
```powershell
cd research_agent-main
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Seed the database fixtures and normalize initial tariffs
python seed.py

# Start FastAPI backend
python -m uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
```
*Optionally run its standalone Vite frontend:*
```powershell
cd research_agent-main\frontend
npm install
npm run dev
```
*Landed-Cost API docs: [http://localhost:8001/docs](http://localhost:8001/docs) • Standalone UI: [http://localhost:5173](http://localhost:5173).*

---

### 6. Run the Live Ship Tracker (:3001)
```powershell
cd ship-tracking
npm install
node server.js
```
*Live AIS map running at [http://localhost:3001](http://localhost:3001).*

---

## 📡 Network & Port Matrix

| Service | Port | Protocol | Description | URL |
| :--- | :---: | :---: | :--- | :--- |
| **Varka Dashboard** | `3000` | HTTP | Next.js 15 main application & 13 workspace modules | [localhost:3000](http://localhost:3000) |
| **Varka Backend** | `3030` | HTTP / WS | Express auth, voyage database & Gemini AI WebSocket | [localhost:3030](http://localhost:3030) |
| **Port Prediction ML** | `8000` | HTTP | XGBoost dry-bulk rate forecasting & JIT twin API | [localhost:8000/docs](http://localhost:8000/docs) |
| **Landed-Cost API** | `8001` | HTTP | Accessorial tariff aggregation & Incoterms quote engine | [localhost:8001/docs](http://localhost:8001/docs) |
| **Landed-Cost UI** | `5173` | HTTP | Standalone React Vite tariff explorer | [localhost:5173](http://localhost:5173) |
| **Live Ship Tracker** | `3001` | HTTP / WS | AISStream live GPS vessel tracking on Leaflet map | [localhost:3001](http://localhost:3001) |

---

## 🔑 Environment Variables Reference

### `backend/.env`
```ini
PORT=3030
JWT_SECRET=varka_super_secret_jwt_key_2026_maritime
CORS_ORIGIN=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key_here
```

### `research_agent-main/.env`
```ini
DATABASE_URL=sqlite:///./shipping_cost.db
REDIS_URL=redis://localhost:6379/0
LLM_API_KEY=your_llm_api_key_here
LLM_MODEL=gemini-2.5-flash
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
CORS_ORIGINS=*
```

### `ship-tracking/.env`
```ini
PORT=3000
AISSTREAM_API_KEY=your_aisstream_api_key_here
```

---

## 🎨 Design System & Visual Identity

The VARKA interface embodies a luxury industrial maritime design language:
- **Foundational Canvas**: Deep obsidian and burnished mahogany (`#14110f`, `#181310`, `#211b17`).
- **Accent Signals**: Maritime rust and amber alert indicators (`#e65a2f`, `#f59e0b`, `#22c55e`).
- **Typography**: High-editorial serif headlines paired with crisp technical sans-serif and tabular monospace figures.
- **Glassmorphism**: Subtle translucent borders (`rgba(241, 233, 223, 0.08)`) and ambient navigational beacons.

---

## 📄 License

This repository is proprietary software developed for the **VARKA Freight Intelligence Platform**.  
© 2026 VARKA Platform. All rights reserved.
