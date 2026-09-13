# Authenticated Varka Homepage / Dashboard Implementation Plan

Create the authenticated Varka workspace homepage at `/` as a premium freight intelligence and vessel control platform. This replaces the unauthenticated view at `/` while preserving the existing marketing landing page intact at `/landing`.

## User Review Required

> [!IMPORTANT]
> **Preserving Marketing Landing Page**:
> The existing marketing landing page in `app/page.tsx` will be preserved verbatim at `app/landing/page.tsx` (accessible at `/landing`). Unauthenticated visitors opening `/` will be redirected to `/signin`. On `/signin`, the "Back to overview" link will point to `/landing`, allowing users to explore the marketing page without being redirected back into the sign-in loop.
>
> **Authentication Flow**:
> In accordance with the project requirements, successful sign-in and OTP verification already redirect to `/`. The authenticated homepage will validate the session via `localStorage` and `GET http://localhost:3030/api/v1/user/me`. Unauthenticated visitors will be redirected to `/signin`.

## Proposed Changes

### 1. Marketing Landing Page Preservation

#### [NEW] [landing/page.tsx](file:///c:/github/varka/varka/landing-page/app/landing/page.tsx)
- Copy the complete existing marketing landing page code (with video background, hero, solutions, process, contact, and legal links) to `/landing`.
- This ensures zero loss or alteration of the marketing experience.

#### [MODIFY] [signin/page.tsx](file:///c:/github/varka/varka/landing-page/app/signin/page.tsx)
- Update the top navigation back link from `/` to `/landing` ("Back to overview") so unauthenticated visitors can browse the landing page.
- Keep the post-auth redirect and "Return to Home Platform" pointing to `/`.

---

### 2. Dashboard Component Architecture

All dashboard components will reside under `landing-page/components/dashboard/`:

#### [NEW] [types.ts](file:///c:/github/varka/varka/landing-page/components/dashboard/types.ts)
- Type definitions:
  - `NavSection = 'tracking' | 'history' | 'agent'`
  - `VoyageData`: Reference, carrier, vessel, status, origin, destination, ETA, cargo details, distance, coordinates, route waypoints.
  - `HistoryItem`: Historical shipment details, status, date, and metrics.
  - `AgentAnalysisInput` & `HiddenCostReport`: Cost categories (port charges, demurrage, customs, documentation, detention, drayage, fuel surcharges), risk scores, and tactical recommendations.

#### [NEW] [Sidebar.tsx](file:///c:/github/varka/varka/landing-page/components/dashboard/Sidebar.tsx)
- Fixed left navigation sidebar for desktop:
  - **Header**: Varka logo (`/logo.png`), maritime freight intelligence indicator.
  - **Navigation**:
    - `TRACKING` (Icon: `Compass` / `Navigation`) — Default section.
    - `HISTORY` (Icon: `History` / `Clock`) — Tracked voyages audit.
    - `AGENT` (Icon: `Sparkles` / `Cpu`) — AI hidden cost prediction engine.
    - Active visual indicators with restrained rust highlight, warm cream text, and subtle hover animations.
  - **Footer**:
    - Logged-in user's avatar (with fallback letter badge).
    - User's name and truncated email.
    - Logout button calling backend `/api/v1/user/logout` with loading state and redirect to `/signin`.

#### [NEW] [MobileNav.tsx](file:///c:/github/varka/varka/landing-page/components/dashboard/MobileNav.tsx)
- Sleek top header bar for mobile & tablet screens (`< 1024px`):
  - Brand logo, current active section title, hamburger toggle.
  - Off-canvas slide-out drawer containing full navigation items, user details, and logout button.

#### [NEW] [DashboardHeader.tsx](file:///c:/github/varka/varka/landing-page/components/dashboard/DashboardHeader.tsx)
- Contextual greeting:
  - Time-based greeting: "GOOD MORNING, {FIRST_NAME}" / "GOOD AFTERNOON" / "GOOD EVENING".
  - Headline: "Track your voyage." (or contextual headline based on active tab).
  - Supporting text: "Monitor your freight movement and uncover the information behind every shipment."
  - Maritime status beacon: "SYSTEM STATUS: OPERATIONAL" with subtle pulsing green indicator.

