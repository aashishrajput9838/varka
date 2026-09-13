import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

// Protect all prediction endpoints with authentication
router.use(authMiddleware);

// Helper function to proxy requests to FastAPI
async function proxyToPython(
  endpoint: string,
  method: "GET" | "POST",
  req: Request,
  res: Response,
  body?: any
) {
  try {
    const url = new URL(`${PYTHON_API_URL}${endpoint}`);

    // Append query parameters if GET
    if (method === "GET") {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === "string") {
          url.searchParams.append(key, value);
        } else if (Array.isArray(value)) {
          value.forEach((v) => {
            if (typeof v === "string") url.searchParams.append(key, v);
          });
        }
      }
    }

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    if (method === "POST") {
      options.body = JSON.stringify(body || req.body);
    }

    const response = await fetch(url.toString(), options);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data?.detail || "Python prediction engine returned an error.",
        error: data,
      });
    }

    return res.status(response.status).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(`[Prediction Gateway] Error proxying to ${endpoint}:`, error.message);
    if (error.code === "ECONNREFUSED" || error.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "Port prediction engine service is currently unavailable. Ensure the Python engine is running.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal gateway error communicating with prediction engine.",
      error: error.message,
    });
  }
}

// Routes and catalog
router.get("/routes", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/routes", "GET", req, res);
});

// Freight forecast with XGBoost
router.get("/forecast", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/predict/forecast", "GET", req, res);
});

// Marine conditions from Open-Meteo
router.get("/marine", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/live/marine", "GET", req, res);
});

// Real-time macro and marine context
router.get("/context", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/live/context", "GET", req, res);
});

// Vessel feasibility and multi-objective optimization
router.post("/optimize-vessel", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/optimize/vessel", "POST", req, res);
});

// JIT slow-steaming and decarbonization twin
router.post("/plan-jit", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/plan/jit", "POST", req, res);
});

// Charter commercial posture recommendation
router.post("/strategy", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/strategy/charter", "POST", req, res);
});

// Port efficiency scorecard
router.get("/scorecard", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/ports/scorecard", "GET", req, res);
});

// Grounded Charter Assistant
router.post("/assistant", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/assistant/query", "POST", req, res);
});

// Freight rate scenario stress testing
router.post("/scenarios", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/scenarios", "POST", req, res);
});

// Fleet availability roster
router.get("/fleet", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/fleet/availability", "GET", req, res);
});

// Risk cockpit drivers breakdown
router.post("/risk-cockpit", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/risk/cockpit", "POST", req, res);
});

// Governed decision audit trail
router.post("/audit", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/decision/audit", "POST", req, res);
});

// Standards mapping (DCSA / IMO)
router.get("/standards", (req: Request, res: Response) => {
  return proxyToPython("/api/v1/standards/mapping", "GET", req, res);
});

export default router;
