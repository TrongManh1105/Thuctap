from fastapi import APIRouter, status
from src.infrastructure.db.postgres import check_db_connection

router = APIRouter(tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Liveness probe kiểm tra service đang chạy."""
    return {"status": "ok", "service": "scholarship-ai-service"}


@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def readiness_check():
    """Readiness probe kiểm tra kết nối Database PostgreSQL."""
    is_db_ready = await check_db_connection()
    if is_db_ready:
        return {"status": "ready", "database": "connected"}
    return {"status": "degraded", "database": "disconnected"}
