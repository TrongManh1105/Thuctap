from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Scholarship AI Service"
    VERSION: str = "1.0.0"
    PORT: int = 7782
    API_V1_STR: str = "/api/v1"

    # API Security
    API_KEY: str = "scholarship_internal_secret_key"

    # Database (Supabase PostgreSQL with pgvector)
    DB_HOST: str = "aws-0-ap-southeast-1.pooler.supabase.com"
    DB_PORT: int = 6543
    DB_USER: str = "postgres.wzsztxegmqeuwgozlggt"
    DB_PASSWORD: str = "Trongmanh1102205"
    DB_NAME: str = "postgres"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # LLM Settings (Google, OpenAI, OpenRouter, Local vLLM/Ollama)
    LLM_PROVIDER: str = "google"
    LLM_MODEL: str = "gemini-2.0-flash-lite"
    LLM_BASE_URL: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None

    # Embedding Dimension (1536-dim cho Supabase pgvector)
    EMBEDDING_DIM: int = 1536

    # Retrieval parameters
    RECALL_TOP_K: int = 50
    EXPLAIN_TOP_N: int = 3

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
