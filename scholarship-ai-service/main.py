from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.api.router import router as api_router
from src.infrastructure.db.postgres import check_db_connection, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Kiểm tra kết nối DB khi khởi động
    await check_db_connection()
    yield
    # Giải phóng connection pool khi shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI Service Gợi ý Học bổng Du học & Chatbot Tư vấn Đa tầng",
    lifespan=lifespan,
)

# Cấu hình CORS để kết nối linh hoạt với Next.js / Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Có thể giới hạn domain frontend khi lên production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
