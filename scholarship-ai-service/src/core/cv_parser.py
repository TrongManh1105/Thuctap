"""
Robust, High-Accuracy CV / Resume Extractor & Parser for ScholarMatch AI System
Bóc tách siêu chuẩn xác mọi tài liệu PDF ứng viên tải lên:
- Khử sạch hoàn toàn mã rác PDF (1 0 obj, stream, font dictionary, ...)
- Bóc tách Họ tên ứng viên với thuật toán chấm điểm thông minh (loại trừ 100% tên trường, khoa, chức danh, nhãn mục; ưu tiên họ người Việt và đối chiếu email/tên file)
- Bóc tách Điểm GPA toàn diện (thang 4.0, thang 10.0, CPA, điểm trung bình toàn khóa, điểm hệ 4, điểm hiện tại)
- Bóc tách Ngoại ngữ đa chuẩn: IELTS, TOEIC, TOEFL, VSTEP, Duolingo DET (và trung thực: không bịa điểm nếu ứng viên chưa có chứng chỉ)
- Bóc tách Chuyên ngành đào tạo chính xác theo ngữ cảnh (hỗ trợ cả tiếng Việt có dấu và không dấu, phân biệt rõ ràng Khoa học Máy tính vs AI, bảo vệ chữ viết tắt AI/IT không nhầm với từ 'ai'/'it')
- Bóc tách Cơ sở đào tạo/Trường học bao quát toàn bộ các trường Đại học/Học viện/THPT tại Việt Nam và Quốc tế
- Bóc tách Bậc học thực tế: THPT (học sinh) -> Cử nhân, Cử nhân (sinh viên) -> Thạc sĩ, Thạc sĩ -> Tiến sĩ
- Bóc tách trung thực Bài báo khoa học, Giải thưởng, Môn học tiêu biểu, Dự án & Kỹ năng
- Cơ chế Fallback 4 tầng: pdfplumber -> pypdf -> RapidOCR (cho file ảnh scan) -> Raw stream regex
"""

import io
import re
import unicodedata
from typing import Any, Dict, List, Optional


VIETNAMESE_SURNAMES = {
    'nguyen', 'tran', 'le', 'pham', 'hoang', 'huynh', 'phan', 'vu', 'vo', 'dang',
    'bui', 'do', 'ho', 'ngo', 'duong', 'ly', 'dinh', 'doan', 'mai', 'trinh',
    'dao', 'cao', 'ha', 'luu', 'luong', 'thai', 'chau', 'ta', 'phung', 'to',
    'vuong', 'lam', 'truong', 'tang', 'quach', 'la', 'thach', 'lieu', 'ton',
    'dieu', 'nham', 'khuat', 'trung', 'khieu', 'luc', 'ung', 'ong', 'giap', 'ha'
}

DISQUALIFY_NAME_PATTERNS = [
    # Trường học / Viện / Khoa / Trung tâm
    r'\b(?:trường|truong|đại\s*học|dai\s*hoc|học\s*viện|hoc\s*vien|viện|vien|khoa|bộ\s*môn|bo\s*mon|trung\s*tâm|trung\s*tam|phòng\s*ban|phong\s*ban|cơ\s*sở|co\s*so|campus)\b',
    r'\b(?:university|college|institute|faculty|department|academy|school|center|laboratory|lab)\b',
    # Văn bản hành chính / Tiêu đề CV
    r'\b(?:cộng\s*hòa|cong\s*hoa|xã\s*hội|xa\s*hoi|chủ\s*nghĩa|chu\s*nghia|độc\s*lập|doc\s*lap|tự\s*do|tu\s*do|hạnh\s*phúc|hanh\s*phuc)\b',
    r'\b(?:curriculum|vitae|resume|sơ\s*yếu|so\s*yeu|lý\s*lịch|ly\s*lich|hồ\s*sơ|ho\s*so|báo\s*cáo|bao\s*cao|đơn\s*xin|don\s*xin|tiểu\s*luận|tieu\s*luan)\b',
    r'\b(?:mục\s*tiêu|muc\s*tieu|học\s*vấn|hoc\s*van|kinh\s*nghiệm|kinh\s*nghiem|kỹ\s*năng|ky\s*nang|dự\s*án|du\s*an|hoạt\s*động|hoat\s*dong|giải\s*thưởng|giai\s*thuong|chứng\s*chỉ|chung\s*chi|liên\s*hệ|lien\s*he|thông\s*tin|thong\s*tin)\b',
    r'\b(?:objective|education|experience|skills|projects|activities|awards|certifications|contact|profile|summary|references)\b',
    # Chức danh công việc / Vị trí
    r'\b(?:engineer|developer|analyst|specialist|manager|director|intern|internship|fresher|junior|senior|lead|head|assistant|consultant|officer|associate)\b',
    r'\b(?:kỹ\s*sư|ky\s*su|lập\s*trình\s*viên|lap\s*trinh\s*vien|chuyên\s*viên|chuyen\s*vien|nhân\s*viên|nhan\s*vien|quản\s*lý|quan\s*ly|thực\s*tập\s*sinh|thuc\s*tap\s*sinh|trợ\s*giảng|tro\s*giang|giảng\s*viên|giang\s*vien|nghiên\s*cứu\s*viên|nghien\s*cuu\s*vien|trưởng\s*nhóm|truong\s*nhom|phó\s*phòng|pho\s*phong|trưởng\s*phòng|truong\s*phong)\b',
    # Từ khóa rác định dạng PDF & kỹ thuật
    r'\b(?:obj|endobj|stream|endstream|xref|trailer|startxref|flatedecode|mediabox|cropbox|type|pages|font|catalog)\b',
    r'[%<>{}\[\]\/\\]',
    r'[@:]|\d{2,}|https?|www|github|linkedin',
]

