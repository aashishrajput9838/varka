export interface VarkaOperationalContext {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  currentPage: string;
  lastUpdated: string;
  voyage: {
    voyageId: string;
    vesselName: string;
    imoNumber: string;
    carrier: string;
    originPort: string;
    originCode: string;
    destinationPort: string;
    destinationCode: string;
    departureDate: string;
    eta: string;
    status: string;
    cargoType: string;
    volume: string;
    containerCount: string;
    riskLevel: string;
    riskDetail: string;
  };
  tracking: {
    currentLocation: string;
    coordinates: string;
    speedKnots: number;
    heading: string;
    distanceRemainingNm: number;
    waypointsSummary: string;
  };
  portForecast: {
    routeId: string;
    originPort: string;
    destinationPort: string;
    selectedVessel: string;
    cargoMt: number;
    commodity: string;
    laycanDate: string;
    congestionScenario: number;
    optimizationPriority: string;
    currentRateUsdMt: number;
    p10RateUsdMt: number;
    p90RateUsdMt: number;
    residualBand: number;
    horizonDays: number;
    drivers: { driver: string; impact: number }[];
    explanation: string;
  };
  marine: {
    originPortCode: string;
    destPortCode: string;
    destWaveHeightM: number;
    destWindSpeedKn: number;
    weatherRisk: string;
    seaState: string;
    updatedAt: string;
  };
  vesselOptimization: {
    recommendedVessel: string;
    optimizationScore: number;
    feasible: boolean;
    utilisationPct: number;
    typicalDraftM: number;
    typicalLoaM: number;
    typicalBeamM: number;
  };
  jit: {
    action: string;
    standardSpeedKn: number;
    jitSpeedKn: number;
    berthReadyDays: number;
    waitingHoursAvoided: number;
    fuelSavedTonnes: number;
    co2SavedTonnes: number;
    costSavedUsd: number;
  };
  charterStrategy: {
    selectedStrategy: string;
    spotRateUsdMt: number;
    contract3RateUsdMt: number;
    contract6RateUsdMt: number;
    expectedSavingUsd: number;
    cycleDays: number;
    protections: string[];
  };
  agentInsights: {
    quotedRate: number;
    estimatedMinLandedCost: number;
    estimatedMaxLandedCost: number;
    variancePercent: number;
    riskIndex: string;
    topHiddenCosts: string[];
    tacticalAdvice: string;
  };
  historySummary: {
    totalVoyages: number;
    onTimeRatePct: number;
    recentRoutes: string[];
  };
  recentEvents: string[];
}

// In-memory store per user session
const sessionContextMap = new Map<string, VarkaOperationalContext>();