#### [NEW] [TrackingPanel.tsx](file:///c:/github/varka/varka/landing-page/components/dashboard/TrackingPanel.tsx)
- **Search Card**:
  - Heading: "Track a shipment"
  - Subtitle: "Enter your container, booking, or tracking reference to monitor its current movement."
  - Search input with placeholder: "Enter tracking number (e.g. VRK-9021-IN, MSCU4820SG)..."
  - Button: "TRACK VOYAGE"
  - Quick reference sample pills for rapid demonstration (`VRK-9021-IN`, `VRK-6140-SG`, `VRK-3382-NL`).
  - Radar-scan simulation loading state (~600ms).
- **Visual Tracking Result Area**:
  - Live voyage status badge: "In Transit" / "At Port" / "Departed" / "Estimated Arrival".
  - Route progression timeline: Origin Port $\to$ Departure Waypoint $\to$ Mid-voyage Sea Waypoint $\to$ Destination Port.
  - Vessel real-time coordinates, speed (knots), heading, and sea condition.
  - Clearly marked banner: "Demo Voyage Simulation — Connected to Varka Maritime Data Engine."

#### [NEW] [VoyageOverview.tsx](file:///c:/github/varka/varka/landing-page/components/dashboard/VoyageOverview.tsx)
- Compact, elegant industrial overview section:
  - **STATUS**: IN TRANSIT
  - **ORIGIN**: Mumbai (Port of Nhava Sheva / JNPT)
  - **DESTINATION**: Chennai (Chennai Port Trust, East Terminal)
  - **VESSEL**: M/V Ocean Sentinel (IMO 9482710)
  - **ETA**: 18 Sep 2026
  - **CARGO / VOLUME**: 40ft High Cube × 18 units / Clean Industrial Bulk
  - **DISTANCE REMAINING**: 420 NM (Nautical Miles)
  - **WEATHER / DELAY RISK**: Low Risk / Calm Waters
  - Restrained typography, subtle grid dividers, and industrial elegance (no generic SaaS tables).

#### [NEW] [HistoryPanel.tsx](file:///c:/github/varka/varka/landing-page/components/dashboard/HistoryPanel.tsx)
- Historical tracking log:
  - Recent voyages:
    - Mumbai $\to$ Chennai (`VRK-9021-IN` — In Transit)
    - Singapore $\to$ Chennai (`VRK-6140-SG` — At Port)
    - Rotterdam $\to$ Mumbai (`VRK-3382-NL` — Completed)
    - Shanghai $\to$ Colombo (`VRK-8812-CN` — Departed)
  - Filter tabs: All, In Transit, Completed, Port Calls.
  - "View in Tracking" button on each card that smoothly switches the view to TRACKING with that shipment loaded.
  - Empty state toggle / demonstration with call-to-action to track a shipment.

#### [NEW] [AgentPanel.tsx](file:///c:/github/varka/varka/landing-page/components/dashboard/AgentPanel.tsx)
- Varka Agent: Freight Intelligence & Hidden Cost Prediction:
  - Header:
    - Eyebrow: "YOUR FREIGHT INTELLIGENCE AGENT"
    - Headline: "See the costs hiding beneath the quote."
    - Supporting text: "Varka Agent analyzes your voyage and helps identify potential hidden costs before they become surprises."
  - Input form:
    - Origin Port (e.g. Nhava Sheva / Mumbai)
    - Destination Port (e.g. Chennai)
    - Cargo Type (e.g. Bulk Industrial Minerals)
    - Cargo Volume / Weight (e.g. 450 MT / 18 FEU)
    - Container Type (e.g. 40ft High Cube)
    - Quoted Freight Rate (e.g. $2,850 / FEU)
    - "Pre-fill Sample Voyage Quote" quick action for immediate testing.
    - Primary Button: "ANALYZE VOYAGE"
  - AI analysis simulation loading state with sequential maritime intelligence checks (port tariffs, demurrage regulations, draft dues).
  - Results Interface:
    - **Total Predicted Landed Cost** vs. **Quoted Rate** (+15.4% predicted hidden variance).
    - **Hidden Cost Breakdown Cards**:
      1. *Port Charges & THC*: Unquoted terminal handling & draft surcharges.
      2. *Demurrage & Dwell Risk*: Risk of destination port congestion exceeding free time.
      3. *Customs & Regulatory Fees*: Mandatory bonded inspections and phytosanitary clearance.
      4. *Documentation & Manifest Fees*: Electronic EDI filing & BL issuance fees.
      5. *Detention Buffer*: Turnaround delay contingency for container return.
      6. *Inland Drayage & Toll Surcharges*: Fuel fluctuation factor on haulage.
      7. *Bunker Adjustment Factor (BAF)*: Low-sulfur transitional fuel adjustment.
    - **Actionable Intelligence Recommendations**: Negotiation points to counter unexpected charges (e.g., "Request 7 free detention days at Chennai", "Pre-file EDI manifest 48h prior to arrival").
    - Transparent disclaimer: "Simulated Freight Intelligence Model — Architecture structured for live AI cost-prediction API integration."

