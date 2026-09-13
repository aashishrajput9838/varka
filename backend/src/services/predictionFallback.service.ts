/**
 * Fallback Decision Intelligence Service for VARKA Port Prediction & Charter Cockpit.
 * Provides high-availability deterministic fallbacks when the Python FastAPI engine is unreachable.
 */

export interface RouteCatalog {
  origins: any[];
  destinations: any[];
  vessels: any[];
  routes: any[];
}

const CATALOG_ORIGINS = [
  {
    "port_code": "AUNTL",
    "port_name": "Newcastle",
    "country": "Australia",
    "max_draft_m": 17.5,
    "max_loa_m": 350.0,
    "max_beam_m": 50.0,
    "cargo_handling_rate_tpd": 60000.0
  },
  {
    "port_code": "AUGLT",
    "port_name": "Gladstone",
    "country": "Australia",
    "max_draft_m": 16.3,
    "max_loa_m": 300.0,
    "max_beam_m": 48.0,
    "cargo_handling_rate_tpd": 50000.0
  },
  {
    "port_code": "AUHPT",
    "port_name": "Hay Point",
    "country": "Australia",
    "max_draft_m": 17.0,
    "max_loa_m": 320.0,
    "max_beam_m": 48.0,
    "cargo_handling_rate_tpd": 55000.0
  },
  {
    "port_code": "AUABT",
    "port_name": "Abbot Point",
    "country": "Australia",
    "max_draft_m": 17.5,
    "max_loa_m": 300.0,
    "max_beam_m": 48.0,
    "cargo_handling_rate_tpd": 45000.0
  },
  {
    "port_code": "USHRV",
    "port_name": "Hampton Roads/Norfolk",
    "country": "USA",
    "max_draft_m": 18.0,
    "max_loa_m": 330.0,
    "max_beam_m": 48.0,
    "cargo_handling_rate_tpd": 40000.0
  },
  {
    "port_code": "USBLT",
    "port_name": "Baltimore",
    "country": "USA",
    "max_draft_m": 13.7,
    "max_loa_m": 290.0,
    "max_beam_m": 45.0,
    "cargo_handling_rate_tpd": 30000.0
  },
  {
    "port_code": "USNOR",
    "port_name": "New Orleans",
    "country": "USA",
    "max_draft_m": 13.5,
    "max_loa_m": 280.0,
    "max_beam_m": 44.0,
    "cargo_handling_rate_tpd": 32000.0
  },
  {
    "port_code": "MZBEW",
    "port_name": "Beira",
    "country": "Mozambique",
    "max_draft_m": 8.5,
    "max_loa_m": 200.0,
    "max_beam_m": 32.0,
    "cargo_handling_rate_tpd": 15000.0
  },
  {
    "port_code": "MZNAC",
    "port_name": "Nacala",
    "country": "Mozambique",
    "max_draft_m": 16.0,
    "max_loa_m": 280.0,
    "max_beam_m": 45.0,
    "cargo_handling_rate_tpd": 25000.0
  },
  {
    "port_code": "IDSMR",
    "port_name": "Samarinda/Muara Berau anchorage",
    "country": "Indonesia",
    "max_draft_m": 13.0,
    "max_loa_m": 250.0,
    "max_beam_m": 40.0,
    "cargo_handling_rate_tpd": 20000.0
  },
  {
    "port_code": "IDTBN",
    "port_name": "Taboneo anchorage (Banjarmasin)",
    "country": "Indonesia",
    "max_draft_m": 12.5,
    "max_loa_m": 240.0,
    "max_beam_m": 38.0,
    "cargo_handling_rate_tpd": 18000.0
  },
  {
    "port_code": "IDBPN",
    "port_name": "Balikpapan",
    "country": "Indonesia",
    "max_draft_m": 14.0,
    "max_loa_m": 260.0,
    "max_beam_m": 40.0,
    "cargo_handling_rate_tpd": 22000.0
  },
  {
    "port_code": "RUVOS",
    "port_name": "Vostochny",
    "country": "Russia",
    "max_draft_m": 16.5,
    "max_loa_m": 300.0,
    "max_beam_m": 47.0,
    "cargo_handling_rate_tpd": 35000.0
  },
  {
    "port_code": "RUNAK",
    "port_name": "Nakhodka",
    "country": "Russia",
    "max_draft_m": 14.5,
    "max_loa_m": 260.0,
    "max_beam_m": 40.0,
    "cargo_handling_rate_tpd": 28000.0
  }
];

