from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from api.deps import settings, setup_cors, get_db
from api.db.engine import init_db
from api.routers import quote, ports, carriers, fees


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema on startup
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="True Landed-Cost Ocean Freight Research Agent API",
    lifespan=lifespan,
)

setup_cors(app)

# Include routers
app.include_router(quote.router)
app.include_router(ports.router)
app.include_router(carriers.router)
app.include_router(fees.router)


@app.get("/v1/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Health and liveness probe."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "app_name": settings.APP_NAME,
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.getenv("API_PORT", "8001"))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True)

