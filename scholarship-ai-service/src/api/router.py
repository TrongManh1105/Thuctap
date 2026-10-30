from fastapi import APIRouter
from src.api.routes import health, match, gap, chat, cv_extract

router = APIRouter()

router.include_router(health.router)
router.include_router(match.router)
router.include_router(gap.router)
router.include_router(chat.router)
router.include_router(cv_extract.router)