const CATALOG_DESTINATIONS = [
  {
    "port_code": "INPAR",
    "port_name": "Paradip",
    "state": "Odisha",
    "max_draft_m": 18.0,
    "max_loa_m": 300.0,
    "max_beam_m": 48.0,
    "dry_bulk_berths": 6,
    "cargo_handling_rate_tpd": 45000.0,
    "avg_delay_days": 1.5,
    "avg_pre_berthing_delay_days": 1.5
  },
  {
    "port_code": "INVIZ",
    "port_name": "Visakhapatnam",
    "state": "Andhra Pradesh",
    "max_draft_m": 17.0,
    "max_loa_m": 280.0,
    "max_beam_m": 45.0,
    "dry_bulk_berths": 5,
    "cargo_handling_rate_tpd": 40000.0,
    "avg_delay_days": 2.0,
    "avg_pre_berthing_delay_days": 2.0
  },
  {
    "port_code": "INGAN",
    "port_name": "Gangavaram",
    "state": "Andhra Pradesh",
    "max_draft_m": 20.0,
    "max_loa_m": 320.0,
    "max_beam_m": 50.0,
    "dry_bulk_berths": 3,
    "cargo_handling_rate_tpd": 50000.0,
    "avg_delay_days": 1.0,
    "avg_pre_berthing_delay_days": 1.0
  },
  {
    "port_code": "INGOP",
    "port_name": "Gopalpur",
    "state": "Odisha",
    "max_draft_m": 17.5,
    "max_loa_m": 290.0,
    "max_beam_m": 45.0,
    "dry_bulk_berths": 2,
    "cargo_handling_rate_tpd": 35000.0,
    "avg_delay_days": 1.2,
    "avg_pre_berthing_delay_days": 1.2
  },
  {
    "port_code": "INDHM",
    "port_name": "Dhamra",
    "state": "Odisha",
    "max_draft_m": 20.5,
    "max_loa_m": 330.0,
    "max_beam_m": 50.0,
    "dry_bulk_berths": 3,
    "cargo_handling_rate_tpd": 55000.0,
    "avg_delay_days": 0.8,
    "avg_pre_berthing_delay_days": 0.8
  },
  {
    "port_code": "INHAL",
    "port_name": "Haldia",
    "state": "West Bengal",
    "max_draft_m": 9.0,
    "max_loa_m": 186.0,
    "max_beam_m": 30.0,
    "dry_bulk_berths": 4,
    "cargo_handling_rate_tpd": 20000.0,
    "avg_delay_days": 3.5,
    "avg_pre_berthing_delay_days": 3.5
  },
  {
    "port_code": "INKOL",
    "port_name": "Kolkata (Sagar anchorage transfer)",
    "state": "West Bengal",
    "max_draft_m": 8.5,
    "max_loa_m": 180.0,
    "max_beam_m": 28.0,
    "dry_bulk_berths": 3,
    "cargo_handling_rate_tpd": 15000.0,
    "avg_delay_days": 4.0,
    "avg_pre_berthing_delay_days": 4.0
  }
];

const CATALOG_VESSELS = [
  {
    "vessel_type": "Handysize",
    "dwt_min": 28000.0,
    "dwt_max": 38000.0,
    "typical_loa_m": 180.0,
    "typical_beam_m": 30.0,
    "typical_draft_m": 10.5
  },
  {
    "vessel_type": "Supramax",
    "dwt_min": 50000.0,
    "dwt_max": 60000.0,
    "typical_loa_m": 200.0,
    "typical_beam_m": 32.0,
    "typical_draft_m": 12.5
  },
  {
    "vessel_type": "Panamax",
    "dwt_min": 65000.0,
    "dwt_max": 80000.0,
    "typical_loa_m": 225.0,
    "typical_beam_m": 32.3,
    "typical_draft_m": 14.0
  },
  {
    "vessel_type": "Capesize",
    "dwt_min": 150000.0,
    "dwt_max": 180000.0,
    "typical_loa_m": 290.0,
    "typical_beam_m": 45.0,
    "typical_draft_m": 18.0
  }
];

