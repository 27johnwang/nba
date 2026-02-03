"""Application configuration."""
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "NBA Betting Analytics"
    debug: bool = False
    api_v1_prefix: str = "/v1"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nba_analytics"
    database_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT Auth
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # External APIs
    anthropic_api_key: Optional[str] = None
    odds_api_key: Optional[str] = None

    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds
    analysis_rate_limit: int = 10  # per minute

    # Cache TTL (seconds)
    odds_cache_ttl: int = 300  # 5 minutes
    analysis_cache_ttl: int = 21600  # 6 hours
    stats_cache_ttl: int = 3600  # 1 hour

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
