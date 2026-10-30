import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import text
from src.core.config import settings

logger = logging.getLogger(__name__)

# Tương thích với Supabase Connection Pooler (PgBouncer transaction mode trên port 6543)
connect_args = {}
if settings.DB_PORT == 6543 or "supabase.com" in settings.DB_HOST or "pooler.supabase.com" in settings.DATABASE_URL:
    connect_args["statement_cache_size"] = 0
    connect_args["prepared_statement_cache_size"] = 0

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=True,
    echo=False,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency cung cấp AsyncSession."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_connection() -> bool:
    """Kiểm tra kết nối Supabase Database khi khởi động."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT COUNT(*) FROM scholarships"))
            count = result.scalar()
            logger.info(f"✅ Kết nối CSDL Supabase thành công! Tìm thấy {count} học bổng sẵn sàng phục vụ.")
            return True
    except Exception as exc:
        logger.warning(f"⚠️ Chưa kết nối được Supabase ({exc}). Vui lòng kiểm tra file .env")
        return False