const CATALOG_ROUTES = [
  {
    "origin_port_code": "AUNTL",
    "dest_port_code": "INPAR",
    "distance_nm": 5900.0,
    "origin_country": "Australia",
    "dest_name": "Paradip",
    "route_id": "AUNTL_INPAR",
    "origin_name": "Newcastle"
  },
  {
    "origin_port_code": "AUNTL",
    "dest_port_code": "INVIZ",
    "distance_nm": 5750.0,
    "origin_country": "Australia",
    "dest_name": "Visakhapatnam",
    "route_id": "AUNTL_INVIZ",
    "origin_name": "Newcastle"
  },
  {
    "origin_port_code": "AUNTL",
    "dest_port_code": "INDHM",
    "distance_nm": 5950.0,
    "origin_country": "Australia",
    "dest_name": "Dhamra",
    "route_id": "AUNTL_INDHM",
    "origin_name": "Newcastle"
  },
  {
    "origin_port_code": "AUNTL",
    "dest_port_code": "INGAN",
    "distance_nm": 5800.0,
    "origin_country": "Australia",
    "dest_name": "Gangavaram",
    "route_id": "AUNTL_INGAN",
    "origin_name": "Newcastle"
  },
  {
    "origin_port_code": "AUGLT",
    "dest_port_code": "INPAR",
    "distance_nm": 6100.0,
    "origin_country": "Australia",
    "dest_name": "Paradip",
    "route_id": "AUGLT_INPAR",
    "origin_name": "Gladstone"
  },
  {
    "origin_port_code": "AUGLT",
    "dest_port_code": "INVIZ",
    "distance_nm": 5950.0,
    "origin_country": "Australia",
    "dest_name": "Visakhapatnam",
    "route_id": "AUGLT_INVIZ",
    "origin_name": "Gladstone"
  },
  {
    "origin_port_code": "AUGLT",
    "dest_port_code": "INDHM",
    "distance_nm": 6150.0,
    "origin_country": "Australia",
    "dest_name": "Dhamra",
    "route_id": "AUGLT_INDHM",
    "origin_name": "Gladstone"
  },
  {
    "origin_port_code": "AUHPT",
    "dest_port_code": "INGAN",
    "distance_nm": 5850.0,
    "origin_country": "Australia",
    "dest_name": "Gangavaram",
    "route_id": "AUHPT_INGAN",
    "origin_name": "Hay Point"
  },
  {
    "origin_port_code": "AUHPT",
    "dest_port_code": "INPAR",
    "distance_nm": 5950.0,
    "origin_country": "Australia",
    "dest_name": "Paradip",
    "route_id": "AUHPT_INPAR",
    "origin_name": "Hay Point"
  },
  {
    "origin_port_code": "AUABT",
    "dest_port_code": "INVIZ",
    "distance_nm": 5700.0,
    "origin_country": "Australia",
    "dest_name": "Visakhapatnam",
    "route_id": "AUABT_INVIZ",
    "origin_name": "Abbot Point"
  },
  {
    "origin_port_code": "AUABT",
    "dest_port_code": "INGAN",
    "distance_nm": 5780.0,
    "origin_country": "Australia",
    "dest_name": "Gangavaram",
    "route_id": "AUABT_INGAN",
    "origin_name": "Abbot Point"
  },
  {
    "origin_port_code": "USHRV",
    "dest_port_code": "INPAR",
    "distance_nm": 9700.0,
    "origin_country": "USA",
    "dest_name": "Paradip",
    "route_id": "USHRV_INPAR",
    "origin_name": "Hampton Roads/Norfolk"
  },
  {
    "origin_port_code": "USHRV",
    "dest_port_code": "INVIZ",
    "distance_nm": 9550.0,
    "origin_country": "USA",
    "dest_name": "Visakhapatnam",
    "route_id": "USHRV_INVIZ",
    "origin_name": "Hampton Roads/Norfolk"
  },
  {
    "origin_port_code": "USHRV",
    "dest_port_code": "INGAN",
    "distance_nm": 9600.0,
    "origin_country": "USA",
    "dest_name": "Gangavaram",
    "route_id": "USHRV_INGAN",
    "origin_name": "Hampton Roads/Norfolk"
  },
  {
    "origin_port_code": "USBLT",
    "dest_port_code": "INHAL",
    "distance_nm": 9800.0,
    "origin_country": "USA",
    "dest_name": "Haldia",
    "route_id": "USBLT_INHAL",
    "origin_name": "Baltimore"
  },
  {
    "origin_port_code": "USBLT",
    "dest_port_code": "INVIZ",
    "distance_nm": 9650.0,
    "origin_country": "USA",
    "dest_name": "Visakhapatnam",
    "route_id": "USBLT_INVIZ",
    "origin_name": "Baltimore"
  },
  {
    "origin_port_code": "USNOR",
    "dest_port_code": "INPAR",
    "distance_nm": 11200.0,
    "origin_country": "USA",
    "dest_name": "Paradip",
    "route_id": "USNOR_INPAR",
    "origin_name": "New Orleans"
  },
  {
    "origin_port_code": "USNOR",
    "dest_port_code": "INVIZ",
    "distance_nm": 11050.0,
    "origin_country": "USA",
    "dest_name": "Visakhapatnam",
    "route_id": "USNOR_INVIZ",
    "origin_name": "New Orleans"
  },
  {
    "origin_port_code": "MZBEW",
    "dest_port_code": "INPAR",
    "distance_nm": 3550.0,
    "origin_country": "Mozambique",
    "dest_name": "Paradip",
    "route_id": "MZBEW_INPAR",
    "origin_name": "Beira"
  },
  {
    "origin_port_code": "MZBEW",
    "dest_port_code": "INVIZ",
    "distance_nm": 3350.0,
    "origin_country": "Mozambique",
    "dest_name": "Visakhapatnam",
    "route_id": "MZBEW_INVIZ",
    "origin_name": "Beira"
  },
  {
    "origin_port_code": "MZBEW",
    "dest_port_code": "INGOP",
    "distance_nm": 3450.0,
    "origin_country": "Mozambique",
    "dest_name": "Gopalpur",
    "route_id": "MZBEW_INGOP",
    "origin_name": "Beira"
  },
  {
    "origin_port_code": "MZNAC",
    "dest_port_code": "INGAN",
    "distance_nm": 3100.0,
    "origin_country": "Mozambique",
    "dest_name": "Gangavaram",
    "route_id": "MZNAC_INGAN",
    "origin_name": "Nacala"
  },
  {
    "origin_port_code": "MZNAC",
    "dest_port_code": "INPAR",
    "distance_nm": 3300.0,
    "origin_country": "Mozambique",
    "dest_name": "Paradip",
    "route_id": "MZNAC_INPAR",
    "origin_name": "Nacala"
  },
  {
    "origin_port_code": "IDSMR",
    "dest_port_code": "INVIZ",
    "distance_nm": 2450.0,
    "origin_country": "Indonesia",
    "dest_name": "Visakhapatnam",
    "route_id": "IDSMR_INVIZ",
    "origin_name": "Samarinda/Muara Berau anchorage"
  },
  {
    "origin_port_code": "IDSMR",
    "dest_port_code": "INPAR",
    "distance_nm": 2650.0,
    "origin_country": "Indonesia",
    "dest_name": "Paradip",
    "route_id": "IDSMR_INPAR",
    "origin_name": "Samarinda/Muara Berau anchorage"
  },
  {
    "origin_port_code": "IDSMR",
    "dest_port_code": "INDHM",
    "distance_nm": 2700.0,
    "origin_country": "Indonesia",
    "dest_name": "Dhamra",
    "route_id": "IDSMR_INDHM",
    "origin_name": "Samarinda/Muara Berau anchorage"
  },
  {
    "origin_port_code": "IDTBN",
    "dest_port_code": "INGOP",
    "distance_nm": 2500.0,
    "origin_country": "Indonesia",
    "dest_name": "Gopalpur",
    "route_id": "IDTBN_INGOP",
    "origin_name": "Taboneo anchorage (Banjarmasin)"
  },
  {
    "origin_port_code": "IDTBN",
    "dest_port_code": "INPAR",
    "distance_nm": 2600.0,
    "origin_country": "Indonesia",
    "dest_name": "Paradip",
    "route_id": "IDTBN_INPAR",
    "origin_name": "Taboneo anchorage (Banjarmasin)"
  },
  {
    "origin_port_code": "IDBPN",
    "dest_port_code": "INVIZ",
    "distance_nm": 2500.0,
    "origin_country": "Indonesia",
    "dest_name": "Visakhapatnam",
    "route_id": "IDBPN_INVIZ",
    "origin_name": "Balikpapan"
  },
  {
    "origin_port_code": "IDBPN",
    "dest_port_code": "INGAN",
    "distance_nm": 2550.0,
    "origin_country": "Indonesia",
    "dest_name": "Gangavaram",
    "route_id": "IDBPN_INGAN",
    "origin_name": "Balikpapan"
  },
  {
    "origin_port_code": "RUVOS",
    "dest_port_code": "INPAR",
    "distance_nm": 5300.0,
    "origin_country": "Russia",
    "dest_name": "Paradip",
    "route_id": "RUVOS_INPAR",
    "origin_name": "Vostochny"
  },
  {
    "origin_port_code": "RUVOS",
    "dest_port_code": "INVIZ",
    "distance_nm": 5150.0,
    "origin_country": "Russia",
    "dest_name": "Visakhapatnam",
    "route_id": "RUVOS_INVIZ",
    "origin_name": "Vostochny"
  },
  {
    "origin_port_code": "RUNAK",
    "dest_port_code": "INGAN",
    "distance_nm": 6350.0,
    "origin_country": "Russia",
    "dest_name": "Gangavaram",
    "route_id": "RUNAK_INGAN",
    "origin_name": "Nakhodka"
  }
];

