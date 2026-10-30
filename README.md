# ScholarMatch AI — Study Abroad Intelligence Platform 🎓✨

[![Render Deployment](https://img.shields.io/badge/Render-Deployed%2024%2F7-46E3B7?logo=render&logoColor=white)](https://render.com)
[![Supabase Database](https://img.shields.io/badge/Supabase-7%2C949%2B%20Scholarships-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![Vite](https://img.shields.io/badge/Frontend-Vite%20%2B%20Vanilla%20ES6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

> **Hệ Thống Đối Khớp & Săn Học Bổng Du Học Đa Tầng, Phân Tích Khoảng Cách Tiêu Chí & Trợ Lý Cố Vấn Ảo 24/7**

---

## 🏛️ Kiến Trúc Hệ Thống (System Architecture)

Kho lưu trữ này được cấu trúc theo mô hình đa tầng linh hoạt (Multi-Architecture Monorepo), vừa phục vụ triển khai chạy 24/7 trực tiếp trên Render, vừa lưu trữ toàn diện mã nguồn các microservices:

```
├── scholarship_system/          # 🚀 Web App chính chạy 24/7 trên Render (Flask + Supabase PostgreSQL)
│   ├── app.py                   # API routes: Catalog 7,949+ học bổng, White-box Matcher, Health Probes
│   ├── templates/index.html     # Giao diện ScholarMatch AI mới nhất (Be Vietnam Pro, Glassmorphism)
│   ├── static/assets/           # Production CSS & JS bundle (tối ưu hóa tải trang < 1s)
│   └── requirements.txt         # Dependencies chạy trên Render cloud
│
├── scholarship-web/             # 💻 Frontend Web Client độc lập (Vite, Vanilla CSS, Zero-Downtime Engine)
│   ├── src/                     # Mã nguồn giao diện chính (main.js, style.css, api.js)
│   ├── index.html               # Trang chủ hệ thống
│   ├── vercel.json              # File cấu hình deploy 1-click lên Vercel
│   └── package.json             # Scripts chạy: npm run dev, npm run build
│
├── scholarship-ai-service/      # 🧠 Backend AI Microservice (FastAPI + pgvector + LangGraph)
│   ├── src/                     # Pipeline đối khớp vector 1536-dim, reranker, chat agent
│   ├── main.py                  # FastAPI entrypoint (Port 7782)
│   ├── Dockerfile               # Container hóa phục vụ production
│   └── requirements.txt         # FastAPI, SQLAlchemy asyncpg, LangGraph
│
├── render.yaml                  # File cấu hình tự động nhận diện dịch vụ trên Render
├── Procfile                     # Gunicorn web server entrypoint cho Render
└── requirements.txt             # Root requirements
```

---

## 🌟 Tính Năng Cốt Lõi

1. **Kho Dữ Liệu 7,949+ Học Bổng Toàn Cầu (Supabase pgvector):**
   - Tìm kiếm thời gian thực theo từ khóa, trường đại học, ngành học.
   - Bộ lọc độc lập theo Quốc gia (Hàn Quốc, Nhật Bản, Đức, Mỹ, Anh, Úc...), Mức tài trợ (Toàn phần 100%, Bán phần), và Phân tầng (Group A, B, C).
   - Tích hợp thanh phân trang linh hoạt: Hiển thị 24 học bổng mỗi trang kèm nút **"Tải thêm học bổng từ kho Supabase"**.

2. **Hồ Sơ Năng Lực & Trích Xuất CV AI:**
   - Kéo thả file CV (PDF, DOCX) để AI tự động trích xuất các chỉ số học thuật.
   - Hoặc điều chỉnh trực quan thanh trượt GPA (thang 4.0), chứng chỉ ngoại ngữ IELTS / TOPIK, số bài báo khoa học và giải thưởng.

3. **Bộ Máy Đối Khớp White-box 5 Chiều & Lộ Trình Hành Động:**
   - Nút **"Tìm Kiếm Học Bổng Du Học"** kích hoạt phân tích White-box minh bạch 5 yếu tố:
     - Học thuật / GPA (35%)
     - Trình độ Ngoại ngữ (20%)
     - Độ phù hợp Chuyên ngành (20%)
     - Quốc gia & Văn hóa (15%)
     - Hoạt động & Yếu tố mềm (10%)
   - **Xếp hạng học bổng phù hợp từ Top cao xuống thấp.**
   - **Gap Analysis:** Chỉ rõ từng khoảng cách tiêu chuẩn còn thiếu (ví dụ GPA 2.45 < 3.0, IELTS 4.5 < 6.0).
   - **Lộ trình 3 giai đoạn (Action Roadmap):** Hướng dẫn từng bước nâng cao học thuật, luyện thi ngoại ngữ và hoàn thiện hồ sơ xin học bổng.

4. **Trợ Lý AI Cố Vấn Du Học (RAG + Chatbot):**
   - Tư vấn lộ trình du học, hướng dẫn viết bài luận cá nhân (SOP), thư giới thiệu (LOR) 24/7.

5. **Thiết Kế UI/UX Sang Trọng (Public-Ready):**
   - Hệ thống font chữ tiếng Việt tiêu chuẩn: **Be Vietnam Pro** kết hợp **Plus Jakarta Sans**.
   - Phong cách Obsidian Glassmorphism hiện đại, hỗ trợ cả Dark Mode và Light Mode.

---

## 🚀 Triển Khai Chạy 24/7 (Deployment Guide)

### 1. Triển khai tự động trên Render (Đã cấu hình sẵn)
Repository này đã tích hợp sẵn `render.yaml` và `Procfile`. Khi push lên GitHub:
- Render sẽ tự động nhận diện `scholarship_system`
- Chạy lệnh cài đặt: `pip install -r requirements.txt`
- Khởi động server: `gunicorn app:app`
- Kết nối trực tiếp cơ sở dữ liệu Supabase PostgreSQL 7,949 học bổng và vận hành 24/7!

### 2. Triển khai Frontend trên Vercel (Tùy chọn)
- Kết nối repo với [Vercel.com](https://vercel.com)
- Chọn thư mục gốc (Root Directory): `scholarship-web`
- Bấm **Deploy** để nhận URL tĩnh tốc độ cao toàn cầu dạng `https://ten-du-an.vercel.app`.

---

## 💻 Chạy Cục Bộ (Local Development)

### Chạy Bản Flask Fullstack:
```bash
cd scholarship_system
pip install -r requirements.txt
python app.py
```
Truy cập: `http://localhost:5000`

### Chạy Bản Vite Frontend:
```bash
cd scholarship-web
npm install
npm run dev
```
Truy cập: `http://localhost:5173`
