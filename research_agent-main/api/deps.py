import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from .db.engine import get_db, SessionLocal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Shipping Landed-Cost Agent API"
    DATABASE_URL: str = Field(default="sqlite:///./shipping_cost.db")
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    LLM_API_KEY: str = Field(default="")
    LLM_MODEL: str = Field(default="gpt-4o-mini")
    LLM_BASE_URL: str = Field(default="")
    CORS_ORIGINS: str = Field(default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
    API_PORT: int = Field(default=8001)

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()


def setup_cors(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


__all__ = ["settings", "setup_cors", "get_db", "SessionLocal"]