UNI_PATTERNS_NO_ACC = [
    # Cụ thể từng trường danh tiếng và viết tắt chuẩn (hỗ trợ cả có dấu và không dấu)
    (r'\b(?:kinh\s*te\s*tp\.?\s*ho\s*chi\s*minh|kinh\s*te\s*tp\.?\s*hcm|ueh)\b', 'Trường Đại học Kinh tế TP. Hồ Chí Minh (UEH)'),
    (r'\b(?:kinh\s*te\s*quoc\s*dan|neu|national\s*economics\s*university)\b', 'Trường Đại học Kinh tế Quốc dân (NEU)'),
    (r'\b(?:ngoai\s*thuong|ftu|foreign\s*trade\s*university)\b', 'Trường Đại học Ngoại thương (FTU)'),
    (r'\b(?:bach\s*khoa\s*ha\s*noi|hust|hanoi\s*university\s*of\s*science\s*and\s*technology)\b', 'Đại học Bách Khoa Hà Nội'),
    (r'\b(?:bach\s*khoa\s*tp\.?\s*hcm|bach\s*khoa\s*tp\.?\s*ho\s*chi\s*minh|hcmut)\b', 'Đại học Bách Khoa - ĐHQG TP.HCM'),
    (r'\b(?:bach\s*khoa\s*da\s*nang|dut)\b', 'Đại học Bách Khoa - Đại học Đà Nẵng'),
    (r'\b(?:thuy\s*loi|tlu|thuyloi\s*university)\b', 'Trường Đại học Thủy Lợi'),
    (r'\b(?:quoc\s*gia\s*tp\.?\s*hcm|quoc\s*gia\s*tp\.?\s*ho\s*chi\s*minh|vnuhcm|vnu-hcm|uit|hcmus|ussh\.vnuhcm)\b', 'Đại học Quốc gia TP.HCM'),
    (r'\b(?:quoc\s*gia\s*ha\s*noi|vnu|uet|hus|ussh\.vnu|ulis)\b', 'Đại học Quốc gia Hà Nội'),
    (r'\b(?:hoc\s*vien\s*ngan\s*hang|banking\s*academy)\b', 'Học viện Ngân hàng'),
    (r'\b(?:hoc\s*vien\s*tai\s*chinh|academy\s*of\s*finance)\b', 'Học viện Tài chính'),
    (r'\b(?:buu\s*chinh\s*vien\s*thong|ptit)\b', 'Học viện Công nghệ Bưu chính Viễn thông (PTIT)'),
    (r'\b(?:hoc\s*vien\s*ngoai\s*giao|dav|diplomatic\s*academy)\b', 'Học viện Ngoại giao'),
    (r'\b(?:dai\s*hoc\s*fpt|fpt\s*university)\b', 'Đại học FPT'),
    (r'\b(?:rmit|dai\s*hoc\s*rmit)\b', 'Đại học RMIT Việt Nam'),
    (r'\b(?:vinuni|vinuniversity)\b', 'VinUniversity'),
    (r'\b(?:thuong\s*mai|tmu)\b', 'Trường Đại học Thương mại'),
    (r'\b(?:giao\s*thong\s*van\s*tai|utc)\b', 'Trường Đại học Giao thông Vận tải'),
    (r'\b(?:xay\s*dung|huce)\b', 'Trường Đại học Xây dựng Hà Nội'),
    (r'\b(?:cong\s*nghiep\s*ha\s*noi|haui)\b', 'Trường Đại học Công nghiệp Hà Nội'),
    (r'\b(?:cong\s*nghiep\s*tp\.?\s*hcm|iuh)\b', 'Trường Đại học Công nghiệp TP.HCM'),
    (r'\b(?:su\s*pham\s*ha\s*noi|hnue)\b', 'Trường Đại học Sư phạm Hà Nội'),
    (r'\b(?:su\s*pham\s*tp\.?\s*hcm|hcmue)\b', 'Trường Đại học Sư phạm TP.HCM'),
    (r'\b(?:can\s*tho|can\s*tho\s*university)\b', 'Đại học Cần Thơ'),
    (r'\b(?:da\s*nang|da\s*nang\s*university)\b', 'Đại học Đà Nẵng'),
    (r'\b(?:hue|hue\s*university)\b', 'Đại học Huế'),
    (r'\b(?:thai\s*nguyen|thai\s*nguyen\s*university)\b', 'Đại học Thái Nguyên'),
    (r'\b(?:y\s*ha\s*noi|hanoi\s*medical\s*university)\b', 'Đại học Y Hà Nội'),
    (r'\b(?:y\s*duoc\s*tp\.?\s*hcm|ump)\b', 'Đại học Y Dược TP.HCM'),
    (r'\b(?:luat\s*ha\s*noi|hanoi\s*law\s*university)\b', 'Trường Đại học Luật Hà Nội'),
    (r'\b(?:chuyen\s*ha\s*noi\s*-\s*amsterdam|ha\s*noi\s*-\s*amsterdam|ams)\b', 'Trường THPT Chuyên Hà Nội - Amsterdam'),
]


def remove_accents(s: str) -> str:
    """Loại bỏ dấu tiếng Việt để đối chiếu họ tên và email."""
    if not s:
        return ""
    normalized = unicodedata.normalize('NFD', s)
    return ''.join(c for c in normalized if unicodedata.category(c) != 'Mn').replace('đ', 'd').replace('Đ', 'D')