export const getDefaultContext = (user: {
  id: string;
  name?: string | undefined;
  email: string;
}): VarkaOperationalContext => {
  const now = new Date();
  const dep = new Date(now.getTime() - 24 * 3600 * 1000);
  const eta = new Date(now.getTime() + 5 * 24 * 3600 * 1000);
  const laycan = new Date(now.getTime() + 14 * 24 * 3600 * 1000);

  const depStr = dep.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', 06:30 IST';
  const etaStr = eta.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', 14:00 IST';
  const laycanStr = laycan.toISOString().split('T')[0] ?? '';

  return {
  user: {
    id: user.id,
    name: user.name || (user.email ? user.email.split('@')[0] : 'Charterer') || 'Charterer',
    email: user.email,
    role: 'Charterer / Freight Operations Lead',
  },
  currentPage: 'tracking',
  lastUpdated: now.toISOString(),
  voyage: {
    voyageId: 'VRK-9021-IN',
    vesselName: 'M/V Ocean Sentinel',
    imoNumber: 'IMO 9482710',
    carrier: 'Maersk Line / Maritime Coastal Feeder',
    originPort: 'Mumbai (JNPT Nhava Sheva)',
    originCode: 'INBOM',
    destinationPort: 'Chennai (Port Trust East Quay)',
    destinationCode: 'INMAA',
    departureDate: depStr,
    eta: etaStr,
    status: 'IN TRANSIT',
    cargoType: 'Clean Industrial Bulk & Specialty Alloys',
    volume: '450 MT',
    containerCount: '18 × 40ft High Cube',
    riskLevel: 'Low Risk',
    riskDetail: 'Calm seas (Beaufort 2). On schedule for scheduled Chennai harbor pilotage.',
  },
  tracking: {
    currentLocation: 'Off Goa Coast, Arabian Sea',
    coordinates: "15°29'N, 73°49'E",
    speedKnots: 14.6,
    heading: '162° SSE',
    distanceRemainingNm: 420,
    waypointsSummary:
      'Nhava Sheva Terminal B (cleared) -> Arabian Sea Coastal Corridor (passed) -> Goa Offshore Meridian (current) -> Cape Comorin Passage (upcoming) -> Chennai Harbor (destination)',
  },
  portForecast: {
    routeId: 'AUNTL_INPAR',
    originPort: 'Newcastle (AUNTL)',
    destinationPort: 'Paradip (INPAR)',
    selectedVessel: 'Panamax',
    cargoMt: 55000,
    commodity: 'Thermal coal',
    laycanDate: laycanStr,
    congestionScenario: 45,
    optimizationPriority: 'Balanced',
    currentRateUsdMt: 13.99,
    p10RateUsdMt: 13.52,
    p90RateUsdMt: 14.46,
    residualBand: 0.47,
    horizonDays: 60,
    drivers: [
      { driver: 'Newcastle loading congestion', impact: 0.38 },
      { driver: 'Paradip pre-berthing queue', impact: 0.29 },
      { driver: 'Bunker fuel adjustment factor', impact: 0.18 },
      { driver: 'Seasonal monsoon maritime risk', impact: 0.12 },
    ],
    explanation: 'SHAP tree attribution over XGBoost gradient-boosted regressor',
  },
  marine: {
    originPortCode: 'AUNTL',
    destPortCode: 'INPAR',
    destWaveHeightM: 1.8,
    destWindSpeedKn: 14.5,
    weatherRisk: 'Moderate',
    seaState: 'Moderate swell in Bay of Bengal',
    updatedAt: new Date().toISOString(),
  },
  vesselOptimization: {
    recommendedVessel: 'Panamax',
    optimizationScore: 92.9,
    feasible: true,
    utilisationPct: 69,
    typicalDraftM: 14.0,
    typicalLoaM: 225,
    typicalBeamM: 32.3,
  },
  jit: {
    action: 'Slow steam at 10.8 kn to meet predicted berth window Just-in-Time.',
    standardSpeedKn: 12.0,
    jitSpeedKn: 10.8,
    berthReadyDays: 6.1,
    waitingHoursAvoided: 52.0,
    fuelSavedTonnes: 105.2,
    co2SavedTonnes: 326.8,
    costSavedUsd: 68380,
  },
  charterStrategy: {
    selectedStrategy: '1-voyage spot fixture',
    spotRateUsdMt: 13.99,
    contract3RateUsdMt: 13.64,
    contract6RateUsdMt: 13.29,
    expectedSavingUsd: 29272,
    cycleDays: 26.5,
    protections: [
      'Demurrage pre-agreed window clause',
      'Port congestion index trigger at 60/100',
      'Bunker escalation adjustment collar (±5%)',
    ],
  },
  agentInsights: {
    quotedRate: 14.01,
    estimatedMinLandedCost: 769416,
    estimatedMaxLandedCost: 812000,
    variancePercent: 5.5,
    riskIndex: 'Low',
    topHiddenCosts: [
      'Port Terminal Handling Charges (THC)',
      'Anchorage Demurrage Risk Reserve',
      'Bunker Adjustment Factor (BAF)',
    ],
    tacticalAdvice:
      'Lock in 1-voyage spot fixture now. Retain demurrage allocation and slow-steaming JIT clause to capture $68k fuel & emissions savings.',
  },
  historySummary: {
    totalVoyages: 4,
    onTimeRatePct: 100,
    recentRoutes: ['INBOM → INMAA', 'AUNTL → INPAR', 'SGSIN → INVIZ', 'AUNTL → INDHM'],
  },
  recentEvents: [
    `Vessel departed Nhava Sheva on schedule (${depStr})`,
    'Paradip pre-berthing queue updated: 1.5 baseline days delay',
    'Open-Meteo Bay of Bengal wave height updated to 1.8m (Moderate)',
    'XGBoost 60-day freight forecast generated: $13.99/MT for Panamax',
    'JIT digital twin computed slow-steaming speed: 10.8 kn (52 hrs wait avoided)',
  ],
  };
};

export class VarkaContextService {
  /**
   * Retrieve active context for a user session
   */
  public static getContext(user: { id: string; name?: string | undefined; email: string }): VarkaOperationalContext {
    let ctx = sessionContextMap.get(user.id);
    if (!ctx) {
      ctx = getDefaultContext(user);
      sessionContextMap.set(user.id, ctx);
    }
    return ctx;
  }

