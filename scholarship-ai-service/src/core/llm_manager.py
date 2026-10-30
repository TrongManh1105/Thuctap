import logging
from typing import Any, List, Optional
from langchain_core.language_models.chat_models import BaseChatModel
from src.core.config import settings

logger = logging.getLogger(__name__)


def get_llm(tools: Optional[List[Any]] = None) -> BaseChatModel:
    """Khởi tạo Chat Model dựa trên cấu hình môi trường."""
    provider = settings.LLM_PROVIDER.lower().strip()

    if provider == "google" and settings.GEMINI_API_KEY:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL or "gemini-2.0-flash-lite",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.2,
        )
    elif provider in ("openai", "openrouter"):
        from langchain_openai import ChatOpenAI
        base_url = settings.LLM_BASE_URL
        api_key = settings.OPENAI_API_KEY if provider == "openai" else settings.OPENROUTER_API_KEY
        if provider == "openrouter" and not base_url:
            base_url = "https://openrouter.ai/api/v1"

        llm = ChatOpenAI(
            model=settings.LLM_MODEL or "gpt-4o-mini",
            api_key=api_key or "dummy_key",
            base_url=base_url,
            temperature=0.2,
        )
    else:
        # Fallback về ChatOpenAI mặc định (dùng được cho Ollama / vLLM local)
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(
            model=settings.LLM_MODEL or "default",
            api_key=settings.OPENAI_API_KEY or "none",
            base_url=settings.LLM_BASE_URL or "http://localhost:11434/v1",
            temperature=0.2,
        )

    if tools:
        return llm.bind_tools(tools)
    return llm
