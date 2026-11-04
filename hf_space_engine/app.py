import os
import math
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scholarship-ai-engine")

app = FastAPI(
    title="Scholarship AI Engine",
    description="Microservice chạy BGE-M3 (1024D) và Cross-Encoder (bge-reranker-v2-m3) phục vụ ScholarMatch AI"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# KHỞI TẠO MÔ HÌNH (Lazy loading hoặc khởi động cùng Server)
# ---------------------------------------------------------
embed_model = None
reranker_model = None

def get_embed_model():
    global embed_model
    if embed_model is None:
        logger.info("[+] Đang nạp mô hình BGE-M3 (1024D)...")
        from FlagEmbedding import BGEM3FlagModel
        embed_model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=False)
        logger.info("[✓] Đã nạp thành công BGE-M3!")
    return embed_model

def get_reranker_model():
    global reranker_model
    if reranker_model is None:
        logger.info("[+] Đang nạp mô hình Cross-Encoder (bge-reranker-v2-m3)...")
        from sentence_transformers import CrossEncoder
        reranker_model = CrossEncoder('BAAI/bge-reranker-v2-m3')
        logger.info("[✓] Đã nạp thành công Cross-Encoder!")
    return reranker_model

# ---------------------------------------------------------
# SCHEMAS
# ---------------------------------------------------------
class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    dim: int
    embedding: List[float]

class RerankItem(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = ""
    text: str

class RerankRequest(BaseModel):
    query: str
    items: List[RerankItem]

class RerankResponse(BaseModel):
    total: int
    results: List[Dict[str, Any]]

# ---------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------
@app.get("/")
def health():
    return {
        "status": "healthy",
        "service": "Scholarship AI Engine",
        "models": {
            "embedding": "BAAI/bge-m3 (1024-dim)",
            "reranker": "BAAI/bge-reranker-v2-m3 (Cross-Encoder)"
        }
    }

@app.post("/embed", response_model=EmbedResponse)
def embed_text(req: EmbedRequest):
    """Tạo vector ngữ nghĩa 1024 chiều bằng BGE-M3"""
    try:
        model = get_embed_model()
        vec = model.encode([req.text])['dense_vecs'][0]
        vec_list = [float(x) for x in vec]
        return EmbedResponse(dim=len(vec_list), embedding=vec_list)
    except Exception as e:
        logger.error(f"[-] Lỗi embed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rerank", response_model=RerankResponse)
def rerank_pairs(req: RerankRequest):
    """Chấm điểm Cross-Attention giữa Hồ sơ và danh sách học bổng"""
    if not req.items:
        return RerankResponse(total=0, results=[])

    try:
        model = get_reranker_model()
        pairs = [[req.query, item.text] for item in req.items]
        raw_scores = model.predict(pairs)

        results = []
        for idx, item in enumerate(req.items):
            s = float(raw_scores[idx])
            # Chuyển đổi Sigmoid sang thang điểm phần trăm 0 - 100%
            prob = 1.0 / (1.0 + math.exp(-s)) if s < 20 else 1.0
            pct = round(prob * 100.0, 1)

            results.append({
                "id": item.id,
                "title": item.title,
                "raw_score": round(s, 4),
                "match_percent": pct
            })

        # Sắp xếp từ cao xuống thấp
        results.sort(key=lambda x: x["match_percent"], reverse=True)
        return RerankResponse(total=len(results), results=results)

    except Exception as e:
        logger.error(f"[-] Lỗi rerank: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
