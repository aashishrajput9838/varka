"""
Varka Platform API Documentation Generator
Generates an enterprise-grade Word (.docx) document detailing every single API,
endpoint, request/response schema, WebSocket event, and service integration
across the entire Varka codebase.
"""

import os
import sys
from datetime import datetime
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# Colors
HEX_PRIMARY = "0F172A"      # Deep Navy
HEX_SECONDARY = "0284C7"    # Ocean Blue
HEX_DARK = "1E293B"         # Slate Dark
HEX_MUTED = "64748B"        # Slate Muted
HEX_LIGHT_BG = "F8FAFC"     # Slate Light Tint
HEX_CODE_BG = "F1F5F9"      # Code block light gray
HEX_BORDER = "CBD5E1"       # Border gray
HEX_GET = "16A34A"          # Green
HEX_POST = "2563EB"         # Blue
HEX_WS = "7C3AED"           # Purple
HEX_WARN = "D97706"         # Amber

COLOR_PRIMARY = RGBColor(15, 23, 42)
COLOR_SECONDARY = RGBColor(2, 132, 199)
COLOR_DARK = RGBColor(30, 41, 59)
COLOR_MUTED = RGBColor(100, 116, 139)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color=HEX_BORDER, sz="4", val="single"):
    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for border_name in ['top', 'left', 'bottom', 'right', 'insideH']:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), val)
        border.set(qn('w:sz'), sz)
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), color)
        tblBorders.append(border)
    border_v = OxmlElement('w:insideV')
    border_v.set(qn('w:val'), 'none')
    tblBorders.append(border_v)
    tblPr.append(tblBorders)

def add_callout(doc, text, title="NOTE", callout_type="info"):
    bg = "EFF6FF" if callout_type == "info" else ("FFFBEB" if callout_type == "warning" else "F0FDF4")
    border_color = "3B82F6" if callout_type == "info" else ("F59E0B" if callout_type == "warning" else "22C55E")
    
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg)
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    left_b = OxmlElement('w:left')
    left_b.set(qn('w:val'), 'single')
    left_b.set(qn('w:sz'), '24')
    left_b.set(qn('w:space'), '0')
    left_b.set(qn('w:color'), border_color)
    tcBorders.append(left_b)
    for b in ['top', 'bottom', 'right']:
        nb = OxmlElement(f'w:{b}')
        nb.set(qn('w:val'), 'none')
        tcBorders.append(nb)
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    run_title = p.add_run(f"[{title}] ")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(9.5)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(15, 23, 42)
    
    run_text = p.add_run(text)
    run_text.font.name = "Arial"
    run_text.font.size = Pt(9.5)
    run_text.font.color.rgb = RGBColor(51, 65, 85)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(4)

def add_code_block(doc, code_text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, HEX_CODE_BG)
    set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    left_b = OxmlElement('w:left')
    left_b.set(qn('w:val'), 'single')
    left_b.set(qn('w:sz'), '16')
    left_b.set(qn('w:space'), '0')
    left_b.set(qn('w:color'), HEX_SECONDARY)
    tcBorders.append(left_b)
    for b in ['top', 'bottom', 'right']:
        nb = OxmlElement(f'w:{b}')
        nb.set(qn('w:val'), 'single')
        nb.set(qn('w:sz'), '4')
        nb.set(qn('w:color'), HEX_BORDER)
        tcBorders.append(nb)
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(code_text.strip())
    run.font.name = "Consolas"
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(15, 23, 42)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(4)

def add_endpoint_card(doc, method, path, summary, auth_str="None", gateway_path=None):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
    
    border_color = HEX_GET if method == "GET" else (HEX_POST if method == "POST" else (HEX_WS if method == "WS" else "DC2626"))
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    left_b = OxmlElement('w:left')
    left_b.set(qn('w:val'), 'single')
    left_b.set(qn('w:sz'), '24')
    left_b.set(qn('w:space'), '0')
    left_b.set(qn('w:color'), border_color)
    tcBorders.append(left_b)
    for b in ['top', 'bottom', 'right']:
        nb = OxmlElement(f'w:{b}')
        nb.set(qn('w:val'), 'single')
        nb.set(qn('w:sz'), '4')
        nb.set(qn('w:color'), HEX_BORDER)
        tcBorders.append(nb)
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    
    r_method = p.add_run(f" {method} ")
    r_method.font.name = "Arial"
    r_method.font.size = Pt(9.5)
    r_method.font.bold = True
    if method == "GET":
        r_method.font.color.rgb = RGBColor(22, 163, 74)
    elif method == "POST":
        r_method.font.color.rgb = RGBColor(37, 99, 235)
    elif method == "WS":
        r_method.font.color.rgb = RGBColor(124, 58, 237)
    else:
        r_method.font.color.rgb = RGBColor(220, 38, 38)
        
    r_path = p.add_run(f"  {path}")
    r_path.font.name = "Consolas"
    r_path.font.size = Pt(10)
    r_path.font.bold = True
    r_path.font.color.rgb = COLOR_PRIMARY
    
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(0)
    r_desc = p2.add_run(summary)
    r_desc.font.name = "Arial"
    r_desc.font.size = Pt(9)
    r_desc.font.color.rgb = RGBColor(71, 85, 105)
    
    details_str = f" • Auth: {auth_str}"
    if gateway_path:
        details_str += f" • Gateway Proxy: {gateway_path}"
    r_auth = p2.add_run(details_str)
    r_auth.font.name = "Arial"
    r_auth.font.size = Pt(8.5)
    r_auth.font.italic = True
    r_auth.font.color.rgb = RGBColor(100, 116, 139)

    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(4)

def add_table_custom(doc, headers, rows_data, col_widths=None):
    table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)
    
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], HEX_PRIMARY)
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        for run in p.runs:
            run.font.name = "Arial"
            run.font.size = Pt(9)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
            
    for row_idx, row_data in enumerate(rows_data):
        row_cells = table.rows[row_idx + 1].cells
        bg_color = HEX_LIGHT_BG if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            row_cells[col_idx].text = str(cell_value)
            set_cell_background(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx], top=70, bottom=70, left=140, right=140)
            p = row_cells[col_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            for run in p.runs:
                run.font.name = "Arial"
                run.font.size = Pt(8.5)
                run.font.color.rgb = COLOR_DARK
                
    if col_widths:
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)
                
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(4)

def add_heading_1(doc, text):
    h = doc.add_heading(text, level=1)
    h.paragraph_format.space_before = Pt(16)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    for r in h.runs:
        r.font.name = "Arial"
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = COLOR_PRIMARY

def add_heading_2(doc, text):
    h = doc.add_heading(text, level=2)
    h.paragraph_format.space_before = Pt(12)
    h.paragraph_format.space_after = Pt(3)
    h.paragraph_format.keep_with_next = True
    for r in h.runs:
        r.font.name = "Arial"
        r.font.size = Pt(12.5)
        r.font.bold = True
        r.font.color.rgb = COLOR_SECONDARY

def add_heading_3(doc, text):
    h = doc.add_heading(text, level=3)
    h.paragraph_format.space_before = Pt(8)
    h.paragraph_format.space_after = Pt(2)
    h.paragraph_format.keep_with_next = True
    for r in h.runs:
        r.font.name = "Arial"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = COLOR_DARK