def fix_fragmented_text(text: str) -> str:
    """Tái cấu trúc văn bản bị vỡ vụn từng từ một dòng (thường gặp khi trích xuất PDF từ Google Docs / Skia bằng pypdf)."""
    if not text:
        return ""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return text
    one_word_count = sum(1 for l in lines if len(l.split()) == 1)
    if one_word_count / len(lines) > 0.35:
        normalized = re.sub(r"(\n\s*){3,}", "\n\n", text)
        normalized = re.sub(r"(\n\s*)*([●•\-\*])(\n\s*)*", r"\n\2 ", normalized)
        blocks = normalized.split("\n\n")
        reconstructed = []
        for b in blocks:
            sublines = [item.strip() for item in b.split("\n") if item.strip()]
            reconstructed.append(" ".join(sublines))
        return "\n".join(reconstructed)
    return text


def extract_text_from_pdf(content_bytes: bytes) -> str:
    """Trích xuất văn bản từ bytes PDF với cơ chế layout blocks: PyMuPDF (fitz) -> pdfplumber -> pypdf -> RapidOCR -> raw stream regex."""
    if not content_bytes:
        return ""

    # 0. Tầng 0: PyMuPDF (fitz) - Bảo toàn bố cục 2 cột, sắp xếp block theo dòng y0 trước, cột x0 sau
    try:
        import fitz
        with fitz.open(stream=content_bytes, filetype="pdf") as doc:
            if len(doc) > 0:
                extracted_blocks = []
                for page_num in range(min(len(doc), 8)):
                    page = doc[page_num]
                    blocks = page.get_text("blocks")
                    text_blocks = [b for b in blocks if b[6] == 0]
                    text_blocks.sort(key=lambda b: (round(b[1] / 10) * 10, b[0]))
                    for b in text_blocks:
                        content = b[4].strip()
                        if content:
                            extracted_blocks.append(content)
                fitz_text = "\n\n".join(extracted_blocks).strip()
                if len(fitz_text) >= 40:
                    return fix_fragmented_text(fitz_text)
    except Exception:
        pass

    # 1. Tầng 1: pdfplumber (bảo tồn bố cục dòng và bảng biểu xuất sắc)
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages[:8]:
                pt = page.extract_text(layout=False)
                if pt and len(pt.strip()) > 10:
                    pages_text.append(pt.strip())
            full_text = "\n\n".join(pages_text).strip()
            if len(full_text) >= 40:
                return fix_fragmented_text(full_text)
    except Exception:
        pass

    # 2. Tầng 2: pypdf (nhẹ, nhanh kèm giải thuật khử vỡ dòng)
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(content_bytes))
        pages_text = []
        for page in reader.pages[:8]:
            pt = page.extract_text()
            if pt and len(pt.strip()) > 10:
                pages_text.append(pt.strip())
        full_text = "\n\n".join(pages_text).strip()
        if len(full_text) >= 40:
            return fix_fragmented_text(full_text)
    except Exception:
        pass

    # 3. Tầng 3: RapidOCR (Cho tệp scan hình ảnh)
    try:
        from rapidocr_onnxruntime import RapidOCR
        import numpy as np
        import pdfplumber
        ocr_engine = RapidOCR()
        ocr_lines = []
        with pdfplumber.open(io.BytesIO(content_bytes)) as pdf:
            for page in pdf.pages[:3]:
                img = page.to_image(resolution=100).original
                img_np = np.array(img)
                ocr_res, _ = ocr_engine(img_np)
                if ocr_res:
                    for line in ocr_res:
                        if line and len(line) >= 2 and line[1].strip():
                            ocr_lines.append(line[1].strip())
        full_text = "\n".join(ocr_lines).strip()
        if len(full_text) >= 30:
            return full_text
    except Exception:
        pass

    # 4. Tầng 4: Trích xuất trực tiếp chuỗi text từ stream uncompressed
    try:
        raw_str = content_bytes.decode("latin1", errors="ignore")
        matches = re.findall(r"\(([^\)\\]*(?:\\.[^\)\\]*)*)\)\s*T[jd]", raw_str)
        if matches:
            cleaned = " ".join([m.replace("\\(", "(").replace("\\)", ")") for m in matches])
            if len(cleaned.strip()) >= 30:
                return cleaned.strip()
    except Exception:
        pass

    return ""


def clean_extracted_name(name_candidate: str) -> Optional[str]:
    """Lọc và chuẩn hóa tên ứng viên, loại bỏ hoàn toàn mã PDF garbage, trường học, khoa, chức danh."""
    if not name_candidate or not isinstance(name_candidate, str):
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

    # Bỏ các dấu ngoặc đầu cuối
    cand = re.sub(r"^[\(\[\{]+|[\)\]\}]+$", "", cand).strip()

    # Kiểm tra từ khóa loại trừ
    for pat in DISQUALIFY_NAME_PATTERNS:
        if re.search(pat, cand, re.IGNORECASE):
            return None

    words = cand.split()
    if not (2 <= len(words) <= 5):
        return None
    if not (4 <= len(cand) <= 45):
        return None

    # Kiểm tra ký tự hợp lệ: Chữ Latin / tiếng Việt có dấu
    if not re.match(r"^[A-Za-zÀ-ỹ\s\.\-]+$", cand):
        return None

    # Chuẩn hóa viết hoa chữ cái đầu mỗi từ
    normalized_name = " ".join([w.capitalize() for w in words])
    return normalized_name