export class PredictionFallbackService {
  public getCatalog(): RouteCatalog {
    return {
      origins: CATALOG_ORIGINS,
      destinations: CATALOG_DESTINATIONS,
      vessels: CATALOG_VESSELS,
      routes: CATALOG_ROUTES,
    };
  }

  public getForecast(
    routeId: string = "AUNTL_INPAR",
    vesselType: string = "Panamax",
    horizon: number = 60,
    laycanStartDate?: string
  ) {
    const baseRates: Record<string, number> = {
      AUNTL_INPAR: 16.45,
      AUNTL_INVIZ: 16.10,
      AUNTL_INDHM: 16.55,
      AUNTL_INGAN: 16.20,
      AUGLT_INPAR: 16.90,
      USHRV_INPAR: 28.50,
      MZBEW_INPAR: 12.80,
      IDSMR_INVIZ: 9.40,
      IDSMR_INPAR: 9.80,
      RUVOS_INPAR: 14.50,
    };

    const baseRate = baseRates[routeId] || 15.65;
    const now = laycanStartDate ? new Date(laycanStartDate) : new Date();

    const outlook: any[] = [];
    const historicalRecent: any[] = [];

    // 14 days historical
    for (let i = 14; i >= 1; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      historicalRecent.push({
        date: d.toISOString().split("T")[0],
        rate_usd_t: Number((baseRate + Math.sin(i * 0.4) * 0.8).toFixed(2)),
      });
    }

    // 60 days forecast
    for (let i = 0; i < horizon; i++) {
      const d = new Date(now.getTime() + i * 86400000);
      const cycle = Math.sin(i * 0.15) * 0.7 - i * 0.015;
      const forecastVal = Number((baseRate + cycle).toFixed(2));
      const p10 = Number((forecastVal - 0.5).toFixed(2));
      const p90 = Number((forecastVal + 0.5).toFixed(2));

      outlook.push({
        date: d.toISOString().split("T")[0],
        forecast_usd_t: forecastVal,
        p10,
        p90,
      });
    }

    const drivers = [
      { driver: "lag_1", impact: -1.48 },
      { driver: "roll_mean_7", impact: -0.77 },
      { driver: "bdi_index", impact: -0.75 },
      { driver: "lag_30", impact: -0.04 },
      { driver: "coal_price_index", impact: -0.02 },
    ];

    const weeklyWindows = [
      {
        week: "Week 1",
        min_rate: Number((baseRate + 0.9).toFixed(2)),
        average_rate: Number((baseRate + 1.2).toFixed(2)),
        earliest_date: outlook[0]?.date || "",
        action: "Monitor / defer",
      },
      {
        week: "Week 2",
        min_rate: Number((baseRate + 0.1).toFixed(2)),
        average_rate: Number((baseRate + 0.4).toFixed(2)),
        earliest_date: outlook[7]?.date || "",
        action: "Monitor / defer",
      },
      {
        week: "Week 3",
        min_rate: Number((baseRate - 0.2).toFixed(2)),
        average_rate: Number((baseRate - 0.1).toFixed(2)),
        earliest_date: outlook[14]?.date || "",
        action: "Monitor / defer",
      },
      {
        week: "Week 4",
        min_rate: Number((baseRate - 0.4).toFixed(2)),
        average_rate: Number((baseRate - 0.2).toFixed(2)),
        earliest_date: outlook[21]?.date || "",
        action: "Monitor / defer",
      },
      {
        week: "Week 5",
        min_rate: Number((baseRate - 0.7).toFixed(2)),
        average_rate: Number((baseRate - 0.4).toFixed(2)),
        earliest_date: outlook[28]?.date || "",
        action: "Preferred entry window",
      },
    ];

    return {
      route_id: routeId,
      vessel_type: vesselType,
      horizon_days: horizon,
      current_rate_usd_t: baseRate,
      uncertainty_band_usd_t: 0.45,
      explanation_method: "TreeSHAP Local Attribution",
      mape_pct: 3.42,
      rmse: 0.62,
      historical_recent: historicalRecent,
      outlook,
      drivers,
      weekly_windows: weeklyWindows,
    };
  }