  /**
   * Merge live client updates (e.g. user toggles parameters or navigates tabs)
   */
  public static syncContext(
    userId: string,
    partialContext: Partial<VarkaOperationalContext>
  ): VarkaOperationalContext {
    const existing = sessionContextMap.get(userId) || getDefaultContext({ id: userId, email: 'user@varka.ai' });
    const updated: VarkaOperationalContext = {
      ...existing,
      ...partialContext,
      lastUpdated: new Date().toISOString(),
      voyage: { ...existing.voyage, ...(partialContext.voyage || {}) },
      tracking: { ...existing.tracking, ...(partialContext.tracking || {}) },
      portForecast: { ...existing.portForecast, ...(partialContext.portForecast || {}) },
      marine: { ...existing.marine, ...(partialContext.marine || {}) },
      vesselOptimization: { ...existing.vesselOptimization, ...(partialContext.vesselOptimization || {}) },
      jit: { ...existing.jit, ...(partialContext.jit || {}) },
      charterStrategy: { ...existing.charterStrategy, ...(partialContext.charterStrategy || {}) },
      agentInsights: { ...existing.agentInsights, ...(partialContext.agentInsights || {}) },
      historySummary: { ...existing.historySummary, ...(partialContext.historySummary || {}) },
      recentEvents: partialContext.recentEvents || existing.recentEvents,
    };

    sessionContextMap.set(userId, updated);
    return updated;
  }

  /**
   * Update a specific nested property by key path (e.g. 'tracking.speedKnots', 'currentPage')
   */
  public static updateField(
    userId: string,
    path: string,
    value: any,
    source?: string
  ): VarkaOperationalContext {
    const ctx = sessionContextMap.get(userId) || getDefaultContext({ id: userId, email: 'user@varka.ai' });
    const parts = path.split('.');
    const key0 = parts[0];
    const key1 = parts[1];

    if (parts.length === 1 && key0) {
      (ctx as any)[key0] = value;
    } else if (parts.length === 2 && key0 && key1) {
      const parent = (ctx as any)[key0];
      if (parent && typeof parent === 'object') {
        parent[key1] = value;
      }
    }

    ctx.lastUpdated = new Date().toISOString();
    if (source) {
      const eventMsg = `[Live Update] ${source}: ${path} changed to ${JSON.stringify(value)}`;
      ctx.recentEvents = [eventMsg, ...ctx.recentEvents.slice(0, 9)];
    }

    sessionContextMap.set(userId, ctx);
    return ctx;
  }

