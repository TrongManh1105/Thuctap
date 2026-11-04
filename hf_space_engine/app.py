import os
import math
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import gradio as gr

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scholarship-ai-engine")

# ---------------------------------------------------------
# KHỞI TẠO MÔ HÌNH (BGE-M3 & Cross-Encoder)
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
# FASTAPI BACKEND (CHO RENDER GỌI API)
# ---------------------------------------------------------
api_app = FastAPI(title="Scholarship AI Engine API")
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmbedRequest(BaseModel):
    text: str

class RerankItem(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = ""
    text: str

class RerankRequest(BaseModel):
    query: str
    items: List[RerankItem]

@api_app.get("/health")
def api_health():
    return {"status": "ok", "models": ["BAAI/bge-m3", "BAAI/bge-reranker-v2-m3"]}

@api_app.post("/embed")
def api_embed(req: EmbedRequest):
    try:
        model = get_embed_model()
        vec = model.encode([req.text])['dense_vecs'][0]
        return {"dim": len(vec), "embedding": [float(x) for x in vec]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_app.post("/rerank")
def api_rerank(req: RerankRequest):
    if not req.items:
        return {"total": 0, "results": []}
    try:
        model = get_reranker_model()
        pairs = [[req.query, it.text] for it in req.items]
        raw_scores = model.predict(pairs)
        results = []
        for idx, it in enumerate(req.items):
            s = float(raw_scores[idx])
            prob = 1.0 / (1.0 + math.exp(-s)) if s < 20 else 1.0
            results.append({
                "id": it.id,
                "title": it.title,
                "raw_score": round(s, 4),
                "match_percent": round(prob * 100.0, 1)
            })
        results.sort(key=lambda x: x["match_percent"], reverse=True)
        return {"total": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# GIAO DIỆN WEB GRADIO (ĐỂ GIẢNG VIÊN VÀ BẠN TEST TRỰC TIẾP)
# ---------------------------------------------------------
def test_cross_encoder_ui(cand_query: str, doc1: str, doc2: str, doc3: str):
    docs = [d.strip() for d in [doc1, doc2, doc3] if d.strip()]
    if not cand_query.strip() or not docs:
        return "Vui lòng nhập thông tin ứng viên và ít nhất 1 học bổng!"
    
    model = get_reranker_model()
    pairs = [[cand_query, d] for d in docs]
    raw_scores = model.predict(pairs)
    
    out = "### KẾT QUẢ CHẤM ĐIỂM CROSS-ENCODER (bge-reranker-v2-m3):\n\n"
    ranked = []
    for i, d in enumerate(docs):
        s = float(raw_scores[i])
        prob = 1.0 / (1.0 + math.exp(-s)) if s < 20 else 1.0
        ranked.append((d, round(prob * 100.0, 1), round(s, 4)))
    
    ranked.sort(key=lambda x: x[1], reverse=True)
    for rank, (d, pct, raw) in enumerate(ranked, start=1):
        out += f"**#{rank} Phù hợp:** `{pct}%` (Raw Logit: `{raw}`)\n> {d}\n\n"
    return out

with gr.Blocks(title="ScholarMatch AI Engine") as demo:
    gr.Markdown("# 🎓 ScholarMatch AI Engine (BGE-M3 & Cross-Encoder)")
    gr.Markdown("Máy chủ AI phục vụ gợi ý học bổng du học thông minh. Vừa phục vụ REST API cho Render, vừa hỗ trợ kiểm thử trực quan.")
    
    with gr.Tab("Kiểm Thử Cross-Encoder Reranker"):
        gr.Markdown("Nhập tóm tắt hồ sơ sinh viên và 3 mô tả học bổng để mô hình nơ-ron Cross-Attention tính toán điểm tương thích:")
        q_input = gr.Textbox(
            label="Hồ Sơ Ứng Viên",
            value="Ứng viên: Nguyễn Trọng Mạnh Tiến | Ngành: Trí tuệ nhân tạo / CNTT | GPA: 2.95/4.0 | IELTS: 6.5 | Có 1 bài báo NCKH",
            lines=2
        )
        d1_input = gr.Textbox(
            label="Học bổng 1 (Trường mục tiêu MDU Thụy Điển)",
            value="Đại học Mälardalen (MDU) - Thụy Điển | Ngành: AI & Software Engineering | Yêu cầu: GPA 3.0, IELTS 6.5 | Miễn 100% học phí",
            lines=2
        )
        d2_input = gr.Textbox(
            label="Học bổng 2 (Đại học Gothenburg)",
            value="Đại học Gothenburg - Thụy Điển | Ngành: Khoa học môi trường & Năng lượng tái tạo | Yêu cầu: GPA 3.2, IELTS 7.0",
            lines=2
        )
        d3_input = gr.Textbox(
            label="Học bổng 3 (Đại học Nanyang Singapore)",
            value="Đại học Công nghệ Nanyang (NTU) - Singapore | Ngành: Tiến sĩ Khoa học máy tính | Yêu cầu: GPA 3.6, IELTS 7.0",
            lines=2
        )
        btn = gr.Button("Chạy Chấm Điểm Cross-Encoder", variant="primary")
        result_box = gr.Markdown()
        btn.click(test_cross_encoder_ui, inputs=[q_input, d1_input, d2_input, d3_input], outputs=[result_box])

# Kết hợp FastAPI và Gradio
app = gr.mount_gradio_app(api_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
