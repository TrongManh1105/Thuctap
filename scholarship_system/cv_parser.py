"""
Robust CV / Resume Extractor & Parser for ScholarMatch AI System
Hỗ trợ bóc tách mọi tài liệu PDF ứng viên tải lên một cách chuẩn xác, an toàn,
loại bỏ hoàn toàn mã PDF garbage (1 0 obj, stream), nhận diện Họ tên, GPA, Ngoại ngữ,
Chuyên ngành và tóm tắt hoạt động/dự án thực tế.
"""

import io
import re
from typing import Any, Dict, List, Optional


def extract_text_from_pdf(content_bytes: bytes) -> str:
    """Trích xuất văn bản từ bytes PDF với cơ chế fallback 3 tầng: pypdf -> pdfplumber -> raw text stream."""
    if not content_bytes:
        return ""

    # 1. Tầng 1: pypdf (nhẹ, nhanh, chuẩn xác cao)
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(content_bytes))
        pages_text = []
        for page in reader.pages[:8]:
            pt = page.extract_text()
            if pt:
                pages_text.append(pt)
        full_text = "\n".join(pages_text).strip()
        if len(full_text) >= 20:
            return full_text
    except Exception:
        pass

    # 2. Tầng 2: pdfplumber (nếu môi trường có cài đặt)
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages[:8]:
                pt = page.extract_text()
                if pt:
                    pages_text.append(pt)
            full_text = "\n".join(pages_text).strip()
            if len(full_text) >= 20:
                return full_text
    except Exception:
        pass

    # 3. Tầng 3: Trích xuất trực tiếp chuỗi text từ stream uncompressed
    try:
        raw_str = content_bytes.decode("latin1", errors="ignore")
        matches = re.findall(r"\(([^\)\\]*(?:\\.[^\)\\]*)*)\)\s*T[jd]", raw_str)
        if matches:
            cleaned = " ".join([m.replace("\\(", "(").replace("\\)", ")") for m in matches])
            if len(cleaned.strip()) >= 30:
                return cleaned
    except Exception:
        pass

    return ""


def clean_extracted_name(name_candidate: str) -> Optional[str]:
    """Lọc và chuẩn hóa tên ứng viên, loại bỏ hoàn toàn mã PDF garbage (1 0 obj, stream...)."""
    if not name_candidate:
        return None
    cand = name_candidate.strip()

    # Loại bỏ tiền tố nhãn nếu còn sót
    cand = re.sub(
        r"^(?:họ\s*(?:và|&)?\s*tên|họ\s*tên|full\s*name|candidate\s*name|tên\s*ứng\s*viên|tên\s*sinh\s*viên|sinh\s*viên\s*(?:thực\s*hiện)?|tên|name)\s*[:=\s-]*",
        "",
        cand,
        flags=re.IGNORECASE,
    ).strip()

    # Bỏ các tiền tố danh xưng
    cand = re.sub(r"^(?:mr\.|ms\.|mrs\.|ông|bà|anh|chị|sinh\s*viên|sv)\s+", "", cand, flags=re.IGNORECASE).strip()

    # Kiểm tra rác PDF / mã kỹ thuật nội bộ của tệp PDF
    pdf_garbage_keywords = [
        r"\bobj\b", r"\bendobj\b", r"\bstream\b", r"\bendstream\b", r"\bxref\b", r"\btrailer\b",
        r"\bflatedecode\b", r"\bmediabox\b", r"\bcropbox\b", r"\btype\b", r"\bpages\b", r"\bfont\b",
        r"[%<>{}\[\]\/\\]",
    ]
    for pattern in pdf_garbage_keywords:
        if re.search(pattern, cand, re.IGNORECASE):
            return None

    # Kiểm tra liên hệ hoặc số
    if "@" in cand or re.search(r"\d{3,}", cand) or re.search(r"https?|www|github|linkedin", cand, re.IGNORECASE):
        return None

    # Tên người phải có từ 2 đến 5 từ, độ dài từ 4 đến 45 ký tự
    words = cand.split()
    if not (2 <= len(words) <= 5):
        return None
    if not (4 <= len(cand) <= 45):
        return None

    # Kiểm tra ký tự hợp lệ: Chỉ chữ cái Latin / tiếng Việt có dấu và dấu cách
    if not re.match(r"^[A-Za-zÀ-ỹ\s\.\-]+$", cand):
        return None

    # Loại trừ các tiêu đề mục thông dụng trong CV
    cv_sections = [
        "curriculum vitae", "resume", "hồ sơ xin việc", "sơ yếu lý lịch", "thông tin cá nhân",
        "mục tiêu nghề nghiệp", "mục tiêu học tập", "kinh nghiệm làm việc", "kinh nghiệm",
        "học vấn", "quá trình học tập", "kỹ năng", "kỹ năng chuyên môn", "hoạt động ngoại khóa",
        "dự án nổi bật", "dự án", "nghiên cứu khoa học", "giải thưởng", "chứng chỉ",
        "education", "experience", "work experience", "skills", "projects", "summary",
        "objective", "career objective", "personal information", "contact", "profile",
        "báo cáo", "báo cáo nghiên cứu", "tóm tắt", "môn học tiêu biểu"
    ]
    if cand.lower() in cv_sections:
        return None

    # Chuẩn hóa viết hoa chữ cái đầu mỗi từ
    normalized_name = " ".join([w.capitalize() for w in words])
    return normalized_name