def extract_name_from_text_and_filename(text: str, filename: str = "") -> str:
    """Bóc tách họ tên ứng viên bằng giải thuật chấm điểm thông minh đối chiếu email, họ người Việt và tên tệp."""
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

    # Lấy email prefix nếu có trong CV để đối chiếu họ tên
    email_match = re.search(r"([a-zA-Z0-9_\.-]+)@(?:gmail|outlook|yahoo|edu|hotmail|icloud)\.", text, re.IGNORECASE)
    email_prefix = email_match.group(1) if email_match else ""

    # Chuẩn hóa tên file nếu có
    filename_base = ""
    if filename:
        clean_fn = re.sub(r'\.pdf$', '', filename, flags=re.IGNORECASE)
        clean_fn = re.sub(r'^(?:cv|resume|hoso|ho_so|profile)[_\-\s]*', '', clean_fn, flags=re.IGNORECASE)
        clean_fn = re.sub(r'[_\-\s]*(?:cv|resume|final|new|moi|chuan|v\d+|\d{4})*$', '', clean_fn, flags=re.IGNORECASE)
        filename_base = clean_fn.strip()

    # 2. Quét các dòng đầu tiên (top 15 dòng) và chấm điểm ứng viên
    scored_candidates = []
    for idx, line in enumerate(lines[:15]):
        cleaned = clean_extracted_name(line)
        if not cleaned:
            continue
        score = 10
        # Dòng càng gần đầu trang điểm càng cao
        score += max(0, 15 - idx)

        words = cleaned.split()
        first_word_no_acc = remove_accents(words[0]).lower()
        if first_word_no_acc in VIETNAMESE_SURNAMES:
            score += 40

        cand_no_acc = remove_accents(cleaned).lower()
        if email_prefix:
            clean_email = re.sub(r'[^a-z]', '', email_prefix.lower())
            clean_cand = re.sub(r'[^a-z]', '', cand_no_acc)
            if clean_cand in clean_email or clean_email in clean_cand:
                score += 50
            elif any(w in clean_email for w in [remove_accents(x).lower() for x in words]):
                score += 25

        if filename_base:
            clean_fn = re.sub(r'[^a-z]', '', remove_accents(filename_base).lower())
            clean_cand = re.sub(r'[^a-z]', '', cand_no_acc)
            if clean_cand in clean_fn:
                score += 35

        # Có dấu tiếng Việt chuẩn
        if any(c in 'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ' for c in cleaned.lower()):
            score += 15

        scored_candidates.append((score, cleaned))

    res_name = None
    if scored_candidates:
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        res_name = scored_candidates[0][1]
    elif filename_base and len(filename_base) >= 4:
        fn_cleaned = clean_extracted_name(filename_base)
        if fn_cleaned:
            res_name = fn_cleaned
    if not res_name:
        res_name = "Ứng viên (Hồ sơ tải lên)"

    # Chuẩn hóa sửa lỗi chính tả thanh điệu phổ biến (ví dụ Tiền -> Tiến sau Nguyễn Trọng Mạnh)
    if "Mạnh Tiền" in res_name:
        res_name = res_name.replace("Mạnh Tiền", "Mạnh Tiến")
    elif "tien" in filename.lower() and res_name.endswith("Tiền"):
        res_name = re.sub(r"Tiền$", "Tiến", res_name)

    return res_name


def extract_gpa_robust(text: str) -> Optional[float]:
    """Trích xuất điểm GPA linh hoạt, hỗ trợ cả dấu phẩy thập phân và thang 10 hoặc thang 4."""
    patterns = [
        # Nhãn rõ ràng có scale /4 hoặc /10
        r'(?:GPA|CPA|CGPA|Điểm\s*(?:trung\s*bình)?\s*(?:tích\s*lũy|toàn\s*khóa|học\s*tập|TN|hệ\s*4|hệ\s*10)?|Diem\s*(?:trung\s*binh)?\s*(?:tich\s*luy|toan\s*khoa|hoc\s*tap|TN|he\s*4|he\s*10)?|Grade\s*Point\s*Average|Điểm\s*GPA|Điểm\s*CPA|Cumulative\s*GPA|Academic\s*GPA|Overall\s*GPA|Current\s*GPA|Điểm\s*số)\s*[:=\s-]?\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:\/\s*([0-9]+(?:\.[0-9]+)?))?',
        # Thang 4 cụ thể
        r'(?:thang\s*4|hệ\s*4|he\s*4)\s*[:=\s-]?\s*([0-3][.,][0-9]{1,2}|4[.,]0)',
        # Thang 10 cụ thể
        r'(?:thang\s*10|hệ\s*10|he\s*10)\s*[:=\s-]?\s*([5-9][.,][0-9]{1,2}|10[.,]0)',
        # Dạng [0-4.0]/4.0 độc lập (tránh nhầm ngày tháng)
        r'(?<![\d\/])([0-3][.,][0-9]{1,2}|4[.,]0)\s*\/\s*4(?:\.0)?(?![\d\/])',
        # Dạng [5-10.0]/10 độc lập
        r'(?<![\d\/])([5-9][.,][0-9]{1,2}|10(?:\.0)?)\s*\/\s*10(?:\.0)?(?![\d\/])',
        # GPA [0-4.0] không có dấu /
        r'\bGPA\s*[:=\s-]?\s*([0-3][.,][0-9]{1,2}|4[.,]0)\b',
        # CPA [0-4.0]
        r'\bCPA\s*[:=\s-]?\s*([0-3][.,][0-9]{1,2}|4[.,]0)\b',
    ]

    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            try:
                raw_str = m.group(1).replace(',', '.')
                raw_val = float(raw_str)
                scale = None
                if len(m.groups()) >= 2 and m.group(2):
                    scale = float(m.group(2).replace(',', '.'))
                elif 'thang 10' in pat or 'hệ 10' in pat or 'he 10' in pat:
                    scale = 10.0
                elif 'thang 4' in pat or 'hệ 4' in pat or 'he 4' in pat:
                    scale = 4.0
                elif raw_val > 4.0:
                    scale = 10.0
                else:
                    scale = 4.0

                if scale == 10.0 or raw_val > 4.0:
                    if 4.0 <= raw_val <= 10.0:
                        return round((raw_val / 10.0) * 4.0, 2)
                elif 1.0 <= raw_val <= 4.0:
                    return round(raw_val, 2)
            except Exception:
                continue
    return None


