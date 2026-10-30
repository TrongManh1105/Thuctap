# 🎓 Scholarship AI Service — Hệ thống Gợi ý Học bổng Du học Đa tầng

Service AI Backend phi trạng thái (Stateless), kế thừa kiến trúc hiệu năng cao của Student360 AI Service, được tùy biến chuyên sâu cho bài toán **So khớp Học bổng Du học (Scholarship Matching)**, **Phân tích Khoảng cách Tiêu chuẩn (Gap Analysis)** và **Chatbot Tư vấn Du học Thông minh (LangGraph + SSE Stream)**.

---

## 🎯 Các Tính năng & Luồng Xử lý Cốt lõi

1. **Bộ máy Khớp nối 3 Giai đoạn (Improved 3-Stage Matching Engine):**
   * **Giai đoạn 1: Recall & Pre-filtering (PostgreSQL pgvector):** Tìm kiếm vector ngữ nghĩa kết hợp lọc cứng Quốc gia (`host_country`) và Bậc học (`degree_level`) với chỉ mục HNSW tốc độ cao.
   * **Giai đoạn 2: White-box 5-Factor Reranking:** Chấm điểm minh bạch theo 5 chiều: Điểm học tập GPA (thang 4.0), Ngoại ngữ (IELTS/TOPIK), Mức độ phù hợp ngành học, Kinh nghiệm/Nghiên cứu/Bài báo, và Vector tương đồng. Phân tầng kết quả thành **Group A** (Đủ điều kiện xét tuyển), **Group B** (Tiềm năng - Cần cải thiện nhẹ) và **Group C** (Chưa đủ chuẩn).
   * **Giai đoạn 3: Explanation Layer (Grounded LLM):** Tự động sinh văn bản giải thích bằng tiếng Việt tự nhiên vì sao ứng viên phù hợp với học bổng, đảm bảo 0% ảo tưởng (anti-hallucination) dựa trên chỉ số chấm điểm thực tế.
2. **Phân tích Khoảng cách Tiêu chuẩn (Gap Analysis):**
   * So sánh chi tiết năng lực ứng viên so với 16 trường yêu cầu của học bổng: Phân loại **Điểm mạnh (Strengths)**, **Khoảng cách cần cải thiện (Gaps)**, **Checklist giấy tờ cần nộp** và **Kế hoạch hành động cụ thể**.
3. **Chatbot Tư vấn Du học Trực tuyến (LangGraph Agent):**
   * Hỗ trợ hỏi đáp du học, tự động kích hoạt `search_scholarships_tool` để tra cứu học bổng thực tế trong database. Stream phản hồi trực tiếp qua Server-Sent Events (SSE).
4. **Trích xuất Hồ sơ tự động từ CV (CV Extraction):**
   * Sinh viên chỉ cần upload file PDF CV/Resume ➔ AI tự động bóc tách thành JSON Profile (GPA, IELTS/TOPIK, Ngành học, Bài báo, Hoạt động ngoại khóa) để tự điền form.

---

## 📂 Cấu trúc Thư mục

```text
scholarship_ai_service/
├── .env.example                     # File cấu hình mẫu (DB, LLM API Keys)
├── requirements.txt                 # Các thư viện Python cần thiết
├── Dockerfile                       # Multi-stage Docker build cho Production
├── schema_scholarship_pgvector.sql  # Toàn bộ SQL tạo bảng scholarships, candidate_profiles & pgvector index
├── main.py                          # Điểm khởi chạy FastAPI Server (Port 7782)
│
├── scripts/
│   ├── seed_scholarships.py         # Nạp dữ liệu học bổng từ file CSV vào PostgreSQL
│   └── test_match.py                # Script chạy thử nghiệm matching từ CLI
│
└── src/
    ├── core/                        # Cấu hình, bảo mật, PII masking, LLM manager
    ├── infrastructure/db/           # Kết nối PostgreSQL asyncpg connection pool
    ├── retrieval/                   # Recall pgvector, Rerank 5 yếu tố, Gap Analysis, Explain
    ├── agents/                      # LangGraph Chatbot tư vấn du học & Tools
    └── api/                         # FastAPI Routes (Health, Match, Gap, Chat SSE, CV Extract)
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Chuẩn bị Môi trường & Cài đặt Thư viện
```bash
python -m venv venv
venv\Scripts\activate      # Trên Windows
pip install -r requirements.txt
```

### 2. Cấu hình Biến môi trường
Tạo file `.env` từ `.env.example`:
```bash
copy .env.example .env
```
Điền thông tin kết nối PostgreSQL (`DB_USER`, `DB_PASSWORD`, `DB_NAME`) và API Key của LLM (`GEMINI_API_KEY` hoặc `OPENAI_API_KEY`).

### 3. Tạo CSDL & Nạp Dữ liệu
1. Chạy file SQL tạo bảng trong PostgreSQL:
   ```bash
   psql -U postgres -d scholarship_db -f schema_scholarship_pgvector.sql
   ```
2. Nạp dữ liệu học bổng từ file CSV:
   ```bash
   python -m scripts.seed_scholarships
   ```

### 4. Khởi chạy Server
```bash
python main.py
# Server sẽ khởi động tại: http://localhost:7782
# Swagger API Docs: http://localhost:7782/docs
```

---

## 🔌 Danh sách API Endpoints Chính

| Method | Endpoint | Chức năng |
| :--- | :--- | :--- |
| `GET` | `/health` & `/health/ready` | Kiểm tra trạng thái server và kết nối CSDL |
| `POST` | `/api/v1/scholarships/match` | Nhận profile ứng viên ➔ Trả về danh sách học bổng đã xếp hạng |
| `POST` | `/api/v1/scholarships/gap-analysis` | Phân tích chi tiết Strengths, Gaps và Checklist của 1 học bổng |
| `POST` | `/api/v1/scholarships/chat/stream` | Chatbot tư vấn du học streaming qua SSE |
| `POST` | `/api/v1/scholarships/extract-cv` | Upload file PDF CV ➔ Tự động bóc tách ra Profile du học |