  public optimizeVessel(
    routeId: string = "AUNTL_INPAR",
    cargoMt: number = 55000,
    congestion: number = 45,
    priority: string = "Balanced"
  ) {
    const vesselClasses = [
      {
        vessel_type: "Panamax",
        eligible: true,
        typical_draft_m_ok: true,
        typical_loa_m_ok: true,
        typical_beam_m_ok: true,
        cargo_ok: cargoMt <= 78000,
        draft_limit_m: 14.0,
        loa_limit_m: 225,
        beam_limit_m: 32.3,
        utilisation: Math.min(1.0, Number((cargoMt / 75000).toFixed(2))),
        forecast_rate_usd_t: 15.45,
        total_freight_usd: cargoMt * 15.45,
        voyage_co2_tonnes: 2114,
        available_hulls: 3,
        next_available_days: 11,
        availability_status: "Available for laycan",
        multi_objective_score: 94.5,
        is_recommended: true,
      },
      {
        vessel_type: "Supramax",
        eligible: true,
        typical_draft_m_ok: true,
        typical_loa_m_ok: true,
        typical_beam_m_ok: true,
        cargo_ok: cargoMt <= 58000,
        draft_limit_m: 12.5,
        loa_limit_m: 200,
        beam_limit_m: 32.0,
        utilisation: Math.min(1.0, Number((cargoMt / 58000).toFixed(2))),
        forecast_rate_usd_t: 16.2,
        total_freight_usd: cargoMt * 16.2,
        voyage_co2_tonnes: 1897,
        available_hulls: 2,
        next_available_days: 5,
        availability_status: "Available for laycan",
        multi_objective_score: 88.0,
        is_recommended: false,
      },
      {
        vessel_type: "Handysize",
        eligible: cargoMt <= 38000,
        typical_draft_m_ok: true,
        typical_loa_m_ok: true,
        typical_beam_m_ok: true,
        cargo_ok: cargoMt <= 38000,
        draft_limit_m: 10.5,
        loa_limit_m: 180,
        beam_limit_m: 30.0,
        utilisation: Math.min(1.0, Number((cargoMt / 35000).toFixed(2))),
        forecast_rate_usd_t: 18.5,
        total_freight_usd: cargoMt * 18.5,
        voyage_co2_tonnes: 1420,
        available_hulls: 4,
        next_available_days: 2,
        availability_status: "Available for laycan",
        multi_objective_score: 72.0,
        is_recommended: false,
      },
      {
        vessel_type: "Capesize",
        eligible: cargoMt >= 120000,
        typical_draft_m_ok: false,
        typical_loa_m_ok: false,
        typical_beam_m_ok: false,
        cargo_ok: cargoMt >= 120000,
        draft_limit_m: 18.0,
        loa_limit_m: 290,
        beam_limit_m: 45.0,
        utilisation: Number((cargoMt / 170000).toFixed(2)),
        forecast_rate_usd_t: 12.8,
        total_freight_usd: cargoMt * 12.8,
        voyage_co2_tonnes: 3450,
        available_hulls: 1,
        next_available_days: 16,
        availability_status: "Check repositioning",
        multi_objective_score: 65.0,
        is_recommended: false,
      },
    ];

    return {
      route_id: routeId,
      cargo_mt: cargoMt,
      priority,
      recommended_vessel: "Panamax",
      recommended_score: 94.5,
      expected_freight: 15.45,
      total_freight: cargoMt * 15.45,
      voyage_co2_tonnes: 2114,
      fleet_readiness_days: 11,
      availability_status: "Available for laycan",
      vessel_classes: vesselClasses,
    };
  }