def add_body(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        rb = p.add_run(bold_prefix)
        rb.font.name = "Arial"
        rb.font.size = Pt(9.5)
        rb.font.bold = True
        rb.font.color.rgb = COLOR_PRIMARY
    r = p.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = COLOR_DARK
    return p

# ---------------------------------------------------------------------------
# MAIN DOCUMENT GENERATION
# ---------------------------------------------------------------------------
def build_varka_api_docs():
    doc = docx.Document()
    
    # 1-inch margins
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        
    # COVER / HEADER
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(24)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("VARKA PLATFORM API SPECIFICATION")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_PRIMARY
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run("Complete Reference for All Microservices, REST Endpoints, WebSocket Protocols, and Inter-Service Flows")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = COLOR_SECONDARY
    
    # Metadata Table
    meta_headers = ["Attribute", "Specification Value"]
    meta_rows = [
        ["Platform Name", "VARKA Maritime Intelligence & Freight Optimization Suite"],
        ["Target Monorepo", "varka (Node.js Express + Python FastAPI + Next.js + Celery + AIS)"],
        ["Monorepo Services", "backend (Node/Express), port_prediction (Python), research_agent (Python), ship-tracking (Node)"],
        ["Document Classification", "Official Enterprise Engineering API & Architecture Reference"],
        ["Primary Auth Mechanisms", "JWT (Bearer / HTTP-Only Cookie), WebSocket Query/Header Handshake"],
        ["Default Gateway Base URL", "http://localhost:3030 (Proxying /api/v1/prediction to Port 8000)"],
        ["Generated Date", datetime.now().strftime("%B %d, %Y")],
        ["API Version", "v1 (Production Aligned)"],
    ]
    add_table_custom(doc, meta_headers, meta_rows, col_widths=[2.2, 4.3])
    
    add_callout(doc, 
        "This specification documents the live APIs actually implemented and actively invoked across all services in the Varka repository. "
        "It includes request/response schemas, validation rules, error handling, WebSocket event structures, and inter-service gateway routing.",
        title="EXECUTIVE NOTICE", callout_type="info")
    
    # =========================================================================
    # SECTION 1: ARCHITECTURE OVERVIEW & SERVICE TOPOLOGY
    # =========================================================================
    add_heading_1(doc, "1. Architecture Overview & Service Topology")
    add_body(doc, 
        "The Varka platform comprises four interconnected backend services and two client frontends working in concert to deliver "
        "end-to-end dry-bulk chartering intelligence, ocean landed-cost calculations, AIS vessel tracking, and AI-driven conversational copilot capabilities.")
    
    svc_headers = ["Service Name", "Runtime / Framework", "Default Port", "Core Responsibility"]
    svc_rows = [
        ["backend (Primary Gateway)", "Node.js (ESM) / Express / TypeScript", "3030", "User authentication, JWT/Cookie management, Nodemailer OTP, Gemini WebSocket AI gateway, prediction reverse proxy."],
        ["port_prediction--main", "Python 3.10+ / FastAPI / XGBoost", "8000", "60-day recursive freight forecasting, multi-objective vessel optimization, JIT twin simulation, charter posture recommendations, Open-Meteo & World Bank context."],
        ["research_agent-main", "Python 3.10+ / FastAPI / SQLAlchemy / Celery", "8001", "True landed-cost container freight calculations, Incoterms 2020 rules, accessorial tariff extraction, fee provenance, Redis/Celery ingestion."],
        ["ship-tracking", "Node.js / Express / Leaflet UI", "3001", "Live AIS vessel telemetry ingestion via AISStream.io WebSocket, in-memory spatial index, vessel trajectory breadcrumbs, radar UI."],
        ["landing-page (Web App)", "Next.js 14 / React / Tailwind CSS", "3000", "Enterprise authenticated dashboard (Port Prediction, Landed Cost, Live Tracking, History, Varka Intelligence AI sidebar)."],
        ["research_agent / frontend", "React / Vite / TypeScript", "5173", "Dedicated interface for ocean freight landed-cost quoting, accessorial fee browsing, and source tariff auditing."]
    ]
    add_table_custom(doc, svc_headers, svc_rows, col_widths=[1.5, 1.4, 0.8, 2.8])
    
    add_heading_2(doc, "1.1 Inter-Service Data Flow & Gateway Architecture")
    add_body(doc, 
        "The Primary Node.js Backend (Port 3030) acts as the secure authenticated ingress gateway for the Next.js frontend. "
        "When the frontend interacts with dry-bulk ML intelligence, it calls '/api/v1/prediction/*', which requires a verified JWT token. "
        "The gateway verifies the caller's session via authMiddleware and proxies the request to the Python FastAPI engine (Port 8000), "
        "injecting query parameters, serializing JSON bodies, and handling upstream 503 connection errors gracefully.")
    
    add_code_block(doc, 
"""[Next.js Dashboard / Client Apps]
   │
   ├── (Auth & User Profile) ──> [Node.js Backend:3030] ──> [MongoDB Atlas]
   ├── (AI Copilot Chat WS)  ──> [Node.js WebSocket:3030] ──> [Gemini 2.5 Pro / Flash]
   ├── (ML Prediction Gateway) ─> [Node.js Gateway:3030] ──> [FastAPI ML Engine:8000]
   │                                                             │
   │                                                             ├── [Open-Meteo API]
   │                                                             └── [World Bank API]
   ├── (Landed-Cost Calculator) > [FastAPI Research:8001] ──> [SQLite / PostgreSQL]
   │                                                             │
   │                                                             └── [Celery / Redis]
   └── (Live Radar Telemetry) ─> [Express AIS Tracker:3001] <── [AISStream.io WSS]""")
    
    # =========================================================================
    # SECTION 2: PRIMARY BACKEND & AUTHENTICATION API
    # =========================================================================
    add_heading_1(doc, "2. Primary Backend & Authentication API")
    add_body(doc, "Service Directory: backend/src | Framework: Express.js + TypeScript | Database: MongoDB (Mongoose)")
    add_body(doc, 
        "Provides user onboarding, multi-factor email OTP verification, session establishment via JSON Web Tokens (stored in HTTP-Only secure cookies "
        "and returned in JSON responses), password recovery workflows, and current user profile retrieval.")
    
    add_heading_2(doc, "2.1 Endpoints Specification")
    
    # 2.1.1 Health
    add_endpoint_card(doc, "GET", "/health", "Liveness and server uptime probe", auth_str="Public")
    add_body(doc, "Checks if the Node.js Express server is running and returns an ISO UTC timestamp.")
    add_code_block(doc, 
"""// Response: 200 OK
{
  "status": "ok",
  "timestamp": "2026-09-13T04:20:00.000Z"
}""")
    
    # 2.1.2 Register
    add_endpoint_card(doc, "POST", "/api/v1/user/register", "Initiates account registration and dispatches 6-digit email OTP", auth_str="Public")
    add_body(doc, "Validates user attributes, generates a 6-digit verification OTP valid for 10 minutes, hashes the password via bcrypt (Salt Rounds: 10), generates an avatar via Dicebear, and dispatches a verification email.")
    
    p_fields = [
        ["firstName", "string", "Yes", "User's first name (1-50 chars)."],
        ["lastName", "string", "No", "User's last name (max 50 chars)."],
        ["email", "string", "Yes", "Valid email address (unique in MongoDB)."],
        ["password", "string", "Yes", "Minimum 6 characters."],
        ["gender", "string", "Yes", "Must be 'male', 'female', or 'other'."],
        ["phone", "string", "No", "Contact telephone number."]
    ]
    add_table_custom(doc, ["Field", "Type", "Required", "Description"], p_fields, col_widths=[1.2, 0.8, 0.8, 3.7])
    
    add_code_block(doc, 
"""// Request Body:
{
  "firstName": "Alexander",
  "lastName": "Wright",
  "email": "charterer@varka.ai",
  "password": "SecurePassword123!",
  "gender": "male",
  "phone": "+14155552671"
}

// Response: 200 OK
{
  "success": true,
  "message": "OTP sent successfully"
}""")
    
    # 2.1.3 Verify OTP
    add_endpoint_card(doc, "POST", "/api/v1/user/register/verify-otp", "Verifies email OTP, activates account, and issues JWT", auth_str="Public")
    add_body(doc, "Validates the OTP against the database record, ensures the token has not expired, sets 'isEmailVerified = true', issues a JWT accessToken (valid 1 day), sets an HTTP-Only secure cookie, and returns user data.")
    
    add_code_block(doc, 
"""// Request Body:
{
  "email": "charterer@varka.ai",
  "otp": "492810"
}

// Response: 200 OK
// Set-Cookie: accessToken=<JWT>; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400
{
  "success": true,
  "message": "Registration successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "66e3fa128bc94b0290e1f3a4",
      "firstName": "Alexander",
      "lastName": "Wright",
      "email": "charterer@varka.ai",
      "gender": "male",
      "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Alexander%20Wright&backgroundColor=c65d2c,171310",
      "isEmailVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}""")

    # 2.1.4 Resend OTP
    add_endpoint_card(doc, "POST", "/api/v1/user/register/resend-otp", "Regenerates and dispatches a fresh 6-digit OTP", auth_str="Public")
    add_code_block(doc, 
"""// Request Body:
{ "email": "charterer@varka.ai" }

// Response: 200 OK
{ "success": true, "message": "OTP sent successfully" }""")

    # 2.1.5 Login
    add_endpoint_card(doc, "POST", "/api/v1/user/login", "Authenticates credentials and establishes session", auth_str="Public")
    add_body(doc, "Compares plaintext password with bcrypt hash. If unverified, returns HTTP 403 with requiresVerification: true and dispatches an OTP. If verified, sets HTTP-Only accessToken cookie and returns JWT payload.")
    add_code_block(doc, 
"""// Request Body:
{
  "email": "charterer@varka.ai",
  "password": "SecurePassword123!"
}

// Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "66e3fa128bc94b0290e1f3a4",
      "firstName": "Alexander",
      "lastName": "Wright",
      "email": "charterer@varka.ai",
      "gender": "male",
      "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Alexander%20Wright...",
      "isEmailVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}""")

    # 2.1.6 Logout
    add_endpoint_card(doc, "POST", "/api/v1/user/logout", "Terminates user session and clears cookie", auth_str="Public")
    add_code_block(doc, 
"""// Response: 200 OK
// Set-Cookie: accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
{ "success": true, "message": "Logged out successfully" }""")

    # 2.1.7 Get Me
    add_endpoint_card(doc, "GET", "/api/v1/user/me", "Retrieves profile of the authenticated caller", auth_str="JWT (Cookie or Bearer Header)")
    add_body(doc, "Protected by authMiddleware. Decodes the accessToken, queries MongoDB for the user record, and returns profile details without password hash.")
    add_code_block(doc, 
"""// Headers: Authorization: Bearer <JWT>   (or Cookie: accessToken=<JWT>)
// Response: 200 OK
{
  "success": true,
  "data": {
    "user": {
      "id": "66e3fa128bc94b0290e1f3a4",
      "firstName": "Alexander",
      "lastName": "Wright",
      "email": "charterer@varka.ai",
      "gender": "male",
      "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Alexander%20Wright...",
      "isEmailVerified": true
    }
  }
}""")

    # 2.1.8 Forgot & Reset Password
    add_endpoint_card(doc, "POST", "/api/v1/user/forgot-password", "Generates and sends password reset verification code", auth_str="Public")
    add_body(doc, "Generates 15-minute reset OTP and sends an email via SMTP.")
    add_code_block(doc, 
"""// Request: { "email": "charterer@varka.ai" }
// Response: 200 OK
{ "success": true, "message": "Password reset verification code dispatched to your email" }""")

    add_endpoint_card(doc, "POST", "/api/v1/user/reset-password", "Verifies reset code, updates password, and logs user in", auth_str="Public")
    add_code_block(doc, 
"""// Request Body:
{
  "email": "charterer@varka.ai",
  "otp": "839102",
  "newPassword": "BrandNewSecurePassword456!"
}

// Response: 200 OK
{
  "success": true,
  "message": "Password reset successfully! Logged in.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": { "user": { ... }, "accessToken": "..." }
}""")

    # =========================================================================
    # SECTION 3: VARKA INTELLIGENCE AI REASONING WEBSOCKET GATEWAY
    # =========================================================================
    add_heading_1(doc, "3. Varka Intelligence AI Reasoning WebSocket Gateway")
    add_body(doc, "Path: /ws/varka-intelligence | Protocol: ws:// or wss:// | Port: 3030 | Runtime: Node.js + ws library")
    add_body(doc, 
        "Varka Intelligence is a real-time, state-aware AI copilot for maritime chartering. "
        "It connects frontends via bidirectional WebSockets, synchronizes live dashboard state into memory via VarkaContextService, "
        "and streams multi-turn reasoning answers directly using Google Gemini (gemini-2.5-flash / gemini-2.5-pro).")
    
    add_heading_2(doc, "3.1 WebSocket Handshake & Authentication")
    add_body(doc, 
        "Connections must be authenticated during the HTTP 101 Switching Protocols upgrade. "
        "The server checks for a valid JWT token in: (1) URL Query Parameter ?token=<JWT>, (2) Cookie accessToken=<JWT>, or (3) Header Authorization: Bearer <JWT>. "
        "If token verification fails or is absent, the connection is immediately aborted with HTTP 401 Unauthorized.")
    
    add_heading_2(doc, "3.2 Client-to-Server Event Protocol")
    
    ws_client_headers = ["Event Type", "Payload Attributes", "Purpose / Behavior"]
    ws_client_rows = [
        ["ping", "{}", "Heartbeat liveness check; server replies with 'pong'."],
        ["clear", "{}", "Clears conversation memory and Gemini chat history for the user session."],
        ["context.sync", "context: Partial<VarkaOperationalContext>", "Replaces or deep-merges dashboard state (active voyage, routeId, cargoMt, selectedVessel, tab)."],
        ["context.update", "path: string, value: any, source?: string", "Updates a single dot-notation field (e.g. path: 'portForecast.cargoMt', value: 72000)."],
        ["chat", "message: string, activeSection?: string", "Submits charterer natural language query; triggers Gemini multi-token streaming response."]
    ]
    add_table_custom(doc, ws_client_headers, ws_client_rows, col_widths=[1.5, 2.2, 2.8])
    
    add_heading_2(doc, "3.3 Server-to-Client Event Protocol")
    ws_server_headers = ["Event Type", "Payload Attributes", "Description"]
    ws_server_rows = [
        ["connected", "userId, contextVersion, message", "Dispatched immediately upon successful WebSocket upgrade."],
        ["pong", "timestamp: number", "Keepalive acknowledgment."],
        ["context.synced", "lastUpdated: string, currentPage?: string, path?: string", "Confirms live state sync from dashboard interaction."],
        ["stream.start", "{}", "Signals that Gemini model reasoning has initiated."],
        ["token", "content: string", "Incremental streamed text chunk from LLM inference."],
        ["complete", "{}", "Signals inference stream completion."],
        ["cleared", "message: string", "Session memory reset acknowledgment."],
        ["error", "message: string", "Reports payload validation errors, size limits (>32KB), or Gemini upstream failures."]
    ]
    add_table_custom(doc, ws_server_headers, ws_server_rows, col_widths=[1.4, 2.3, 2.8])
    
    add_heading_2(doc, "3.4 WebSocket Message Example Walkthrough")
    add_code_block(doc, 
"""// 1. Client connects with query token:
// ws://localhost:3030/ws/varka-intelligence?token=eyJhbGciOi...

// 2. Server emits connection confirmation:
{
  "type": "connected",
  "userId": "66e3fa128bc94b0290e1f3a4",
  "contextVersion": "2026-09-13T04:22:00.000Z",
  "message": "Connected to VARKA INTELLIGENCE reasoning core."
}

// 3. Client syncs active dashboard route & parcel:
{
  "type": "context.sync",
  "context": {
    "currentPage": "PortPrediction",
    "portForecast": {
      "routeId": "AUNTL_INPAR",
      "cargoMt": 55000,
      "selectedVessel": "Supramax",
      "congestionScenario": 45
    }
  }
}

// 4. Server acknowledges sync:
{
  "type": "context.synced",
  "lastUpdated": "2026-09-13T04:22:05.100Z",
  "currentPage": "PortPrediction"
}

// 5. Client asks query:
{
  "type": "chat",
  "message": "Should we charter a Supramax now or wait for rates to soften next week?"
}

// 6. Server streams response:
{"type": "stream.start"}
{"type": "token", "content": "Based on the active **AUNTL_INPAR** route and 55,000 MT parcel:"}
{"type": "token", "content": "\\n\\n1. **XGBoost Rate Forecast**: Current spot is **$14.01/MT**."}
{"type": "token", "content": " Rates are projected to peak in week 2 before softening to **$13.40/MT** in week 4."}
{"type": "token", "content": "\\n2. **Commercial Posture**: The system recommends **Defensive / Multi-Voyage Fix**..."}
{"type": "complete"}""")

    # =========================================================================
    # SECTION 4: DRY-BULK FREIGHT PREDICTION & DECISION ENGINE
    # =========================================================================
    add_heading_1(doc, "4. Dry-Bulk Freight Prediction & Decision Engine")
    add_body(doc, "Service Directory: port_prediction--main | Framework: FastAPI (Python) | Direct Port: 8000 | Gateway Port: 3030 (/api/v1/prediction/*)")
    add_body(doc, 
        "The core mathematical and machine learning brain of Varka. Powered by XGBoost recursive forecasting trained on 337,524 historical observations "
        "across 33 global maritime routes, Open-Meteo live marine conditions, World Bank macro indicators, and multi-objective vessel optimization algorithms.")
    
    add_callout(doc, 
        "When invoked by the Next.js frontend, all requests are routed through the Node.js API Gateway at '/api/v1/prediction/*' with JWT authentication. "
        "The table below documents both the Direct Engine Path (Port 8000) and the Gateway Proxy Path (Port 3030).",
        title="GATEWAY ROUTING NOTE", callout_type="info")

    # 4.1 Routes & Ports Catalog
    add_endpoint_card(doc, "GET", "/api/v1/routes", "Returns origin ports, Indian discharge ports, vessels, and route distances", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="GET /api/v1/prediction/routes")
    add_body(doc, "Provides full master data: origin ports with handling rates and draft limits, Indian discharge ports (Paradip, Dhamra, Krishnapatnam, etc.) with pre-berthing delays, vessel dimensions, and route distances in nautical miles.")
    add_code_block(doc, 
"""// Response: 200 OK
{
  "origins": [
    {
      "port_code": "AUNTL",
      "port_name": "Newcastle",
      "country": "Australia",
      "cargo_handling_rate_tpd": 80000.0,
      "max_draft_m": 15.2,
      "max_loa_m": 300.0,
      "max_beam_m": 50.0
    }
  ],
  "destinations": [
    {
      "port_code": "INPAR",
      "port_name": "Paradip",
      "avg_delay_days": 4.5,
      "cargo_handling_rate_tpd": 35000.0,
      "max_draft_m": 14.5,
      "max_loa_m": 260.0,
      "max_beam_m": 43.0,
      "dry_bulk_berths": 6
    }
  ],
  "vessels": [
    {
      "vessel_type": "Supramax",
      "typical_draft_m": 12.8,
      "typical_loa_m": 190.0,
      "typical_beam_m": 32.2,
      "dwt_min": 50000.0,
      "dwt_max": 65000.0
    }
  ],
  "routes": [
    {
      "route_id": "AUNTL_INPAR",
      "origin_port_code": "AUNTL",
      "dest_port_code": "INPAR",
      "origin_name": "Newcastle",
      "dest_name": "Paradip",
      "distance_nm": 5850.0
    }
  ]
}""")

    # 4.2 Forecast
    add_endpoint_card(doc, "GET", "/api/v1/predict/forecast", "Generates 60-day XGBoost freight forecast with confidence bands and driver impacts", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="GET /api/v1/prediction/forecast")
    
    fc_params = [
        ["route_id", "string", "Yes", "Query", "Identifier of route, e.g. AUNTL_INPAR, IDKBS_INKRP."],
        ["vessel", "string", "No", "Query", "Vessel class: Handysize, Supramax (default), Ultramax, Panamax, Capesize."],
        ["horizon", "integer", "No", "Query", "Forecast window in days (7 to 120, default: 60)."]
    ]
    add_table_custom(doc, ["Parameter", "Type", "Required", "In", "Description"], fc_params, col_widths=[1.2, 0.8, 0.8, 0.8, 2.9])
    
    add_code_block(doc, 
"""// GET /api/v1/prediction/forecast?route_id=AUNTL_INPAR&vessel=Supramax&horizon=60
// Response: 200 OK
{
  "success": true,
  "data": {
    "route_id": "AUNTL_INPAR",
    "vessel_type": "Supramax",
    "horizon_days": 60,
    "current_rate_usd_t": 14.01,
    "uncertainty_band_usd_t": 0.85,
    "explanation_method": "Recursive XGBoost multi-step with empirical error distribution",
    "mape_pct": 2.36,
    "rmse": 0.41,
    "historical_recent": [
      { "date": "2026-08-14", "rate_usd_t": 13.85 },
      { "date": "2026-09-12", "rate_usd_t": 14.01 }
    ],
    "outlook": [
      { "date": "2026-09-13", "forecast_usd_t": 14.05, "p10": 13.20, "p90": 14.90 },
      { "date": "2026-11-11", "forecast_usd_t": 13.40, "p10": 12.10, "p90": 14.70 }
    ],
    "drivers": [
      { "driver": "Lagged Freight Rate (t-1)", "impact": 0.4215 },
      { "driver": "Port Congestion Index", "impact": 0.2310 },
      { "driver": "Baltic Dry Index (BDI)", "impact": 0.1840 },
      { "driver": "Bunker Fuel Price (VLSFO)", "impact": 0.0980 }
    ],
    "weekly_windows": [
      {
        "week": "2026-W37",
        "min_rate": 13.90,
        "average_rate": 14.03,
        "earliest_date": "2026-09-13",
        "action": "Preferred entry window"
      }
    ]
  }
}""")

    # 4.3 Live Marine Conditions
    add_endpoint_card(doc, "GET", "/api/v1/live/marine", "Live sea state, wave heights, and wind from Open-Meteo", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="GET /api/v1/prediction/marine")
    add_body(doc, "Queries Open-Meteo Marine API using port coordinates. Returns wave height, wind speed, swell direction, sea state category, and risk classifications.")
    add_code_block(doc, 
"""// GET /api/v1/prediction/marine?port_code=INPAR
// Response: 200 OK
{
  "port_code": "INPAR",
  "wave_height_m": 1.4,
  "wind_speed_knots": 14.2,
  "sea_state": "Slight to Moderate",
  "risk_score": 32,
  "risk_level": "Low",
  "weather_alert": "Normal operating conditions. Pilotage operational."
}""")

    # 4.4 Live Marine & Macro Context
    add_endpoint_card(doc, "GET", "/api/v1/live/context", "Enriched marine conditions and World Bank macroeconomic context", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="GET /api/v1/prediction/context")
    add_body(doc, "Combines origin port sea state, destination sea state, and World Bank annual GDP/trade growth figures for the exporting country.")
    add_code_block(doc, 
"""// GET /api/v1/prediction/context?origin_code=AUNTL&dest_code=INPAR&origin_country=Australia
// Response: 200 OK
{
  "origin_marine": { "port_code": "AUNTL", "wave_height_m": 1.8, "risk_level": "Low" },
  "dest_marine": { "port_code": "INPAR", "wave_height_m": 1.4, "risk_level": "Low" },
  "macro_context": {
    "country": "Australia",
    "gdp_growth_pct": 2.1,
    "trade_pct_gdp": 44.5,
    "macro_risk": "Stable dry-bulk export throughput"
  }
}""")

    # 4.5 Optimize Vessel Choice
    add_endpoint_card(doc, "POST", "/api/v1/optimize/vessel", "Runs port draft/LOA/beam feasibility and multi-objective scoring", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="POST /api/v1/prediction/optimize-vessel")
    add_body(doc, "Evaluates all candidate dry-bulk classes against origin and destination physical limits, fleet positioning, freight cost, and voyage CO2 emissions.")
    add_code_block(doc, 
"""// POST /api/v1/prediction/optimize-vessel
{
  "route_id": "AUNTL_INPAR",
  "cargo": 55000,
  "congestion": 45,
  "priority": "Balanced" // Options: Balanced, Cost, Speed, Green
}

// Response: 200 OK
{
  "success": true,
  "data": {
    "route_id": "AUNTL_INPAR",
    "cargo_mt": 55000,
    "priority": "Balanced",
    "recommended_vessel": "Supramax",
    "recommended_score": 88.5,
    "expected_freight": 14.01,
    "total_freight": 770550,
    "voyage_co2_tonnes": 890,
    "fleet_readiness_days": 4,
    "availability_status": "Prompt available in region",
    "vessel_classes": [
      {
        "vessel_type": "Supramax",
        "eligible": true,
        "typical_draft_m_ok": true,
        "typical_loa_m_ok": true,
        "typical_beam_m_ok": true,
        "cargo_ok": true,
        "draft_limit_m": 14.5,
        "loa_limit_m": 260.0,
        "beam_limit_m": 43.0,
        "utilisation": 0.85,
        "forecast_rate_usd_t": 14.01,
        "total_freight_usd": 770550,
        "voyage_co2_tonnes": 890.0,
        "available_hulls": 7,
        "next_available_days": 4,
        "multi_objective_score": 88.5,
        "is_recommended": true
      },
      {
        "vessel_type": "Capesize",
        "eligible": false,
        "typical_draft_m_ok": false,
        "typical_loa_m_ok": false,
        "typical_beam_m_ok": false,
        "cargo_ok": false,
        "is_recommended": false
      }
    ]
  }
}""")

    # 4.6 JIT Digital Twin Plan
    add_endpoint_card(doc, "POST", "/api/v1/plan/jit", "Computes JIT slow-steaming plan, avoided anchorage wait, fuel & CO2 savings", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="POST /api/v1/prediction/plan-jit")
    add_body(doc, "Simulates dynamic vessel speed reduction to absorb destination terminal berth congestion, transforming unproductive anchorage wait into fuel savings.")
    add_code_block(doc, 
"""// POST /api/v1/prediction/plan-jit
{
  "route_id": "AUNTL_INPAR",
  "dest_code": "INPAR",
  "vessel_type": "Supramax",
  "congestion": 45,
  "fuel_price": 580,
  "berth_adjustment_hours": 0
}

// Response: 200 OK
{
  "success": true,
  "data": {
    "action": "Slow-steam at 10.8 knots to absorb 52h waiting time",
    "standard_speed_knots": 13.0,
    "recommended_speed_knots": 10.8,
    "sailing_days_standard": 18.7,
    "sailing_days_jit": 22.5,
    "berth_ready_days": 23.2,
    "hours_saved_at_anchorage": 52.0,
    "fuel_saved_tonnes": 38.4,
    "cost_saved_usd": 22272.0,
    "co2_saved_tonnes": 119.6,
    "confidence_pct": 92.0
  }
}""")

    # 4.7 Charter Strategy
    add_endpoint_card(doc, "POST", "/api/v1/strategy/charter", "Generates commercial posture, early-warning alerts, and voyage sensitivity", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="POST /api/v1/prediction/strategy")
    add_code_block(doc, 
"""// POST /api/v1/prediction/strategy
{
  "route_id": "AUNTL_INPAR",
  "cargo": 55000,
  "vessel_type": "Supramax",
  "laycan_days": 21,
  "congestion": 45,
  "voyages": 3
}

// Response: 200 OK
{
  "success": true,
  "data": {
    "posture": "Defensive Period Charter / COA",
    "action": "Fix 3-voyage Contract of Affreightment (COA) at negotiated discount",
    "rationale": "Forecast models show a +8% freight increase over the next 45 days driven by peak seasonal congestion.",
    "expected_cost": 2253000.0,
    "expected_saving": 57800.0,
    "risk_index": 48,
    "mape_pct": 2.36,
    "volatility_pct": 14.2,
    "entry_date": "18 Sep",
    "protections": [
      "Include BIMCO Just-In-Time Arrival Clause",
      "Stipulate 12-hour NOR notice period at Paradip anchorage",
      "Demurrage capped at $16,500/day with demurrage-half-despatch"
    ],
    "scenarios": [
      { "voyages": 1, "contract_rate_usd_mt": 14.01, "all_in_cost_usd": 770550, "saving_vs_repeated_spot_usd": 0 },
      { "voyages": 3, "contract_rate_usd_mt": 13.66, "all_in_cost_usd": 2289900, "saving_vs_repeated_spot_usd": 21750 },
      { "voyages": 6, "contract_rate_usd_mt": 13.31, "all_in_cost_usd": 4516500, "saving_vs_repeated_spot_usd": 73200 }
    ],
    "alerts": [
      { "level": "Medium", "category": "Congestion", "message": "Paradip coal berth queue currently averaging 4.5 days." }
    ]
  }
}""")

    # 4.8 Assistant Query
    add_endpoint_card(doc, "POST", "/api/v1/assistant/query", "Contextually grounded charter decision assistant query", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="POST /api/v1/prediction/assistant")
    add_code_block(doc, 
"""// Request Body:
{
  "query": "Why is Supramax recommended over Panamax for this parcel?",
  "route_id": "AUNTL_INPAR",
  "vessel_type": "Supramax",
  "cargo": 55000,
  "congestion": 45,
  "priority": "Balanced"
}

// Response: 200 OK
{
  "query": "Why is Supramax recommended over Panamax for this parcel?",
  "answer": "For 55,000 MT on AUNTL_INPAR, the recommended class is Supramax. It fits Newcastle and Paradip draft limits (12.8m vs 14.5m max), utilizes 85% of its DWT, and scores 88.5 under Balanced priority. Panamax would suffer from a low 73% utilization penalty.",
  "grounded_facts": {
    "route_id": "AUNTL_INPAR",
    "vessel_type": "Supramax",
    "current_rate": 14.01,
    "risk_index": 48
  }
}""")

    # 4.9 Scenarios Stress-Testing
    add_endpoint_card(doc, "POST", "/api/v1/scenarios", "Freight rate stress test across Base, Congestion, Bull, and Bear paths", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="POST /api/v1/prediction/scenarios")
    add_code_block(doc, 
"""// POST /api/v1/prediction/scenarios
{
  "route_id": "AUNTL_INPAR",
  "vessel_type": "Supramax",
  "congestion": 45,
  "cargo": 55000
}

// Response: 200 OK
{
  "route_id": "AUNTL_INPAR",
  "summary": [
    { "scenario": "Base Forecast", "lowest_rate": 13.40, "average_rate": 14.02, "cargo_cost_at_average": 771100 },
    { "scenario": "Congestion Escalation (+25%)", "lowest_rate": 14.20, "average_rate": 14.95, "cargo_cost_at_average": 822250 },
    { "scenario": "Bull Market (Demand Surge)", "lowest_rate": 14.80, "average_rate": 15.60, "cargo_cost_at_average": 858000 },
    { "scenario": "Bear Market (Fleet Oversupply)", "lowest_rate": 12.50, "average_rate": 13.10, "cargo_cost_at_average": 720500 }
  ]
}""")

    # 4.10 Ports Scorecard, Fleet, Risk Cockpit, Audit, Standards
    add_endpoint_card(doc, "GET", "/api/v1/ports/scorecard", "Indian discharge port efficiency rankings and throughput metrics", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="GET /api/v1/prediction/scorecard")
    add_code_block(doc, 
"""// GET /api/v1/prediction/scorecard?cargo=55000
// Response: 200 OK
{
  "cargo_mt": 55000,
  "scorecard": [
    { "rank": 1, "port_code": "INDHA", "port_name": "Dhamra", "avg_pre_berthing_delay_days": 1.2, "port_performance_score": 94.2 },
    { "rank": 2, "port_code": "INKRP", "port_name": "Krishnapatnam", "avg_pre_berthing_delay_days": 2.1, "port_performance_score": 88.0 },
    { "rank": 3, "port_code": "INPAR", "port_name": "Paradip", "avg_pre_berthing_delay_days": 4.5, "port_performance_score": 76.5 }
  ]
}""")

    add_endpoint_card(doc, "GET", "/api/v1/fleet/availability", "Roster of available dry-bulk fleet and positioning status", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="GET /api/v1/prediction/fleet")
    add_code_block(doc, 
"""// GET /api/v1/prediction/fleet
// Response: 200 OK
{
  "fleet": [
    { "vessel_type": "Supramax", "available_hulls": 7, "next_available_days": 4, "availability_status": "Prompt in Bay of Bengal" },
    { "vessel_type": "Panamax", "available_hulls": 3, "next_available_days": 11, "availability_status": "Repositioning from Singapore" }
  ]
}""")

    add_endpoint_card(doc, "POST", "/api/v1/risk/cockpit", "Multi-factor voyage risk breakdown and mitigations", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="POST /api/v1/prediction/risk-cockpit")
    add_code_block(doc, 
"""// POST /api/v1/prediction/risk-cockpit
{ "congestion": 45, "uncertainty": 0.45, "rate": 14.01, "port_days": 6.1, "fleet_days": 11, "jit_risk": 40 }

// Response: 200 OK
{
  "risk_details": [
    { "factor": "Market Volatility", "score": 42, "weight": 0.25, "mitigation": "Hedge with FFA contracts or Period COA" },
    { "factor": "Discharge Port Congestion", "score": 58, "weight": 0.30, "mitigation": "Activate JIT slow-steaming arrival clause" }
  ]
}""")

    add_endpoint_card(doc, "POST", "/api/v1/decision/audit", "Governed decision audit trail for charter committee review", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="POST /api/v1/prediction/audit")
    add_code_block(doc, 
"""// POST /api/v1/prediction/audit
{
  "route_id": "AUNTL_INPAR",
  "vessel": "Supramax",
  "cargo": 55000,
  "priority": "Balanced",
  "risk_index": 48,
  "jit_action": "Proceed at 10.8 knots; arrive directly for pilotage",
  "source_status": "Calibrated synthetic series + Open-Meteo & World Bank free APIs"
}

// Response: 200 OK
{
  "audit_trail": [
    { "step": "Feasibility Evaluation", "outcome": "PASS", "details": "Draft 12.8m <= 14.5m limit. Verified." },
    { "step": "Model Governance", "outcome": "PASS", "details": "XGBoost MAPE 2.36% within 5.0% threshold." }
  ]
}""")

    add_endpoint_card(doc, "GET", "/api/v1/standards/mapping", "DCSA Port Call and IMO Maritime Single Window standards alignment", 
                      auth_str="Gateway Protected / Direct Public", gateway_path="GET /api/v1/prediction/standards")
    add_code_block(doc, 
"""// GET /api/v1/prediction/standards
// Response: 200 OK
{
  "standards_mapping": [
    { "concept": "Port Arrival Estimation", "dcsa_event": "TIMESTAMP: ARRIVAL_ESTIMATED", "imo_msw": "FAL Form 1 General Declaration" },
    { "concept": "Berth Readiness", "dcsa_event": "OPERATIONS: BERTH_READY", "imo_msw": "FAL Form 3 Ship Stores" }
  ]
}""")

    # =========================================================================
    # SECTION 5: TRUE LANDED-COST OCEAN FREIGHT RESEARCH AGENT API
    # =========================================================================
    add_heading_1(doc, "5. True Landed-Cost Ocean Freight Research Agent API")
    add_body(doc, "Service Directory: research_agent-main | Framework: FastAPI (Python) + SQLAlchemy | Port: 8001 | Workers: Celery + Redis")
    add_body(doc, 
        "The Research Agent models true landed ocean freight costs across international containerized supply chains. "
        "It integrates Incoterms 2020 cost-allocation logic, parses public accessorial carrier tariffs (THC, BAF, CAF, ISPS, Documentation, Demurrage), "
        "converts multi-currency charges to normalized USD, and audits extraction evidence.")

    # 5.1 Health
    add_endpoint_card(doc, "GET", "/v1/health", "Database connectivity and liveness check", auth_str="Public")
    add_code_block(doc, 
"""// GET http://localhost:8001/v1/health
// Response: 200 OK
{
  "status": "healthy",
  "timestamp": "2026-09-13T04:25:00.000Z",
  "database": "connected",
  "app_name": "Shipping Landed-Cost Agent API",
  "version": "1.0.0"
}""")

    # 5.2 Ports & Carriers
    add_endpoint_card(doc, "GET", "/v1/ports", "Autocomplete port lookup by UN/LOCODE, name, or country", auth_str="Public")
    add_code_block(doc, 
"""// GET http://localhost:8001/v1/ports?search=shanghai
// Response: 200 OK
[
  { "id": 1, "unlocode": "CNSHA", "name": "Shanghai", "country": "China" },
  { "id": 2, "unlocode": "USLAX", "name": "Los Angeles", "country": "United States" }
]""")

    add_endpoint_card(doc, "GET", "/v1/carriers", "Autocomplete carrier lookup by SCAC code or name", auth_str="Public")
    add_code_block(doc, 
"""// GET http://localhost:8001/v1/carriers?search=maersk
// Response: 200 OK
[
  { "id": 1, "scac_code": "MAEU", "name": "Maersk Line" },
  { "id": 2, "scac_code": "MSCU", "name": "Mediterranean Shipping Company (MSC)" },
  { "id": 3, "scac_code": "CMDU", "name": "CMA CGM" }
]""")

    # 5.3 Browse Fees & Source Evidence
    add_endpoint_card(doc, "GET", "/v1/fees", "Browse normalized accessorial fees with port and carrier filters", auth_str="Public")
    add_code_block(doc, 
"""// GET http://localhost:8001/v1/fees?port=CNSHA&carrier=MAEU&fee_type=THC
// Response: 200 OK
[
  {
    "id": 14,
    "source_id": 2,
    "fee_code": "THC",
    "fee_type": "THC",
    "port_unlocode": "CNSHA",
    "port_name": "Shanghai",
    "carrier_scac": "MAEU",
    "carrier_name": "Maersk Line",
    "container_type": "40HC",
    "amount": 950.0,
    "currency": "CNY",
    "unit": "per container",
    "confidence": 0.95,
    "source_reference": "TARIFF_PDF (Source #2 - fixtures/maersk_thc_tariff_2026.pdf)"
  }
]""")

    add_endpoint_card(doc, "GET", "/v1/fees/{fee_id}/source", "Retrieves raw document snippet and provenance lineage for a fee", auth_str="Public")
    add_code_block(doc, 
"""// GET http://localhost:8001/v1/fees/14/source
// Response: 200 OK
{
  "id": 2,
  "url_or_fixture_path": "fixtures/maersk_thc_tariff_2026.pdf",
  "doc_type": "TARIFF_PDF",
  "port_unlocode": "CNSHA",
  "carrier_scac": "MAEU",
  "last_crawled_at": "2026-09-10T12:00:00Z",
  "content_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "raw_snippet": "Terminal Handling Service - Origin (OHC) Shanghai, China: CNY 950 per 40ft High Cube container, effective 01-Jan-2026."
}""")

    # 5.4 Calculate Landed-Cost Quote
    add_endpoint_card(doc, "POST", "/v1/quote", "Calculates true landed cost with Incoterms 2020 rules and accessorials", auth_str="Public")
    
    quote_fields = [
        ["origin_port", "string", "Yes", "UN/LOCODE of origin port, e.g. CNSHA, INNSA."],
        ["destination_port", "string", "Yes", "UN/LOCODE of discharge port, e.g. USLAX, ROT."],
        ["carrier", "string", "Yes", "Carrier SCAC code, e.g. MAEU, MSCU."],
        ["container_type", "string", "No", "Default '40HC'. Options: 20GP, 40GP, 40HC."],
        ["incoterm", "string", "No", "Default 'FOB'. Options: FOB, CIF, CFR, EXW, FCA, DAP, DDP."],
        ["commodity", "string", "No", "Optional cargo description (e.g. 'Consumer Electronics')."]
    ]
    add_table_custom(doc, ["Field", "Type", "Required", "Description"], quote_fields, col_widths=[1.4, 0.8, 0.8, 3.5])
    
    add_code_block(doc, 
"""// POST http://localhost:8001/v1/quote
{
  "origin_port": "CNSHA",
  "destination_port": "USLAX",
  "carrier": "MAEU",
  "container_type": "40HC",
  "incoterm": "FOB",
  "commodity": "Solar Photovoltaic Inverters"
}

// Response: 200 OK
{
  "origin_port": "CNSHA",
  "origin_port_name": "Shanghai (China)",
  "destination_port": "USLAX",
  "destination_port_name": "Los Angeles (United States)",
  "carrier": "MAEU",
  "carrier_name": "Maersk Line",
  "container_type": "40HC",
  "incoterm": "FOB",
  "commodity": "Solar Photovoltaic Inverters",
  "summary": {
    "origin_charges_usd": 133.00,
    "ocean_freight_usd": 2450.00,
    "destination_charges_usd": 420.00,
    "total_landed_cost_usd": 3003.00,
    "currency": "USD"
  },
  "line_items": [
    {
      "fee_code": "BAS",
      "fee_name": "Base Ocean Freight (CNSHA -> USLAX)",
      "category": "freight",
      "amount": 2100.0,
      "currency": "USD",
      "converted_amount_usd": 2100.0,
      "unit": "per container",
      "payer": "buyer",
      "included_in_landed_cost": true,
      "confidence": 0.98,
      "source_reference": "TARIFF_API (Source #1)"
    },
    {
      "fee_code": "BAF",
      "fee_name": "Bunker Adjustment Factor (Fuel Surcharge)",
      "category": "freight",
      "amount": 350.0,
      "currency": "USD",
      "converted_amount_usd": 350.0,
      "unit": "per container",
      "payer": "buyer",
      "included_in_landed_cost": true,
      "confidence": 0.95,
      "source_reference": "TARIFF_PDF (Source #3)"
    },
    {
      "fee_code": "THC",
      "fee_name": "Origin Terminal Handling Charge",
      "category": "origin",
      "amount": 950.0,
      "currency": "CNY",
      "converted_amount_usd": 133.0,
      "unit": "per container",
      "payer": "buyer",
      "included_in_landed_cost": true,
      "confidence": 0.92,
      "source_reference": "TARIFF_PDF (Source #2)"
    },
    {
      "fee_code": "THC",
      "fee_name": "Destination Terminal Handling Charge",
      "category": "destination",
      "amount": 420.0,
      "currency": "USD",
      "converted_amount_usd": 420.0,
      "unit": "per container",
      "payer": "buyer",
      "included_in_landed_cost": true,
      "confidence": 0.94,
      "source_reference": "TARIFF_PDF (Source #4)"
    }
  ],
  "warnings": [
    {
      "level": "caution",
      "fee_code": "DEMURRAGE",
      "message": "Demurrage applies at destination after 4 free days: USD 210.00 per day. Operational contingency excluded from upfront landed freight."
    }
  ]
}""")

    # 5.5 Refresh
    add_endpoint_card(doc, "POST", "/v1/refresh", "Triggers re-extraction pipeline via Celery / synchronous worker", auth_str="Public")
    add_code_block(doc, 
"""// POST http://localhost:8001/v1/refresh
{ "source_id": 2 } // Omit source_id to refresh all registered sources

// Response: 200 OK
{
  "status": "success",
  "message": "Pipeline completed successfully.",
  "source_id": 2,
  "extracted_fees_count": 8
}""")

    # =========================================================================
    # SECTION 6: LIVE AIS SHIP TRACKING & TELEMETRY SERVICE
    # =========================================================================
    add_heading_1(doc, "6. Live AIS Ship Tracking & Telemetry Service")
    add_body(doc, "Service Directory: ship-tracking | Framework: Express.js (Node.js) | Port: 3001 | Upstream: AISStream.io WSS")
    add_body(doc, 
        "Provides real-time vessel tracking by ingesting live global AIS telemetry directly from the AISStream.io WebSocket backbone. "
        "Incoming PositionReport and ShipStaticData messages are decoded, aggregated into an in-memory spatial cache, and exposed via REST endpoints "
        "and a Leaflet-based live radar map.")

    # 6.1 Ingestion Specs
    add_heading_2(doc, "6.1 AISStream WebSocket Ingestion Protocol")
    add_body(doc, 
        "The server connects outbound to 'wss://stream.aisstream.io/v0/stream'. "
        "Within 3 seconds of connection establishment, it transmits the spatial bounding box subscription:")
    add_code_block(doc, 
"""// Subscription Frame sent to AISStream.io:
{
  "APIKey": "<AISSTREAM_API_KEY>",
  "BoundingBoxes": [[[25.835, -80.208], [25.603, -79.879]]], // Coastal bounding box
  "FilterMessageTypes": ["PositionReport", "ShipStaticData"]
}""")
    add_body(doc, 
        "The service maintains an automated reconnection loop with exponential backoff (up to 30 seconds) "
        "and sweeps inactive vessels every 60 seconds (purging tracks older than 15 minutes).")

    # 6.2 Endpoints
    add_endpoint_card(doc, "GET", "/health", "Tracking service health and AISStream connection state", auth_str="Public")
    add_code_block(doc, 
"""// GET http://localhost:3001/health
// Response: 200 OK
{
  "status": "ok",
  "uptimeSeconds": 14520,
  "trackedVessels": 42,
  "aisStreamStatus": "connected" // connected | connecting | disconnected | error
}""")

    add_endpoint_card(doc, "GET", "/api/ships", "Returns snapshot of all active vessels in memory", auth_str="Public")
    add_code_block(doc, 
"""// GET http://localhost:3001/api/ships
// Response: 200 OK
{
  "count": 2,
  "data": [
    {
      "mmsi": 367434870,
      "shipName": "SEASPAN RELIANCE",
      "latitude": 25.7742,
      "longitude": -80.1705,
      "speed": 12.4,
      "course": 145.2,
      "trueHeading": 144,
      "lastSeen": 1726201500000,
      "history": [
        [25.7610, -80.1850],
        [25.7742, -80.1705]
      ]
    }
  ]
}""")

    add_endpoint_card(doc, "GET", "/api/ships/:mmsi", "Retrieves deep telemetry and trajectory breadcrumbs for a vessel", auth_str="Public")
    add_code_block(doc, 
"""// GET http://localhost:3001/api/ships/367434870
// Response: 200 OK
{
  "mmsi": 367434870,
  "shipName": "SEASPAN RELIANCE",
  "latitude": 25.7742,
  "longitude": -80.1705,
  "speed": 12.4,
  "course": 145.2,
  "trueHeading": 144,
  "lastSeen": 1726201500000,
  "history": [
    [25.7500, -80.1980],
    [25.7610, -80.1850],
    [25.7742, -80.1705]
  ]
}""")

    # =========================================================================
    # SECTION 7: FRONTEND INTEGRATION & DATA FLOW MATRIX
    # =========================================================================
    add_heading_1(doc, "7. Frontend Integration & Data Flow Matrix")
    add_body(doc, 
        "The table below maps how UI components across the Next.js Enterprise Dashboard (landing-page) and React Research UI "
        "interact with the respective backend services.")
    
    flow_headers = ["UI Component / Page", "Service Contacted", "Endpoints Invoked", "Authentication Method"]
    flow_rows = [
        ["Authentication Modal (app/signin)", "backend:3030", "POST /api/v1/user/login\nPOST /api/v1/user/register\nPOST /api/v1/user/register/verify-otp\nPOST /api/v1/user/forgot-password", "Public"],
        ["Dashboard Header (UserProfile)", "backend:3030", "GET /api/v1/user/me\nPOST /api/v1/user/logout", "JWT Cookie or Bearer Token"],
        ["Varka Intelligence Sidebar", "backend:3030 (WS)", "WS /ws/varka-intelligence", "JWT Query Param ?token=... or Cookie"],
        ["Port Prediction Panel", "backend:3030 (Proxy)\n-> port_prediction:8000", "GET /api/v1/prediction/routes\nGET /api/v1/prediction/forecast\nPOST /api/v1/prediction/optimize-vessel\nPOST /api/v1/prediction/plan-jit\nPOST /api/v1/prediction/strategy\nGET /api/v1/prediction/marine\nGET /api/v1/prediction/scorecard\nPOST /api/v1/prediction/scenarios\nGET /api/v1/prediction/fleet", "JWT Cookie (authMiddleware)"],
        ["True Landed Cost Panel", "research_agent:8001", "GET /v1/health\nGET /v1/ports\nGET /v1/carriers\nPOST /v1/quote\nGET /v1/fees\nGET /v1/fees/{id}/source\nPOST /v1/refresh", "Public / CORS Allowed"],
        ["Live Tracking Panel", "ship-tracking:3001", "GET /api/ships\nGET /api/ships/:mmsi", "Public / CORS Allowed"]
    ]
    add_table_custom(doc, flow_headers, flow_rows, col_widths=[1.5, 1.4, 2.3, 1.3])
    
    add_heading_2(doc, "7.1 Gateway Error Handling & Resilience")
    add_body(doc, 
        "The Node.js Gateway (/api/v1/prediction/*) includes defensive proxy handling for the Python machine learning service. "
        "If the Python engine is starting up or temporarily offline, the gateway traps ECONNREFUSED and returns HTTP 503:")
    add_code_block(doc, 
"""// HTTP 503 Service Unavailable (Gateway Proxy Fallback)
{
  "success": false,
  "message": "Port prediction engine service is currently unavailable. Ensure the Python engine is running."
}""")

    # =========================================================================
    # SECTION 8: COMMON ERROR CODES & STANDARD RESPONSES
    # =========================================================================
    add_heading_1(doc, "8. Common HTTP Error Codes & Standard Formats")
    
    err_headers = ["HTTP Status", "Meaning", "Common Scenarios"]
    err_rows = [
        ["400 Bad Request", "Validation failure or malformed body", "Missing required fields (email, password), invalid Incoterm, out-of-range cargo tonnage."],
        ["401 Unauthorized", "Missing or invalid session credentials", "Expired JWT token, missing cookie, missing token on WebSocket upgrade."],
        ["403 Forbidden", "Action not permitted for user state", "User attempted login before verifying email OTP (requiresVerification: true)."],
        ["404 Not Found", "Resource does not exist", "Unrecognized UN/LOCODE, invalid route_id, nonexistent MMSI, fee ID not found."],
        ["500 Internal Server Error", "Unhandled server-side exception", "Database connectivity loss, LLM API gateway error, unhandled worker exception."],
        ["503 Service Unavailable", "Downstream microservice unreachable", "Node.js prediction gateway cannot connect to Python engine on port 8000."]
    ]
    add_table_custom(doc, err_headers, err_rows, col_widths=[1.2, 1.8, 3.5])
    
    add_body(doc, 
        "Standard Error JSON Payload returned by all Node.js and FastAPI services:", bold_prefix="Standard Error Schema: ")
    add_code_block(doc, 
"""{
  "success": false,
  "message": "Detailed human-readable error explanation",
  "error": "OPTIONAL_ERROR_CODE_OR_STACK"
}""")

    # Output path
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(output_dir, "Varka_Platform_API_Documentation.docx")
    doc.save(output_file)
    print(f"[Generator] Document successfully created at: {output_file}")
    return output_file

if __name__ == "__main__":
    build_varka_api_docs()
