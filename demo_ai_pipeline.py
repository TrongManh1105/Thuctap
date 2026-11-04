import sys
import io

# Đảm bảo mã hóa UTF-8 trên Windows console
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import requests
import numpy as np
from sentence_transformers import CrossEncoder

print("==================================================================")
print("   KIỂM THỬ BỘ ĐÔI AI: BGE-M3 (OLLAMA) & CROSS-ENCODER (LOCAL)   ")
print("==================================================================")

# -------------------------------------------------------------
# 1. HỒ SƠ ỨNG VIÊN
# -------------------------------------------------------------
candidate = "Ứng viên: Nguyễn Trọng Mạnh Tiến | Mục tiêu: Thạc sĩ AI & Khoa học Máy tính tại Thụy Điển | GPA: 2.95/4.0 | IELTS: 6.5"
print(f"\n[+] Hồ sơ ứng viên:\n    -> {candidate}\n")

# -------------------------------------------------------------
# 2. DANH SÁCH HỌC BỔNG ĐỐI CHỨNG
# -------------------------------------------------------------
scholarships = [
    {
        "id": 1,
        "name": "Đại học Mälardalen (MDU) - Thụy Điển",
        "title": "Mälardalen University Scholarship (AI, Intelligent Systems & Robotics)",
        "desc": "Học bổng toàn phần ngành Trí tuệ nhân tạo, Hệ thống thông minh và Kỹ thuật phần mềm tại Thụy Điển. Yêu cầu GPA 3.0, IELTS 6.5."
    },
    {
        "id": 2,
        "name": "Đại học Gothenburg - Thụy Điển",
        "title": "Faculty Distinction Master's Scholarship (Môi trường & Bền vững)",
        "desc": "Học bổng ngành Khoa học Môi trường và Phát triển bền vững tại Thụy Điển. Yêu cầu GPA 3.2, IELTS 7.0."
    },
    {
        "id": 3,
        "name": "Đại học Queensland - Úc",
        "title": "Queensland Agricultural Excellence Scholarship",
        "desc": "Học bổng Nông nghiệp nhiệt đới, Chăn nuôi và Trồng trọt tại Úc. Yêu cầu GPA 2.8, IELTS 6.0."
    }
]

# -------------------------------------------------------------
# TẦNG 1: BGE-M3 TRÊN OLLAMA (ĐO ĐỘ TƯƠNG ĐỒNG VECTOR COSINE)
# -------------------------------------------------------------
print("------------------------------------------------------------------")
print("[TẦNG 1] BGE-M3 (Ollama) Đang sinh Vector 1024 chiều...")

def get_bge_m3_vec(text):
    res = requests.post(
        "http://localhost:11434/api/embeddings",
        json={"model": "bge-m3", "prompt": text},
        timeout=10
    )
    return np.array(res.json()["embedding"])

def cosine_similarity(v1, v2):
    return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))

cand_vec = get_bge_m3_vec(candidate)

print("\n>> KẾT QUẢ TƯƠNG ĐỒNG NGỮ NGHĨA VECTOR BGE-M3 (1024D):")
for s in scholarships:
    s_vec = get_bge_m3_vec(f"{s['title']} - {s['desc']}")
    sim = cosine_similarity(cand_vec, s_vec)
    s["vector_score"] = round(sim * 100, 1)
    print(f"  * {s['name']}: {s['vector_score']}%")

# -------------------------------------------------------------
# TẦNG 2: CROSS-ENCODER (CHẤM ĐIỂM CHÉO CROSS-ATTENTION CHI TIẾT)
# -------------------------------------------------------------
print("\n------------------------------------------------------------------")
print("[TẦNG 2] CROSS-ENCODER (bge-reranker-v2-m3) Đang chấm điểm xếp hạng...")

reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")
pairs = [[candidate, f"{s['name']} | {s['title']} | {s['desc']}"] for s in scholarships]
scores = reranker.predict(pairs)

for idx, s in enumerate(scholarships):
    raw_s = float(scores[idx])
    prob = 1.0 / (1.0 + np.exp(-raw_s)) if raw_s < 20 else 1.0
    s["rerank_percent"] = round(prob * 100.0, 1)

# Sắp xếp lại danh sách theo Cross-Encoder
scholarships.sort(key=lambda x: x["rerank_percent"], reverse=True)

print("\n>> BẢNG XẾP HẠNG CUỐI CÙNG SAU KHI QUA CROSS-ENCODER:")
for rank, s in enumerate(scholarships, start=1):
    star = "🎯 [TRƯỜNG MỤC TIÊU]" if s["id"] == 1 else ""
    print(f"  #{rank} {s['name']}: {s['rerank_percent']}% {star}")
    print(f"      Học bổng: {s['title']}")
print("==================================================================")
