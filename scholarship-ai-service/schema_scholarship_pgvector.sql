-- ==============================================================================
-- SCHEMA POSTGRESQL + PGVECTOR DÀNH RIÊNG CHO HỆ THỐNG GỢI Ý HỌC BỔNG DU HỌC
-- ==============================================================================

-- 1. Kích hoạt tiện ích mở rộng pgvector và UUID
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Bảng học bổng (16 trường dữ liệu chuẩn hóa + vector embedding 1024-dim)
DROP TABLE IF EXISTS scholarships CASCADE;
CREATE TABLE scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    source_name VARCHAR(150),
    host_country VARCHAR(150),                     -- Hàn Quốc, Anh, Úc, Mỹ, Đức, Thụy Điển...
    degree_level VARCHAR(100),                     -- Cử nhân, Thạc sĩ, Tiến sĩ, Trao đổi
    major_applied TEXT,                            -- Ngành áp dụng (STEM, AI, Kinh tế, Đa ngành...)
    funding_type VARCHAR(100),                     -- Toàn phần 100%, Bán phần, Học phí
    funding_details TEXT,                          -- Chi tiết sinh hoạt phí, vé máy bay, bảo hiểm
    min_gpa NUMERIC(3, 2),                         -- Ngưỡng GPA tối thiểu quy về thang 4.0
    min_ielts NUMERIC(3, 1),                       -- Ngưỡng IELTS tối thiểu
    min_work_exp_years NUMERIC(3, 1) DEFAULT 0,    -- Số năm kinh nghiệm làm việc
    age_limit_text VARCHAR(150),                   -- Giới hạn tuổi nếu có
    checklist TEXT,                                -- Danh mục hồ sơ cần nộp (CV, LOR, SOP, Bảng điểm)
    commitment TEXT,                               -- Ràng buộc & cam kết sau khi tốt nghiệp
    deadline VARCHAR(250),                         -- Hạn nộp hồ sơ
    apply_method VARCHAR(255),                     -- Trực tuyến qua portal, nộp qua đại sứ quán...
    link TEXT,                                     -- Đường link apply chính thức
    raw_content TEXT,                              -- Nội dung tổng hợp dùng để sinh vector
    embedding vector(1024),                        -- Vector nhúng 1024 chiều (BGE-M3 / Gemini)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo chỉ mục HNSW tốc độ cao cho tìm kiếm vector Cosine
CREATE INDEX IF NOT EXISTS idx_scholarships_embedding_hnsw 
ON scholarships USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Chỉ mục lọc cứng (B-tree)
CREATE INDEX IF NOT EXISTS idx_scholarships_country ON scholarships (host_country);
CREATE INDEX IF NOT EXISTS idx_scholarships_degree ON scholarships (degree_level);
CREATE INDEX IF NOT EXISTS idx_scholarships_funding ON scholarships (funding_type);
CREATE INDEX IF NOT EXISTS idx_scholarships_gpa ON scholarships (min_gpa);
CREATE INDEX IF NOT EXISTS idx_scholarships_ielts ON scholarships (min_ielts);

-- 3. Bảng hồ sơ ứng viên du học (Candidate Profile)
DROP TABLE IF EXISTS candidate_profiles CASCADE;
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    target_degree VARCHAR(100) NOT NULL,           -- Cử nhân, Thạc sĩ, Tiến sĩ
    preferred_countries TEXT[],                    -- Mảng các quốc gia mong muốn ["Hàn Quốc", "Đức"]
    major VARCHAR(255) NOT NULL,                   -- Ngành học hiện tại / mong muốn
    gpa NUMERIC(3, 2) NOT NULL,                    -- GPA thang 4.0 (VD: 3.4)
    ielts NUMERIC(3, 1) DEFAULT 0.0,               -- Điểm IELTS (VD: 6.5)
    topik_level INT DEFAULT 0,                     -- Bậc TOPIK nếu đi Hàn (0-6)
    work_experience_years NUMERIC(3, 1) DEFAULT 0, -- Số năm kinh nghiệm làm việc
    research_experience_years NUMERIC(3, 1) DEFAULT 0, -- Số năm làm nghiên cứu
    publications_count INT DEFAULT 0,              -- Số lượng bài báo khoa học (Scopus, Q1/Q2, hội thảo)
    awards_count INT DEFAULT 0,                    -- Số giải thưởng học thuật / thi đấu
    extracurricular_activities TEXT,               -- Hoạt động ngoại khóa / lãnh đạo
    statement_of_purpose TEXT,                     -- Bài luận mục đích học tập
    profile_vector vector(1024),                   -- Vector biểu diễn hồ sơ và định hướng
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidates_profile_vector_hnsw 
ON candidate_profiles USING hnsw (profile_vector vector_cosine_ops);