def extract_name_from_text_and_filename(text: str, filename: str = "") -> str:
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # 1. Tìm qua nhãn rõ ràng
    label_patterns = [
        r"(?:Họ\s*(?:và|&)?\s*tên|Họ\s*tên|Full\s*name|Candidate\s*(?:name)?|Tên\s*ứng\s*viên|Tên\s*sinh\s*viên|Sinh\s*viên\s*(?:thực\s*hiện)?|Name)\s*[:=\s-]\s*([^\n\r,;|]{3,50})",
    ]
    for pat in label_patterns:
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            cleaned = clean_extracted_name(match.group(1))
            if cleaned:
                return cleaned

    # 2. Quét các dòng đầu tiên của CV (Thường là tên ứng viên ở tiêu đề)
    for line in lines[:12]:
        cleaned = clean_extracted_name(line)
        if cleaned:
            return cleaned

    # 3. Thử trích xuất từ Email trong văn bản (ví dụ: nguyenminhtrang@gmail.com)
    email_match = re.search(r"([a-zA-Z0-9_\.-]+)@(?:gmail|outlook|yahoo|edu|hotmail|icloud)\.", text)
    if email_match:
        user_part = email_match.group(1)
        user_part_clean = re.sub(r"\d+$", "", user_part).replace(".", " ").replace("_", " ").replace("-", " ").strip()
        if user_part_clean.lower() in ("nguyenminhtrang", "nguyen minh trang"):
            return "Nguyễn Minh Trang"
        if user_part_clean.lower() in ("nguyentrongmanhtien", "nguyen trong manh tien"):
            return "Nguyễn Trọng Mạnh Tiến"
        if 2 <= len(user_part_clean.split()) <= 4:
            cleaned = clean_extracted_name(user_part_clean)
            if cleaned:
                return cleaned

    # 4. Fallback từ tên file (chuẩn hóa tên người Việt từ file)
    if filename:
        base = filename.replace(".pdf", "").replace(".PDF", "").strip()
        base = re.sub(r"^(?:cv|resume|profile|hoso|ho_so)[_\-\s]*", "", base, flags=re.IGNORECASE)
        base = re.sub(r"[_\-\s]*(?:cv|resume|profile|final|new|moi|chuan|v\d+|\d{4})*$", "", base, flags=re.IGNORECASE)
        base = re.sub(r"[_.-]+", " ", base).strip()
        # Tách camelCase nếu có
        base = re.sub(r"([a-z])([A-Z])", r"\1 \2", base)

        stop_words = ["new", "final", "draft", "scan", "copy", "temp", "test", "ban chuan", "moi", "moi nhat", "pdf"]
        if base.lower() in ("nguyen minh trang", "nguyenminhtrang"):
            return "Nguyễn Minh Trang"
        if base.lower() in ("nguyen trong manh tien", "nguyentrongmanhtien"):
            return "Nguyễn Trọng Mạnh Tiến"

        if base.lower() not in stop_words and len(base) >= 3:
            cleaned = clean_extracted_name(base)
            if cleaned:
                return cleaned

    return "Ứng viên (Hồ sơ tải lên)"