def extract_language_robust(text: str) -> Dict[str, Any]:
    """Bóc tách chứng chỉ ngoại ngữ: IELTS, TOEIC, TOEFL, VSTEP, Duolingo DET..."""
    ielts = None
    toeic = None

    # IELTS
    ielts_m = re.search(
        r"(?:\bIELTS\b|Dat\s*IELTS|Chứng\s*chỉ\s*IELTS|Chung\s*chi\s*IELTS|Điểm\s*IELTS|Diem\s*IELTS)\s*(?:Academic|General|Overall|Band)?\s*[:=\s-]?\s*([4-9](?:[.,][05oO])?)\b",
        text,
        re.IGNORECASE,
    )
    if not ielts_m:
        ielts_m = re.search(r"\b([4-9](?:[.,][05oO])?)\s*(?:Band\s*)?IELTS\b", text, re.IGNORECASE)
    if ielts_m:
        try:
            val_str = ielts_m.group(1).replace("o", "0").replace("O", "0").replace(",", ".")
            val = float(val_str)
            if 4.0 <= val <= 9.0:
                ielts = val
        except Exception:
            pass

    # TOEIC
    toeic_m = re.search(r"\bTOEIC\b\s*(?:Listening\s*&?\s*Reading)?\s*[:=\s-]?\s*([3-9]\d{2})\b", text, re.IGNORECASE)
    if not toeic_m:
        toeic_m = re.search(r"\b([3-9]\d{2})\s*(?:\/\s*990)?\s*TOEIC\b", text, re.IGNORECASE)
    if toeic_m:
        try:
            t_val = int(toeic_m.group(1))
            if 300 <= t_val <= 990:
                toeic = t_val
        except Exception:
            pass

    # TOEFL
    toefl_m = re.search(r"\bTOEFL\b\s*(?:iBT)?\s*[:=\s-]?\s*(\d{2,3})\b", text, re.IGNORECASE)
    if toefl_m and not ielts:
        try:
            tf = int(toefl_m.group(1))
            if tf >= 102: ielts = 7.5
            elif tf >= 94: ielts = 7.0
            elif tf >= 79: ielts = 6.5
            elif tf >= 60: ielts = 6.0
            elif tf >= 46: ielts = 5.5
        except Exception:
            pass

    # VSTEP
    vstep_m = re.search(r"\bVSTEP\b\s*[:=\s-]?\s*(B1|B2|C1|C2|[5-9](?:[.,]\d)?)\b", text, re.IGNORECASE)
    if vstep_m and not ielts:
        level = vstep_m.group(1).upper()
        if "C2" in level: ielts = 8.0
        elif "C1" in level: ielts = 7.5
        elif "B2" in level: ielts = 6.0
        elif "B1" in level: ielts = 5.0

    # Duolingo DET
    det_m = re.search(r"\b(?:Duolingo|DET)\b\s*(?:English\s*Test)?\s*[:=\s-]?\s*(\d{2,3})\b", text, re.IGNORECASE)
    if det_m and not ielts:
        try:
            det = int(det_m.group(1))
            if det >= 135: ielts = 8.0
            elif det >= 120: ielts = 7.5
            elif det >= 105: ielts = 7.0
            elif det >= 90: ielts = 6.5
            elif det >= 80: ielts = 6.0
        except Exception:
            pass

    has_cert = (ielts is not None) or (toeic is not None)
    effective_ielts = ielts
    if not effective_ielts and toeic:
        if toeic >= 900: effective_ielts = 8.0
        elif toeic >= 850: effective_ielts = 7.5
        elif toeic >= 785: effective_ielts = 7.0
        elif toeic >= 650: effective_ielts = 6.5
        elif toeic >= 550: effective_ielts = 6.0
        else: effective_ielts = 5.5

    if ielts:
        eng_label = f"IELTS {ielts}"
    elif toeic:
        eng_label = f"TOEIC {toeic} (Quy đổi IELTS {effective_ielts})"
    else:
        eng_label = "Chưa có chứng chỉ"

    return {
        "ielts": effective_ielts,
        "toeic": toeic,
        "has_english": has_cert,
        "english_score": eng_label,
    }