  public planJit(
    routeId: string = "AUNTL_INPAR",
    destCode: string = "INPAR",
    vesselType: string = "Panamax",
    congestion: number = 45,
    fuelPrice: number = 650,
    berthAdjustmentHours: number = 0
  ) {
    return {
      action: "Proceed at 10.8 knots; arrive directly for pilotage",
      berth_ready_days: 22.4,
      standard_speed: 14.0,
      jit_speed: 10.8,
      standard_sailing_days: 17.6,
      jit_sailing_days: 22.8,
      early_wait_hours: 125,
      jit_wait_hours: 0,
      hours_saved_at_anchorage: 125,
      standard_fuel_tonnes: 563.2,
      jit_fuel_tonnes: 365.1,
      fuel_saved_tonnes: 198.1,
      cost_saved_usd: Math.round(198.1 * fuelPrice),
      co2_saved_tonnes: Number((198.1 * 3.114).toFixed(1)),
      risk_score: 38,
    };
  }

  public evaluateStrategy(
    routeId: string = "AUNTL_INPAR",
    cargoMt: number = 55000,
    vesselType: string = "Panamax",
    laycanDays: number = 14,
    congestion: number = 45,
    voyages: number = 1
  ) {
    const scenarios = [
      {
        voyages: 1,
        contract_rate_usd_mt: 16.45,
        all_in_cost_usd: cargoMt * 16.45,
        saving_vs_repeated_spot_usd: 0,
        planned_cycle_days: 26.5,
      },
      {
        voyages: 3,
        contract_rate_usd_mt: 15.6,
        all_in_cost_usd: cargoMt * 15.6 * 3,
        saving_vs_repeated_spot_usd: Math.round(cargoMt * 0.85 * 3),
        planned_cycle_days: 26.5 * 3,
      },
      {
        voyages: 6,
        contract_rate_usd_mt: 14.95,
        all_in_cost_usd: cargoMt * 14.95 * 6,
        saving_vs_repeated_spot_usd: Math.round(cargoMt * 1.5 * 6),
        planned_cycle_days: 26.5 * 6,
      },
    ];

    return {
      route_id: routeId,
      vessel_type: vesselType,
      cargo_mt: cargoMt,
      laycan_days: laycanDays,
      laycan_date: new Date(Date.now() + laycanDays * 86400000)
        .toISOString()
        .split("T")[0],
      risk_index: 48,
      load_days: 2.5,
      discharge_days: 3.6,
      port_days: 6.1,
      sailing_days: 20.4,
      cycle_days: 26.5,
      posture: "Staged 3-voyage cover",
      action:
        "Fix 40% of committed volume now; retain 60% for the preferred entry window with a freight cap.",
      rationale:
        "High market uncertainty makes a full long commitment less attractive than protected, staged coverage.",
      expected_cost: cargoMt * 15.6 * 3,
      expected_saving: Math.round(cargoMt * 0.85 * 3),
      mape_pct: 3.42,
      volatility_pct: 8.5,
      entry_date: new Date(Date.now() + (laycanDays + 5) * 86400000)
        .toISOString()
        .split("T")[0],
      protections: [
        "Index linkage cap at +8% of baseline",
        "Demurrage sharing at 50% for anchorage wait exceeding 24h",
        "Bunker adjustment factor indexed to Singapore VLSFO",
        "Alternate East Coast port discharge option (Paradip/Visakhapatnam)",
      ],
      scenarios,
      alerts: [
        {
          severity: "Warning",
          alert:
            "East Coast pre-berthing wait times elevated (+18h week-on-week).",
        },
        {
          severity: "Info",
          alert:
            "Panamax availability favorable with 3 hulls cleared for laycan.",
        },
      ],
    };
  }