#### [NEW] [UserProfile.tsx](file:///c:/github/varka/varka/landing-page/components/dashboard/UserProfile.tsx)
- Modular component rendering the avatar, user details, and logout action.

---

### 3. Main Workspace Page Integration

#### [MODIFY] [app/page.tsx](file:///c:/github/varka/varka/landing-page/app/page.tsx)
- Transform `/` into the authenticated dashboard workspace.
- Check session on mount:
  - Check `localStorage.getItem('varka_token')` and `localStorage.getItem('varka_user')`.
  - Validate with backend `GET ${API_BASE_URL}/api/v1/user/me`.
  - If unauthenticated or token expired: redirect to `/signin` with smooth transition.
  - If authenticated: initialize user session and display workspace.
- State management:
  - `activeSection`: `'tracking' | 'history' | 'agent'`
  - `activeVoyage`: currently loaded shipment data.
  - `isLoggingOut`: state during logout.
- Logout handler:
  - POST to `http://localhost:3030/api/v1/user/logout`.
  - Clear `localStorage` keys (`varka_token`, `varka_user`).
  - Redirect to `/signin`.

---

### 4. Styling & Visual Language

#### [MODIFY] [app/globals.css](file:///c:/github/varka/varka/landing-page/app/globals.css)
- Add dashboard layout styles adhering strictly to the existing Varka design system:
  - Near-black / dark canvas (`#14110f`)
  - Warm ivory typography (`#f1e9df`)
  - Subtle muted secondary text (`#a99d91`)
  - Restrained rust / terracotta accents (`#e65a2f`)
  - Thin borders (`rgba(241, 233, 223, 0.12)`)
  - Fixed sidebar layout with scrollable content container
  - Route progression timeline with pulsing node indicators
  - Polished cards, dividers, and badges
  - Micro-animations, responsive media queries, and `prefers-reduced-motion` compliance

---

## Verification Plan

### Automated & Build Verification
1. Run TypeScript compiler to ensure 0 type errors across all components:
   ```bash
   pnpm build
   # or
   npx tsc --noEmit
   ```
2. Verify Next.js dev server compiles without warnings or errors.

### Manual Verification Flows
1. **Unauthenticated Access Protection**:
   - Open in an incognito/clean session: `http://localhost:3000/`.
   - Verify immediate redirection to `http://localhost:3000/signin`.
2. **Authentication Flow**:
   - Open `/signin`, sign in with a verified account (or complete test signin).
   - Verify successful redirect to `http://localhost:3000/`.
   - Verify the authenticated dashboard loads without flicker.
   - Verify the logged-in user's name, email, and avatar appear in the sidebar.
3. **Sidebar & Navigation**:
   - Verify sidebar navigation switches seamlessly between TRACKING, HISTORY, and AGENT.
   - Verify active nav item styling (rust accent, cream text).
4. **Tracking Section**:
   - Verify default view is TRACKING.
   - Enter reference or click a quick sample chip (e.g. `VRK-9021-IN`).
   - Click "TRACK VOYAGE".
   - Verify search loading state, visual route timeline, and compact Voyage Overview update.
5. **History Section**:
   - Switch to HISTORY tab.
   - Verify previous tracking items list.
   - Test filter pills.
   - Click "View in Tracking" on a history card; verify it switches to the TRACKING tab and loads that shipment.
6. **Agent Section**:
   - Switch to AGENT tab.
   - Verify headline: "See the costs hiding beneath the quote."
   - Click "Pre-fill Sample Voyage Quote".
   - Click "ANALYZE VOYAGE".
   - Verify intelligence loading state and the display of potential hidden cost breakdown categories.
7. **Logout Flow**:
   - Click "Log Out" in the sidebar.
   - Verify backend `/api/v1/user/logout` is called, `localStorage` is cleared, and user is redirected to `/signin`.
8. **Marketing Page Verification**:
   - Navigate to `http://localhost:3000/landing`.
   - Verify original marketing landing page with video background is intact and functional.
9. **Responsive Design**:
   - Verify desktop fixed sidebar (`> 1024px`).
   - Test tablet (`768px - 1024px`) layout.
   - Test mobile (`< 768px`): verify fixed sidebar is replaced by mobile header with hamburger menu and slide-out drawer.