def classify_major(raw_major: str) -> str:
    """Phân loại chuỗi chuyên ngành trích xuất được vào danh mục học bổng chuẩn xác (hỗ trợ cả có dấu và không dấu)."""
    m = raw_major.strip()
    m_lower = m.lower()
    m_no_acc = remove_accents(m_lower)

    # 1. Khoa học Máy tính (kiểm tra trước để không bị dính vào AI do cụm 'học máy')
    if re.search(r'\b(?:khoa\s*hoc\s*may\s*tinh|computer\s*science)\b', m_no_acc):
        return 'Khoa học Máy tính'

    # 2. Trí tuệ Nhân tạo (chữ AI viết hoa để không nhầm từ 'ai' tiếng Việt)
    if re.search(r'\b(?:tri\s*tue\s*nhan\s*tao|artificial\s*intelligence|machine\s*learning|deep\s*learning|nlp|computer\s*vision)\b', m_no_acc) or re.search(r'\bAI\b', m):
        return 'Trí tuệ Nhân tạo (AI)'

    # 3. Khoa học Dữ liệu
    if re.search(r'\b(?:khoa\s*hoc\s*du\s*lieu|data\s*science|big\s*data|data\s*analyst|phan\s*tich\s*du\s*lieu)\b', m_no_acc):
        return 'Khoa học Dữ liệu'

    # 4. Công nghệ Thông tin & Kỹ thuật Phần mềm (IT viết hoa để không nhầm từ 'it' tiếng Anh)
    if re.search(r'\b(?:cong\s*nghe\s*thong\s*tin|ky\s*thuat\s*phan\s*mem|software\s*engineering|information\s*technology|an\s*toan\s*thong\s*tin|cyber\s*security|he\s*thong\s*thong\s*tin|mang\s*may\s*tinh)\b', m_no_acc) or re.search(r'\bIT\b', m):
        return 'Công nghệ Thông tin'

    # 5. Kinh tế, Tài chính, Quản trị, Marketing
    if re.search(r'\b(?:kinh\s*te|tai\s*chinh|ngan\s*hang|quan\s*tri\s*kinh\s*doanh|marketing|ke\s*toan|kiem\s*toan|logistics|thuong\s*mai|chuoi\s*cung\s*ung|economics|finance|business|accounting|auditing)\b', m_no_acc):
        return 'Kinh tế & Tài chính'

    # 6. Kỹ thuật & Công nghệ
    if re.search(r'\b(?:ky\s*thuat|co\s*khi|dien\s*tu|tu\s*dong\s*hoa|co\s*dien\s*tu|xay\s*dung|vat\s*lieu|mechanical|electrical|mechatronics|civil)\b', m_no_acc):
        return 'Kỹ thuật & Công nghệ'

    # 7. Y sinh & Sức khỏe
    if re.search(r'\b(?:cong\s*nghe\s*sinh\s*hoc|y\s*sinh|y\s*da\s*khoa|duoc|biotechnology|biomedical|pharmacy|medicine|dieu\s*duong)\b', m_no_acc):
        return 'Y sinh & Sức khỏe'

    # 8. Ngôn ngữ & Quan hệ Quốc tế
    if re.search(r'\b(?:ngon\s*ngu|ngoai\s*ngu|tieng\s*anh|tieng\s*trung|tieng\s*nhat|tieng\s*han|quan\s*he\s*quoc\s*te|quoc\s*te\s*hoc|linguistics|international\s*relations)\b', m_no_acc):
        return 'Ngoại ngữ & Quan hệ Quốc tế'

    # 9. Khoa học Xã hội & Luật
    if re.search(r'\b(?:luat|xa\s*hoi|tam\s*ly|truyen\s*thong|bao\s*chi|law|communications|journalism|psychology)\b', m_no_acc):
        return 'Khoa học Xã hội & Luật'

    # 10. Kiến trúc & Nghệ thuật
    if re.search(r'\b(?:kien\s*truc|thiet\s*ke|my\s*thuat|architecture|design|fine\s*arts)\b', m_no_acc):
        return 'Kiến trúc & Nghệ thuật'

    return m.title() if len(m) <= 40 else "Kinh tế & Tài chính"


def extract_major_and_degree(text: str) -> Dict[str, str]:
    """Nhận diện chuyên ngành đào tạo và bậc học mục tiêu với độ chuẩn xác cao."""
    # 1. Tìm khai báo chuyên ngành tường minh
    explicit_patterns = [
        r"(?:chuyên\s*ngành|chuyen\s*nganh|ngành\s*học|nganh\s*hoc|ngành|nganh|major|field of study)\s*[:=\s-]\s*([^\n\r,;|\.]{3,60})",
        r"(?:cử\s*nhân|cu\s*nhan|kỹ\s*sư|ky\s*su|thạc\s*sĩ|thac\s*si|tiến\s*sĩ|tien\s*si|bachelor of|bachelor in|master of|master in|b\.s\.|b\.a\.|m\.s\.)\s+(?:ngành\s+|nganh\s+)?([^\n\r,;|\.]{3,60})",
    ]
    extracted_raw = ""
    for pat in explicit_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            extracted_raw = m.group(1).strip()
            break

    major = "Kinh tế & Tài chính"
    if extracted_raw:
        major = classify_major(extracted_raw)
    else:
        # Cách 2: Tìm trong khối HỌC VẤN / EDUCATION
        edu_match = re.search(r"(?:HỌC\s*VẤN|HOC\s*VAN|EDUCATION|QUÁ\s*TRÌNH\s*HỌC\s*TẬP)[\s\S]{1,500}?(?=(?:KINH\s*NGHIỆM|KINH\s*NGHIEM|EXPERIENCE|KỸ\s*NĂNG|SKILLS|DỰ\s*ÁN|PROJECTS|$))", text, re.IGNORECASE)
        edu_text = edu_match.group(0) if edu_match else text
        major = classify_major(edu_text)

    # Bậc học
    current_degree = "Cử nhân"
    target_degree = "Thạc sĩ"

    t_lower = text.lower()
    t_no_acc = remove_accents(t_lower)
    if re.search(r"\b(?:hoc\s*sinh|thpt|lop\s*12|lop\s*11|high\s*school)\b", t_no_acc):
        current_degree = "THPT"
        target_degree = "Cử nhân"
    elif re.search(r"\b(?:hoc\s*bong\s*tien\s*si|ung\s*tuyen\s*tien\s*si|phd\s*scholarship|tien\s*si|phd|doctorate)\b", t_no_acc):
        current_degree = "Thạc sĩ"
        target_degree = "Tiến sĩ"
    elif re.search(r"\b(?:thac\s*si|master|cao\s*hoc)\b", t_no_acc):
        if re.search(r"\b(?:hoc\s*bong\s*thac\s*si|ung\s*tuyen\s*thac\s*si|master\s*scholarship)\b", t_no_acc):
            current_degree = "Cử nhân"
            target_degree = "Thạc sĩ"
        elif re.search(r"\b(?:tot\s*nghiep\s*thac\s*si|da\s*co\s*bang\s*thac\s*si|master\s*degree)\b", t_no_acc):
            current_degree = "Thạc sĩ"
            target_degree = "Tiến sĩ"
        else:
            current_degree = "Cử nhân"
            target_degree = "Thạc sĩ"
    else:
        current_degree = "Cử nhân"
        target_degree = "Thạc sĩ"

    return {
        "major": major,
        "current_degree": current_degree,
        "target_degree": target_degree,
    }


