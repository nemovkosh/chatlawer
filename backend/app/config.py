from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from .prompts import load_legal_assistant_prompt


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_")

    environment: Literal["local", "development", "staging", "production"] = "local"
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str | None = None
    openai_api_key: str
    openai_api_base: str | None = None
    openai_model: str = "gpt-5-mini"
    embeddings_model: str = "text-embedding-3-large"
    embeddings_dims: int = 1536
    chunk_size: int = 1500
    chunk_overlap: int = 200
    max_context_chunks: int = 6
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    system_prompt: str = Field(default_factory=load_legal_assistant_prompt)


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]