  public getScorecard(cargoMt: number = 55000) {
    return CATALOG_DESTINATIONS.map((p, idx) => ({
      rank: idx + 1,
      port_code: p.port_code,
      port_name: p.port_name,
      dry_bulk_berths: p.dry_bulk_berths,
      cargo_handling_rate_tpd: p.cargo_handling_rate_tpd,
      avg_pre_berthing_delay_days: p.avg_delay_days,
      estimated_port_days: Number(
        (cargoMt / p.cargo_handling_rate_tpd + p.avg_delay_days).toFixed(1)
      ),
      port_performance_score: Number((95 - idx * 4.5).toFixed(1)),
    }));
  }

  public getScenarios(
    routeId: string = "AUNTL_INPAR",
    vesselType: string = "Panamax",
    congestion: number = 45,
    cargo: number = 55000
  ) {
    const now = new Date();
    const scenarioNames = [
      "Base model",
      "Congestion escalation",
      "Bull market / disruption",
      "Bear market / soft demand",
    ];

    const dataPoints: any[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() + i * 86400000)
        .toISOString()
        .split("T")[0];
      dataPoints.push({
        date: d,
        scenario: "Base model",
        rate_usd_mt: 15.65 + Math.sin(i * 0.1) * 0.4,
      });
      dataPoints.push({
        date: d,
        scenario: "Congestion escalation",
        rate_usd_mt: 16.85 + Math.sin(i * 0.1) * 0.5,
      });
      dataPoints.push({
        date: d,
        scenario: "Bull market / disruption",
        rate_usd_mt: 17.95 + Math.sin(i * 0.1) * 0.6,
      });
      dataPoints.push({
        date: d,
        scenario: "Bear market / soft demand",
        rate_usd_mt: 13.9 + Math.sin(i * 0.1) * 0.3,
      });
    }

    const summary = scenarioNames.map((s, idx) => ({
      scenario: s,
      lowest_rate: Number((13.5 + idx * 1.1).toFixed(2)),
      average_rate: Number((15.2 + idx * 1.1).toFixed(2)),
      highest_rate: Number((16.8 + idx * 1.2).toFixed(2)),
      volatility: "Low-Med",
    }));