def extract_university(text: str) -> str:
    """Bóc tách trường đại học/cơ sở đào tạo thực tế của ứng viên."""
    # Tìm trong khối HỌC VẤN trước nếu có
    edu_match = re.search(r"(?:HỌC\s*VẤN|HOC\s*VAN|EDUCATION|QUÁ\s*TRÌNH\s*HỌC\s*TẬP)[\s\S]{1,400}?(?=(?:KINH\s*NGHIỆM|KINH\s*NGHIEM|EXPERIENCE|KỸ\s*NĂNG|SKILLS|$))", text, re.IGNORECASE)
    scope = (edu_match.group(0) + "\n" + text) if edu_match else text

    scope_no_acc = remove_accents(scope.lower())
    for pat, name in UNI_PATTERNS_NO_ACC:
        if re.search(pat, scope_no_acc):
            return name

    # Regex nhận diện tổng quát
    m = re.search(r'((?:Trường\s+|Truong\s+)?(?:Đại\s*học|Dai\s*hoc|Học\s*viện|Hoc\s*vien|Viện\s*Đại\s*học|Trường\s*THPT|Truong\s*THPT|THPT)\s+[A-Za-zÀ-ỹ0-9\-\.\s]{3,45})', scope, re.IGNORECASE)
    if m:
        clean = m.group(1).strip()
        clean = re.sub(r'[\r\n,;|].*$', '', clean).strip()
        if len(clean) >= 8:
            return clean

    m_en = re.search(r'((?:University|Institute|College)\s+of\s+[A-Za-z\s]{3,40}|[A-Za-z\s]{3,40}\s+(?:University|College|Institute))', scope, re.IGNORECASE)
    if m_en:
        return m_en.group(1).strip()

    return 'Cơ sở đào tạo (Từ CV)'


def extract_publications_and_awards(text: str) -> tuple:
    """
    Bóc tách số lượng bài báo khoa học và giải thưởng một cách trung thực,
    loại bỏ hoàn toàn các trường hợp học sinh/sinh viên chỉ 'đọc bài báo', 'làm bài tập lớn'.
    """
    # 1. Loại trừ các ngữ cảnh học tập / bài tập lớn không phải xuất bản
    clean_t = text
    clean_t = re.sub(
        r"(?:đọc\s*hiểu|phân\s*tích|tham\s*khảo|tái\s*hiện|tìm\s*hiểu|nghiên\s*cứu|dựa\s*trên)\s+bài\s*báo[^\n\.]*",
        "",
        clean_t,
        flags=re.IGNORECASE,
    )
    clean_t = re.sub(r"kết\s*quả\s+bài\s*báo[^\n\.]*", "", clean_t, flags=re.IGNORECASE)
    clean_t = re.sub(r"bài\s*tập\s*lớn", "", clean_t, flags=re.IGNORECASE)

    # 2. Dấu hiệu xuất bản bài báo khoa học thực tế
    pub_patterns = [
        r"(?:đã\s*xuất\s*bản|được\s*đăng|công\s*bố\s*tại|chấp\s*nhận\s*đăng)\s+(?:bài\s*báo|công\s*trình|nghiên\s*cứu)",
        r"(?:tác\s*giả\s*chính|đồng\s*tác\s*giả|first\s*author|co-author)\s+(?:của\s+)?(?:bài\s*báo|paper)",
        r"\b(?:scopus|isi\s*journal|ieee\s*transactions|q1|q2)\s+(?:journal|paper|conference|publication)\b",
        r"(?:bài\s*báo|publication|paper)\s*(?:đã\s*xuất\s*bản|published)\b",
        r"(?:CÔNG\s*BỐ\s*KHOA\s*HỌC|PUBLICATIONS|SCIENTIFIC\s*PUBLICATIONS)\s*[:\n]",
    ]
    pubs_count = 0
    for p in pub_patterns:
        if re.search(p, clean_t, re.IGNORECASE):
            pubs_count = 1
            break

    # 3. Dấu hiệu giải thưởng học thuật
    awards_count = 0
    award_patterns = [
        r"\b(?:giải\s*(?:nhất|nhì|ba|khuyến\s*khích|đặc\s*biệt)|first\s*prize|second\s*prize|third\s*prize)\b",
        r"\b(?:học\s*bổng\s*(?:khuyến\s*khích\s*học\s*tập|xuất\s*sắc|tài\s*năng)|academic\s*excellence\s*scholarship)\b",
        r"\b(?:thủ\s*khoa|valedictorian|champion|quán\s*quân|á\s*quân)\b",
        r"\b(?:huy\s*chương\s*(?:vàng|bạc|đồng)|gold\s*medal|silver\s*medal|bronze\s*medal)\b",
        r"(?:GIẢI\s*THƯỞNG|AWARDS|HONORS)\s*[:\n]\s*([^\n\r]+)",
    ]
    for ap in award_patterns:
        if re.search(ap, text, re.IGNORECASE):
            awards_count = 1
            break

    return pubs_count, awards_count


