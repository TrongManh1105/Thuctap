# ScholarMatch AI — Study Abroad Intelligence Platform 🎓✨

> **Nền Tảng Trí Tuệ Nhân Tạo Đối Khớp Học Bổng Du Học Toàn Cầu, Phân Tích Khoảng Cách Tiêu Chí & Trợ Lý Cố Vấn Ảo 24/7**

---

## 🌟 Tính Năng Nổi Bật

1. **Kho Dữ Liệu 7,949+ Học Bổng Toàn Cầu (Supabase pgvector):**
   - Tra cứu và lọc không giới hạn theo Quốc gia (Hàn Quốc, Nhật Bản, Trung Quốc, Hoa Kỳ, Anh, Đức, Úc, Canada...), Mức tài trợ (Toàn phần 100%, Bán phần), và Phân tầng học thuật (Group A, B, C).
   - Tích hợp tìm kiếm thời gian thực (Real-time Search) & tải thêm linh hoạt (Dynamic Pagination / Infinite Feed).

2. **Hồ Sơ Năng Lực & Trích Xuất CV Tự Động:**
   - Kéo thả file CV (PDF, DOCX) để AI tự động trích xuất GPA, IELTS, chuyên ngành, số bài báo khoa học và giải thưởng.
   - Hoặc tự điều chỉnh thanh trượt điểm số trực quan.

3. **Bộ Máy Đối Khớp White-box 5 Chiều & Lộ Trình Hành Động:**
   - Minh bạch trọng số 5 yếu tố: Học thuật (35%), Ngoại ngữ (20%), Ngành học (20%), Quốc gia (15%), Yếu tố mềm (10%).
   - Xếp hạng học bổng phù hợp từ Top cao xuống thấp.
   - **Gap Analysis & 3-Phase Roadmap:** Chỉ rõ từng khoảng cách tiêu chí còn thiếu (ví dụ GPA 2.45/3.0, IELTS 4.5/6.0) và sinh lộ trình hành động 3 giai đoạn giúp ứng viên hoàn thiện hồ sơ.

4. **Trợ Lý AI Cố Vấn Du Học (RAG + SSE Streaming):**
   - Trò chuyện và tư vấn chiến lược săn học bổng, gợi ý viết bài luận (SOP), xin thư giới thiệu (LOR) theo thời gian thực.

5. **Thiết Kế UI/UX Cao Cấp (Public-ready):**
   - Dark/Light Mode với tông màu Obsidian sang trọng & hiệu ứng Glassmorphism.
   - Chuẩn font chữ tiếng Việt chuyên nghiệp: **Be Vietnam Pro** kết hợp **Plus Jakarta Sans**.
   - Zero-Downtime Engine: Chạy mượt mà trực tiếp trên trình duyệt mọi lúc mọi nơi.

---

## 🚀 Khởi Chạy Dự Án

### Yêu Cầu Hệ Thống
- Node.js 18+ & npm

### Cài Đặt & Chạy Môi Trường Dev
`ash
# Cài đặt dependencies
npm install

# Khởi chạy dev server
npm run dev
`
Truy cập: http://localhost:5173

### Build Bản Production
`ash
npm run build
`

---

## ☁️ Hướng Dẫn Deploy Lên Vercel (24/7 Miễn Phí)

1. Đẩy mã nguồn lên GitHub repository của bạn.
2. Truy cập [Vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
3. Bấm **Add New...** -> **Project** -> Chọn repo vừa tạo.
4. (Tùy chọn) Thêm Environment Variable:
   - VITE_API_BASE: Link Backend AI Service (nếu có)
5. Bấm **Deploy**. Vercel sẽ tự động build và cấp tên miền công khai dạng https://ten-du-an.vercel.app hoạt động 24/7!