  /**
   * Format context into an information-dense, token-efficient Markdown summary for Gemini
   */
  public static formatForPrompt(ctx: VarkaOperationalContext): string {
    return `### VARKA CURRENT LIVE OPERATIONAL CONTEXT
- **Active User:** ${ctx.user.name} (${ctx.user.role || 'Charterer'})
- **Currently Viewing Module:** ${ctx.currentPage.toUpperCase()}
- **Context Last Synced:** ${ctx.lastUpdated}

#### 1. CURRENT ACTIVE VOYAGE & REAL-TIME TRACKING
- **Voyage ID:** ${ctx.voyage.voyageId} | **Carrier:** ${ctx.voyage.carrier}
- **Vessel:** ${ctx.voyage.vesselName} (${ctx.voyage.imoNumber})
- **Status:** ${ctx.voyage.status}
- **Route:** ${ctx.voyage.originPort} (${ctx.voyage.originCode}) → ${ctx.voyage.destinationPort} (${ctx.voyage.destinationCode})
- **Departure:** ${ctx.voyage.departureDate} | **Target ETA:** ${ctx.voyage.eta}
- **Cargo:** ${ctx.voyage.cargoType} (${ctx.voyage.volume}, ${ctx.voyage.containerCount})
- **Current Position:** ${ctx.tracking.currentLocation} (${ctx.tracking.coordinates})
- **Speed:** ${ctx.tracking.speedKnots} knots | **Heading:** ${ctx.tracking.heading}
- **Distance Remaining:** ${ctx.tracking.distanceRemainingNm} NM
- **Voyage Risk Level:** ${ctx.voyage.riskLevel} (${ctx.voyage.riskDetail})
- **Waypoints Progress:** ${ctx.tracking.waypointsSummary}

#### 2. PORT FREIGHT FORECAST & MARKET DRIVERS
- **Planning Route:** ${ctx.portForecast.routeId} (${ctx.portForecast.originPort} → ${ctx.portForecast.destinationPort})
- **Nominated Vessel:** ${ctx.portForecast.selectedVessel} | **Cargo Parcel:** ${ctx.portForecast.cargoMt.toLocaleString()} MT ${ctx.portForecast.commodity}
- **Target Laycan:** ${ctx.portForecast.laycanDate} | **Congestion Scenario:** ${ctx.portForecast.congestionScenario}/100 | **Priority:** ${ctx.portForecast.optimizationPriority}
- **Current Forecast Freight Rate:** $${ctx.portForecast.currentRateUsdMt.toFixed(2)}/MT
- **Uncertainty Bounds (P10 / P90):** $${ctx.portForecast.p10RateUsdMt.toFixed(2)} - $${ctx.portForecast.p90RateUsdMt.toFixed(2)}/MT (Residual band ±$${ctx.portForecast.residualBand.toFixed(2)}/MT)
- **Top Rate Drivers:** ${ctx.portForecast.drivers.map((d) => `${d.driver} (+${d.impact.toFixed(2)})`).join(', ')}
- **Model Attribution:** ${ctx.portForecast.explanation}

#### 3. VESSEL CLASS FEASIBILITY & OPTIMIZATION
- **Recommended Class:** ${ctx.vesselOptimization.recommendedVessel} (Score: ${ctx.vesselOptimization.optimizationScore}/100, Feasible: ${ctx.vesselOptimization.feasible})
- **Parcel Utilisation:** ${ctx.vesselOptimization.utilisationPct}% of nominal deadweight
- **Vessel Dimensions:** Draft ${ctx.vesselOptimization.typicalDraftM}m, LOA ${ctx.vesselOptimization.typicalLoaM}m, Beam ${ctx.vesselOptimization.typicalBeamM}m

#### 4. JUST-IN-TIME (JIT) ARRIVAL & EMISSIONS TWIN
- **Recommended Operational Action:** ${ctx.jit.action}
- **Standard vs JIT Speed:** ${ctx.jit.standardSpeedKn} kn standard → ${ctx.jit.jitSpeedKn} kn slow-steaming
- **Anchorage Waiting Avoided:** ${ctx.jit.waitingHoursAvoided} hours (${ctx.jit.berthReadyDays} days predicted berth window)
- **Sustainability & Fuel Savings:** ${ctx.jit.fuelSavedTonnes.toFixed(1)} MT fuel saved | ${ctx.jit.co2SavedTonnes.toFixed(1)} MT CO₂ avoided | ~$${ctx.jit.costSavedUsd.toLocaleString()} fuel cost saved

#### 5. CHARTER STRATEGY & RISK MITIGATION
- **Selected Strategy:** ${ctx.charterStrategy.selectedStrategy}
- **Multi-Voyage Rate Comparison:** Spot: $${ctx.charterStrategy.spotRateUsdMt.toFixed(2)}/MT | 3-Voyage: $${ctx.charterStrategy.contract3RateUsdMt.toFixed(2)}/MT | 6-Voyage: $${ctx.charterStrategy.contract6RateUsdMt.toFixed(2)}/MT
- **Expected Commitment Saving:** $${ctx.charterStrategy.expectedSavingUsd.toLocaleString()} (Cycle: ${ctx.charterStrategy.cycleDays} days)
- **Governance Protections:** ${ctx.charterStrategy.protections.join('; ')}

#### 6. REAL-TIME MARINE WEATHER & METEOROLOGY
- **Destination Sea Conditions (${ctx.marine.destPortCode}):** Wave Height ${ctx.marine.destWaveHeightM}m, Wind ${ctx.marine.destWindSpeedKn} kn
- **Maritime Weather Risk:** ${ctx.marine.weatherRisk} (${ctx.marine.seaState})

#### 7. COST AGENT INTELLIGENCE
- **Base Quoted Rate:** $${ctx.agentInsights.quotedRate}/MT | **Landed Cost Range:** $${ctx.agentInsights.estimatedMinLandedCost.toLocaleString()} - $${ctx.agentInsights.estimatedMaxLandedCost.toLocaleString()}
- **Landed Cost Variance:** +${ctx.agentInsights.variancePercent}% | **Cost Risk:** ${ctx.agentInsights.riskIndex}
- **Identified Demurrage / Hidden Costs:** ${ctx.agentInsights.topHiddenCosts.join(', ')}
- **Tactical Recommendation:** ${ctx.agentInsights.tacticalAdvice}

#### 8. RECENT OPERATIONAL LOG & EVENTS
${ctx.recentEvents.map((e) => `- ${e}`).join('\n')}`;
  }
}