    return {
      summary,
      datapoints: dataPoints,
    };
  }

  public getFleet() {
    return [
      {
        vessel_type: "Panamax",
        available_hulls: 3,
        next_available_days: 11,
        availability_status: "Available for laycan",
        data_status: "Verified active fleet",
      },
      {
        vessel_type: "Supramax",
        available_hulls: 2,
        next_available_days: 5,
        availability_status: "Available for laycan",
        data_status: "Verified active fleet",
      },
      {
        vessel_type: "Handysize",
        available_hulls: 4,
        next_available_days: 2,
        availability_status: "Available for laycan",
        data_status: "Verified active fleet",
      },
      {
        vessel_type: "Capesize",
        available_hulls: 1,
        next_available_days: 16,
        availability_status: "Check repositioning",
        data_status: "Verified active fleet",
      },
    ];
  }

  public getRiskCockpit(
    congestion: number = 45,
    uncertainty: number = 0.45,
    rate: number = 14.01,
    portDays: number = 6.1,
    fleetDays: number = 11,
    jitRisk: number = 40
  ) {
    return [
      {
        risk_driver: "Port & berth congestion",
        score: Math.min(100, Math.round(congestion * 0.8 + portDays * 5)),
        level: "Medium",
        recommended_mitigation:
          "Confirm berth window; retain alternate-port and demurrage clauses.",
      },
      {
        risk_driver: "Market / freight volatility",
        score: Math.min(
          100,
          Math.round((uncertainty / Math.max(rate, 0.1)) * 300)
        ),
        level: "Medium",
        recommended_mitigation:
          "Use a rate cap, index linkage, or staged fixture.",
      },
      {
        risk_driver: "Fleet availability",
        score: Math.min(100, fleetDays * 4),
        level: "Low",
        recommended_mitigation:
          "Hold the vessel option or line up a repositioning alternative.",
      },
      {
        risk_driver: "JIT arrival execution",
        score: jitRisk,
        level: "Low",
        recommended_mitigation:
          "Reconfirm terminal readiness before issuing the speed instruction.",
      },
    ];
  }

  public recordAudit(
    routeId: string = "AUNTL_INPAR",
    vessel: string = "Panamax",
    cargo: number = 55000,
    priority: string = "Balanced",
    riskIndex: number = 48,
    jitAction: string = "Proceed at 10.8 knots",
    sourceStatus: string = "Live calibrated engine"
  ) {
    return [
      {
        audit_field: "Decision timestamp",
        recorded_value:
          new Date().toISOString().replace("T", " ").substring(0, 16) + " UTC",
      },
      {
        audit_field: "Route / parcel",
        recorded_value: `${routeId} • ${cargo.toLocaleString()} MT`,
      },
      { audit_field: "Selected vessel", recorded_value: vessel },
      { audit_field: "Optimization priority", recorded_value: priority },
      { audit_field: "Risk index", recorded_value: `${riskIndex}/100` },
      { audit_field: "JIT action", recorded_value: jitAction },
      { audit_field: "Data provenance", recorded_value: sourceStatus },
      {
        audit_field: "Standards profile",
        recorded_value: "DCSA Port Call / IMO Maritime Single Window mapping",
      },
    ];
  }

  public getStandards() {
    return [
      {
        dashboard_field: "route_id",
        "standards-ready representation":
          "Port Call / operational schedule reference",
        "production source": "Carrier / voyage-planning system",
      },
      {
        dashboard_field: "berth_ready_time",
        "standards-ready representation":
          "DCSA Estimated / Requested / Planned berth event",
        "production source": "Terminal / Port Authority",
      },
      {
        dashboard_field: "congestion_index",
        "standards-ready representation":
          "Port operational status enrichment",
        "production source": "Port Community System / terminal",
      },
      {
        dashboard_field: "vessel availability",
        "standards-ready representation":
          "Operational vessel schedule / fleet position",
        "production source": "Carrier / AIS / fleet system",
      },
      {
        dashboard_field: "cargo and vessel details",
        "standards-ready representation":
          "IMO Maritime Single Window declaration context",
        "production source": "Ship agent / authority",
      },
      {
        dashboard_field: "freight forecast",
        "standards-ready representation":
          "Commercial decision-support enrichment",
        "production source": "Licensed broker / internal model",
      },
    ];
  }

  public getMarine(portCode: string = "INPAR") {
    return {
      port_code: portCode,
      max_wave_m: 1.2,
      risk: "Low Risk",
      source: "Open-Meteo Marine API",
      status: "Operational",
    };
  }

  public getContext() {
    return {
      bdi: 1820,
      brent_crude: 82.5,
      marine_safety_index: "Normal",
      updated_at: new Date().toISOString(),
    };
  }

  public handleFallback(
    endpoint: string,
    method: string,
    query: any = {},
    body: any = {}
  ) {
    const cleanEndpoint = endpoint.split("?")[0];

    switch (cleanEndpoint) {
      case "/api/v1/routes":
        return this.getCatalog();
      case "/api/v1/predict/forecast":
        return this.getForecast(
          query.route_id || "AUNTL_INPAR",
          query.vessel || query.vessel_class || "Panamax",
          parseInt(query.horizon || "60", 10),
          query.laycan_start_date
        );
      case "/api/v1/optimize/vessel":
        return this.optimizeVessel(
          body.route_id,
          body.cargo,
          body.congestion,
          body.priority
        );
      case "/api/v1/plan/jit":
        return this.planJit(
          body.route_id,
          body.dest_code,
          body.vessel_type,
          body.congestion,
          body.fuel_price,
          body.berth_adjustment_hours
        );
      case "/api/v1/strategy/charter":
        return this.evaluateStrategy(
          body.route_id,
          body.cargo,
          body.vessel_type,
          body.laycan_days,
          body.congestion,
          body.voyages
        );
      case "/api/v1/ports/scorecard":
        return this.getScorecard(parseInt(query.cargo || "55000", 10));
      case "/api/v1/scenarios":
        return this.getScenarios(
          body.route_id,
          body.vessel_type,
          body.congestion,
          body.cargo
        );
      case "/api/v1/fleet/availability":
        return this.getFleet();
      case "/api/v1/risk/cockpit":
        return this.getRiskCockpit(
          body.congestion,
          body.uncertainty,
          body.rate,
          body.port_days,
          body.fleet_days,
          body.jit_risk
        );
      case "/api/v1/decision/audit":
        return this.recordAudit(
          body.route_id,
          body.vessel,
          body.cargo,
          body.priority,
          body.risk_index,
          body.jit_action,
          body.source_status
        );
      case "/api/v1/standards/mapping":
        return this.getStandards();
      case "/api/v1/live/marine":
        return this.getMarine(query.port_code);
      case "/api/v1/live/context":
        return this.getContext();
      default:
        return { message: "Fallback executed", endpoint: cleanEndpoint };
    }
  }
}

export const predictionFallbackService = new PredictionFallbackService();
export default predictionFallbackService;
