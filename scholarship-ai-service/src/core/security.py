import secrets
import logging
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from src.core.config import settings

logger = logging.getLogger(__name__)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(header_key: str = Security(api_key_header)) -> str:
    """Xác thực Internal API Key bảo vệ endpoint."""
    expected_key = settings.API_KEY.strip()
    if not header_key or not secrets.compare_digest(header_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing X-API-Key header",
        )
    return header_key