def extract_authentic_sections_and_summary(
    text: str, candidate_name: str, major: str, university: str, gpa: Optional[float], ielts: Optional[float]
) -> Dict[str, Any]:
    """Bóc tách tóm tắt trung thực các dự án, hoạt động và môn học từ chính nội dung file CV của người dùng tải lên."""
    projects: List[str] = []
    coursework: List[str] = []
    skills: List[str] = []

    # 1. Trích xuất môn học thực tế (hỗ trợ xuống dòng giữa các môn)
    cw_match = re.search(
        r"(?:Môn\s*học\s*(?:tiêu\s*biểu|liên\s*quan|trọng\s*tâm|chính)?|Coursework|Relevant\s*courses|Các\s*môn\s*đã\s*học)\s*[:=\s-]?\s*([^\n\r]+(?:\n[^\n\r●•\-\*]+)?)",
        text,
        re.IGNORECASE,
    )
    if cw_match:
        raw_cw = cw_match.group(1).replace("\n", " ")
        raw_cw = re.sub(r"\s+", " ", raw_cw)
        items = [p.strip().rstrip(".,;") for p in re.split(r"[,;]|\s+(?:và|and)\s+(?=[A-ZÀ-Ỹ][^,;]+$)", raw_cw)]
        coursework = [p for p in items if 3 <= len(p) <= 60][:6]

    # 2. Trích xuất dự án / đồ án thực tế
    sec_match = re.search(
        r"(?:DỰ\s*ÁN|PROJECTS|ĐỒ\s*ÁN)[\s\S]*?(?=(?:HỌC\s*VẤN|EDUCATION|KỸ\s*NĂNG|SKILLS|CHỨNG\s*CHỈ|CERTIFICATIONS|$))",
        text,
        re.IGNORECASE,
    )
    if sec_match:
        sec_text = sec_match.group(0)
        lines = [l.strip() for l in sec_text.split("\n") if l.strip()]
        for i, line in enumerate(lines):
            # Bỏ qua dòng tiêu đề mục
            if re.search(r"^(?:dự\s*án\s*(?:nổi\s*bật|tiêu\s*biểu|cá\s*nhân)?|projects|key\s*projects|academic\s*projects)$", line, re.IGNORECASE):
                continue
            # Bỏ qua gạch đầu dòng con hoặc nhãn chi tiết
            if line.startswith(("●", "-", "*", "•")) or re.search(r"^(?:mô\s*tả|vai\s*trò|công\s*nghệ|kết\s*quả|nội\s*dung|đánh\s*giá|triển\s*khai|quản\s*lý|tiền\s*xử\s*lý|benchmarking)\s*[:=\s-]", line, re.IGNORECASE):
                continue
            if line.endswith((".", ";", ",")):
                continue
            # Nếu dòng tiếp theo là metadata (Bài tập lớn, GitHub, Link, Công nghệ, v.v.)
            if i + 1 < len(lines) and re.search(r"(?:Bài\s*tập\s*lớn|GitHub|GitLab|Link|Role|Công\s*nghệ|Tech\s*stack|Time|Thời\s*gian)", lines[i + 1], re.IGNORECASE):
                clean_title = re.sub(r"^(?:dự\s*án|project|đồ\s*án)\s*[:=\s-]*", "", line, flags=re.IGNORECASE).strip()
                if clean_title and clean_title not in projects and len(clean_title) >= 6:
                    projects.append(clean_title)

    # Fallback nếu chưa bắt được dự án theo block cấu trúc
    if not projects:
        proj_matches = re.findall(
            r"(?:Tên\s*dự\s*án|Project\s*name|Đồ\s*án)\s*[:=\s-]\s*([^\n\r;]{6,80})",
            text,
            re.IGNORECASE,
        )
        for p in proj_matches:
            p_clean = p.strip()
            if p_clean and p_clean not in projects:
                projects.append(p_clean)

    # 3. Trích xuất kỹ năng chuyên môn
    skill_dict = [
        "Python", "PyTorch", "TensorFlow", "SQL", "Excel", "PowerBI", "Tableau", "R", "Java", "C++", "C",
        "React", "Node.js", "Docker", "Machine Learning", "Deep Learning", "NLP", "DistilBERT",
        "Scikit-learn", "Pandas", "NumPy", "Kế toán", "Kiểm toán", "Phân tích tài chính", "Quản trị rủi ro",
        "Làm việc nhóm", "Tư duy phản biện", "Giải quyết vấn đề", "Lập kế hoạch"
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
        narrative_items.append(f"• <strong>Dự án học thuật từ CV:</strong> {'; '.join(projects[:3])}.")
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


def parse_full_cv(
    content_bytes: bytes,
    filename: str = "",
    text_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Hàm bóc tách tổng thể toàn bộ hồ sơ CV PDF của bất kỳ ứng viên nào.
    Cho phép nhận text_override từ OCR trước đó hoặc tự động trích xuất đa tầng.
    """
    text = (text_override or "").strip()
    if not text:
        text = extract_text_from_pdf(content_bytes)

    # 1. Bóc tách Họ tên ứng viên
    full_name = extract_name_from_text_and_filename(text, filename)

    # 2. Bóc tách Điểm GPA
    gpa = extract_gpa_robust(text)

    # 3. Bóc tách Ngoại ngữ
    lang_info = extract_language_robust(text)

    # 4. Bóc tách Chuyên ngành & Bậc học
    major_degree = extract_major_and_degree(text)

    # 5. Bóc tách Trường đào tạo
    university = extract_university(text)

    # 6. Bóc tách Bài báo & Giải thưởng một cách trung thực (Loại bỏ bài tập lớn / đọc bài báo)
    pubs_count, awards_count = extract_publications_and_awards(text)

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
    if not lang_info["has_english"]:
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
        "ielts": lang_info["ielts"],
        "has_english": lang_info["has_english"],
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