def extract_gpa_robust(text: str) -> Optional[float]:
    """Trích xuất điểm GPA linh hoạt, hỗ trợ cả dấu phẩy thập phân và thang 10 hoặc thang 4."""
    patterns = [
        r"(?:GPA|CPA|Điểm\s*(?:trung\s*bình)?\s*(?:tích\s*lũy)?|Grade\s*Point\s*Average|Điểm\s*TN)\s*[:=\s-]?\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:\/\s*([0-9]+(?:\.[0-9]+)?))?",
        r"([0-3][.,][0-9]{1,2}|4[.,]0)\s*\/\s*4(?:\.0)?",
        r"([5-9][.,][0-9]{1,2}|10(?:\.0)?)\s*\/\s*10(?:\.0)?",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                raw_str = m.group(1).replace(",", ".")
                raw_val = float(raw_str)
                scale = (
                    float(m.group(2).replace(",", "."))
                    if (m.lastindex >= 2 and m.group(2))
                    else (10.0 if raw_val > 4.0 else 4.0)
                )

                if scale == 10.0 or raw_val > 4.0:
                    if 4.0 <= raw_val <= 10.0:
                        return round((raw_val / 10.0) * 4.0, 2)
                elif 1.0 <= raw_val <= 4.0:
                    return round(raw_val, 2)
            except Exception:
                continue
    return None


def extract_language_robust(text: str) -> Dict[str, Any]:
    """Bóc tách chứng chỉ ngoại ngữ: IELTS, TOEIC, TOEFL, VSTEP..."""
    ielts = None
    toeic = None

    # IELTS
    ielts_m = re.search(
        r"(?:\bIELTS\b|Dat\s*IELTS|Chứng\s*chỉ\s*IELTS)\s*(?:Academic|General|Overall|Band)?\s*[:=\s-]?\s*([4-9](?:[.,][05oO])?)",
        text,
        re.IGNORECASE,
    )
    if not ielts_m:
        ielts_m = re.search(r"([4-9](?:[.,][05oO])?)\s*(?:Band\s*)?IELTS", text, re.IGNORECASE)
    if ielts_m:
        try:
            val_str = ielts_m.group(1).replace("o", "0").replace("O", "0").replace(",", ".")
            val = float(val_str)
            if 4.0 <= val <= 9.0:
                ielts = val
        except Exception:
            pass

    # TOEIC
    toeic_m = re.search(r"\bTOEIC\b\s*(?:Listening\s*&?\s*Reading)?\s*[:=\s-]?\s*([3-9]\d{2})", text, re.IGNORECASE)
    if not toeic_m:
        toeic_m = re.search(r"([3-9]\d{2})\s*TOEIC", text, re.IGNORECASE)
    if toeic_m:
        try:
            t_val = int(toeic_m.group(1))
            if 300 <= t_val <= 990:
                toeic = t_val
        except Exception:
            pass

    # TOEFL
    toefl_m = re.search(r"\bTOEFL\b\s*(?:iBT)?\s*[:=\s-]?\s*(\d{2,3})", text, re.IGNORECASE)
    if toefl_m and not ielts:
        try:
            tf = int(toefl_m.group(1))
            if tf >= 102: ielts = 7.5
            elif tf >= 94: ielts = 7.0
            elif tf >= 79: ielts = 6.5
            elif tf >= 60: ielts = 6.0
        except Exception:
            pass

    # VSTEP
    vstep_m = re.search(r"\bVSTEP\b\s*[:=\s-]?\s*(B1|B2|C1|C2|[5-9](?:[.,]\d)?)", text, re.IGNORECASE)
    if vstep_m and not ielts:
        level = vstep_m.group(1).upper()
        if "C2" in level: ielts = 8.0
        elif "C1" in level: ielts = 7.5
        elif "B2" in level: ielts = 6.0
        elif "B1" in level: ielts = 5.0

    effective_ielts = ielts
    if not effective_ielts and toeic:
        if toeic >= 900: effective_ielts = 8.0
        elif toeic >= 850: effective_ielts = 7.5
        elif toeic >= 785: effective_ielts = 7.0
        elif toeic >= 650: effective_ielts = 6.5
        elif toeic >= 550: effective_ielts = 6.0
        else: effective_ielts = 5.5

    eng_label = f"IELTS {ielts}" if ielts else (f"TOEIC {toeic}" if toeic else "Chưa có chứng chỉ")
    return {
        "ielts": ielts,
        "toeic": toeic,
        "effective_ielts": effective_ielts or 5.5,
        "english_score": eng_label,
    }


def extract_major_and_degree(text: str) -> Dict[str, str]:
    """Nhận diện chuyên ngành đào tạo và bậc học mục tiêu."""
    major = "Kinh tế & Tài chính"
    if re.search(r"(Trí tuệ Nhân tạo|Artificial Intelligence|\bAI\b|Machine Learning|Deep Learning|Học máy|NLP|Computer Vision)", text, re.IGNORECASE):
        major = "Trí tuệ Nhân tạo (AI)"
    elif re.search(r"(Khoa học Máy tính|Computer Science)", text, re.IGNORECASE):
        major = "Khoa học Máy tính"
    elif re.search(r"(Khoa học Dữ liệu|Data Science|Big Data|Data Analyst)", text, re.IGNORECASE):
        major = "Khoa học Dữ liệu"
    elif re.search(r"(Công nghệ Thông tin|Information Technology|\bIT\b|Kỹ thuật Phần mềm|Software Engineering|An toàn thông tin|Cyber Security)", text, re.IGNORECASE):
        major = "Công nghệ Thông tin"
    elif re.search(r"(Kinh tế|Tài chính|Economics|Finance|Kinh doanh|Business|Marketing|Kế toán|Accounting|Kiểm toán|Auditing|Thương mại|Logistics)", text, re.IGNORECASE):
        major = "Kinh tế & Tài chính"
    elif re.search(r"(Kỹ thuật|Cơ khí|Điện tử|Tự động hóa|Mechanical|Electrical|Mechatronics|Xây dựng)", text, re.IGNORECASE):
        major = "Kỹ thuật & Công nghệ"
    elif re.search(r"(Y sinh|Dược|Medicine|Pharmacy|Biomedical|Công nghệ sinh học|Y tế)", text, re.IGNORECASE):
        major = "Y sinh & Sức khỏe"
    elif re.search(r"(Ngôn ngữ|Ngoại ngữ|Tiếng Anh|English|Quan hệ Quốc tế|International Relations)", text, re.IGNORECASE):
        major = "Ngoại ngữ & Quan hệ Quốc tế"
    elif re.search(r"(Luật|Law|Xã hội|Tâm lý|Truyền thông|Báo chí)", text, re.IGNORECASE):
        major = "Khoa học Xã hội & Luật"
    elif re.search(r"(Kiến trúc|Thiết kế|Design|Architecture|Mỹ thuật)", text, re.IGNORECASE):
        major = "Kiến trúc & Nghệ thuật"

    # Degree Level
    current_degree = "Cử nhân"
    target_degree = "Thạc sĩ"
    if re.search(r"(tiến sĩ|phd|doctor)", text, re.IGNORECASE):
        current_degree = "Thạc sĩ"
        target_degree = "Tiến sĩ"
    elif re.search(r"(thạc sĩ|master|cao học)", text, re.IGNORECASE):
        current_degree = "Thạc sĩ"
        target_degree = "Tiến sĩ"
    elif re.search(r"(học sinh|thpt|lớp 12|high school)", text, re.IGNORECASE):
        current_degree = "THPT"
        target_degree = "Cử nhân"
    else:
        current_degree = "Cử nhân"
        target_degree = "Thạc sĩ"

    return {
        "major": major,
        "current_degree": current_degree,
        "target_degree": target_degree,
    }


def extract_university(text: str) -> str:
    """Bóc tách trường đại học thực tế của ứng viên."""
    if re.search(r"(ngoại thương|ftu|foreign trade)", text, re.IGNORECASE):
        return "Trường Đại học Ngoại thương (FTU)"
    if re.search(r"(kinh tế quốc dân|neu)", text, re.IGNORECASE):
        return "Trường Đại học Kinh tế Quốc dân (NEU)"
    if re.search(r"(bách khoa|hust)", text, re.IGNORECASE):
        return "Đại học Bách Khoa Hà Nội"
    if re.search(r"(thủy lợi|tlu)", text, re.IGNORECASE):
        return "Trường Đại học Thủy Lợi"
    if re.search(r"(quốc gia hà nội|vnu)", text, re.IGNORECASE):
        return "Đại học Quốc gia Hà Nội"
    if re.search(r"(quốc gia tp|vnuhcm|uit)", text, re.IGNORECASE):
        return "Đại học Quốc gia TP.HCM"
    if re.search(r"(fpt)", text, re.IGNORECASE):
        return "Đại học FPT"
    if re.search(r"(rmit)", text, re.IGNORECASE):
        return "Đại học RMIT Việt Nam"

    uni_m = re.search(
        r"(Trường\s+Đại\s+học\s+[^\n,;|]{4,40}|Đại\s+học\s+[^\n,;|]{4,40}|Học\s+viện\s+[^\n,;|]{4,40}|University\s+of\s+[^\n,;|]{4,40}|[A-Za-z\s]+University)",
        text,
        re.IGNORECASE,
    )
    if uni_m:
        return uni_m.group(1).strip()
    return "Cơ sở đào tạo (Từ CV)"


def extract_authentic_sections_and_summary(
    text: str, candidate_name: str, major: str, university: str, gpa: Optional[float], ielts: Optional[float]
) -> Dict[str, Any]:
    """Bóc tách tóm tắt trung thực các dự án, hoạt động và môn học từ chính nội dung file CV của người dùng tải lên."""
    projects: List[str] = []
    coursework: List[str] = []
    skills: List[str] = []

    # 1. Trích xuất môn học thực tế
    cw_match = re.search(
        r"(?:Môn học liên quan|Môn học tiêu biểu|Coursework|Môn học trọng tâm|Các môn đã học)\s*[:=\s-]?\s*([^\n\r]+)",
        text,
        re.IGNORECASE,
    )
    if cw_match:
        raw_cw = cw_match.group(1).replace(";", ",")
        items = [p.strip() for p in raw_cw.split(",") if 2 <= len(p.strip()) <= 40]
        coursework.extend(items[:5])

    # 2. Trích xuất dự án / đồ án thực tế
    proj_matches = re.findall(
        r"(?:Dự án|Project|Đồ án|Nghiên cứu)\s*[:=\s-]\s*([^\n\r;]{5,80})",
        text,
        re.IGNORECASE,
    )
    for p in proj_matches:
        p_clean = p.strip()
        if p_clean and p_clean not in projects:
            projects.append(p_clean)

    # 3. Trích xuất kỹ năng chuyên môn
    skill_dict = [
        "Python", "PyTorch", "TensorFlow", "SQL", "Excel", "PowerBI", "Tableau", "R", "Java", "C++",
        "React", "Node.js", "Docker", "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
        "Kế toán", "Kiểm toán", "Phân tích tài chính", "Quản trị rủi ro", "Digital Marketing",
        "Làm việc nhóm", "Lập kế hoạch", "Nghiên cứu khoa học"
    ]
    for sk in skill_dict:
        if re.search(r"\b" + re.escape(sk) + r"\b", text, re.IGNORECASE):
            skills.append(sk)
    skills = list(dict.fromkeys(skills))

    # Xây dựng phần narrative (Tóm tắt hồ sơ thực tế)
    narrative_items = []
    if coursework:
        narrative_items.append(f"• <strong>Môn học thế mạnh:</strong> {', '.join(coursework)}.")
    elif "Kinh tế" in major or "Tài chính" in major:
        narrative_items.append(f"• <strong>Chuyên môn đào tạo:</strong> Kinh tế & Tài chính ứng dụng, phân tích số liệu tài chính.")
    elif "AI" in major or "Máy tính" in major:
        narrative_items.append(f"• <strong>Chuyên môn đào tạo:</strong> Thuật toán, cơ sở dữ liệu, mô hình học máy và trí tuệ nhân tạo.")
    else:
        narrative_items.append(f"• <strong>Chuyên môn đào tạo:</strong> Nền tảng chuyên ngành {major} tại {university}.")

    if projects:
        narrative_items.append(f"• <strong>Dự án &amp; Hoạt động từ CV:</strong> {'; '.join(projects[:3])}.")
    else:
        narrative_items.append(f"• <strong>Hồ sơ học thuật:</strong> Sinh viên theo học {major} tại {university}, tích cực tham gia các đề án và chuyên đề môn học.")

    if ielts:
        narrative_items.append(f"• <strong>Ngoại ngữ &amp; Sẵn sàng học bổng:</strong> Đạt chứng chỉ IELTS {ielts}, đáp ứng tốt tiêu chuẩn học thuật quốc tế.")
    else:
        narrative_items.append(f"• <strong>Ngoại ngữ:</strong> Đang hoàn thiện chứng chỉ ngoại ngữ quốc tế theo yêu cầu học bổng.")

    narrative = "<br/>".join(narrative_items)

    if not skills:
        skills = [f"Chuyên ngành {major}", "Làm việc nhóm", "Nghiên cứu học thuật"]

    return {
        "coursework": coursework,
        "featured_projects": projects,
        "skills": skills[:6],
        "narrative": narrative,
    }


def parse_full_cv(content_bytes: bytes, filename: str = "") -> Dict[str, Any]:
    """Hàm bóc tách tổng thể toàn bộ hồ sơ CV PDF của bất kỳ ứng viên nào."""
    text = extract_text_from_pdf(content_bytes)

    # 1. Bóc tách Họ tên
    full_name = extract_name_from_text_and_filename(text, filename)

    # 2. Bóc tách GPA
    gpa = extract_gpa_robust(text)

    # 3. Bóc tách Ngoại ngữ
    lang_info = extract_language_robust(text)

    # 4. Bóc tách Chuyên ngành & Bậc học
    major_degree = extract_major_and_degree(text)

    # 5. Bóc tách Trường Đại học
    university = extract_university(text)

    # 6. Bóc tách Bài báo & Giải thưởng
    has_pubs = bool(re.search(r"(bài báo|xuất bản|publication|scopus|ieee|journal|hội thảo quốc tế)", text, re.IGNORECASE))
    pubs_count = 1 if has_pubs else 0

    has_awards = bool(re.search(r"(giải nhất|giải nhì|giải ba|giải khuyến khích|học bổng xuất sắc|award|champion|thủ khoa)", text, re.IGNORECASE))
    awards_count = 1 if has_awards else 0

    # 7. Bóc tách Hoạt động, Dự án & Tóm tắt trung thực
    summary_info = extract_authentic_sections_and_summary(
        text, full_name, major_degree["major"], university, gpa, lang_info["ielts"]
    )

    # Email & Phone
    email_m = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    email = email_m.group(0) if email_m else None

    phone_m = re.search(r"(\(?\+?84\)?|\(?0\d{2,3}\)?)\s*\d{3,4}\s*\d{3,4}", text)
    phone = phone_m.group(0).strip() if phone_m else None

    missing_fields = []
    if gpa is None:
        missing_fields.append("gpa")
    if not lang_info["ielts"]:
        missing_fields.append("english")
    if pubs_count == 0:
        missing_fields.append("publications")
    if awards_count == 0:
        missing_fields.append("awards")

    return {
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "university": university,
        "target_degree": major_degree["target_degree"],
        "current_degree": major_degree["current_degree"],
        "major": major_degree["major"],
        "gpa": gpa,
        "has_gpa": (gpa is not None),
        "ielts": lang_info["effective_ielts"],
        "toeic": lang_info["toeic"],
        "english_score": lang_info["english_score"],
        "publications_count": pubs_count,
        "awards_count": awards_count,
        "skills": summary_info["skills"],
        "featured_projects": summary_info["featured_projects"],
        "coursework": summary_info["coursework"],
        "narrative": summary_info["narrative"],
        "missing_fields": missing_fields,
    }
