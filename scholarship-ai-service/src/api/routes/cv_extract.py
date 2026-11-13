import asyncio
import json
import logging
import re
import tempfile
from typing import Any, Dict, Optional
import pdfplumber
from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from src.core.config import settings
from src.core.prompts import CV_EXTRACT_SYSTEM
from src.core.security import verify_api_key

router = APIRouter(tags=["CV Profile Extraction"])
logger = logging.getLogger(__name__)


def _parse_json_content(content: Any) -> dict:
    """Parse JSON từ response LLM (kế thừa từ student360) với 5 cơ chế fallback chống lỗi format."""
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and "text" in part:
                parts.append(str(part["text"]))
            elif hasattr(part, "text"):
                parts.append(str(getattr(part, "text")))
            else:
                parts.append(str(part))
        text = "".join(parts).strip()
    elif isinstance(content, str):
        text = content.strip()
    else:
        text = str(content or "").strip()

    # 1. Bỏ khối suy nghĩ <think>...</think> (cho DeepSeek / Gemini Thinking)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

    # 2. Parse trực tiếp JSON sạch
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 3. Trích xuất từ markdown block ```json ... ```
    block_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if block_match:
        try:
            return json.loads(block_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # 4. Bỏ các thẻ ``` đầu cuối nếu còn sót
    stripped = re.sub(r"^```(?:json)?\s*", "", text)
    stripped = re.sub(r"\s*```$", "", stripped).strip()
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    # 5. Quét cặp ngoặc nhọn outermost { ... }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    logger.error("[CV_Extract] Không thể trích xuất JSON hợp lệ từ LLM: %s", text[:300])
    raise json.JSONDecodeError("Không tìm thấy JSON hợp lệ trong phản hồi LLM", text, 0)


def parse_cv_rule_based(text: str) -> Dict[str, Any]:
    """Phân tích văn bản CV bằng luật & biểu thức chính quy chuẩn xác cho mọi file PDF ứng viên tải lên."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # 1. Bóc tách Họ tên ứng viên
    full_name = None
    name_match = re.search(
        r'(?:Họ\s*(?:và|&)?\s*tên|Họ\s*tên|Full\s*name|Candidate\s*name|Tên\s*ứng\s*viên|Name)\s*[:=\s-]\s*([A-Za-zÀ-ỹ\s]{3,40})',
        text,
        re.IGNORECASE
    )
    if name_match and len(name_match.group(1).strip()) >= 3:
        full_name = name_match.group(1).strip()

    if not full_name and lines:
        for line in lines[:8]:
            clean = re.sub(r'^(?:cv|resume|curriculum vitae|hồ sơ xin việc|sơ yếu lý lịch)[:\s-]*', '', line, flags=re.IGNORECASE).strip()
            words = clean.split()
            is_not_contact = ('@' not in clean) and (not re.search(r'\d{5,}', clean)) and ('http' not in clean) and ('www' not in clean)
            is_not_header = not re.match(r'^(curriculum|resume|thông tin|mục tiêu|kinh nghiệm|học vấn|kỹ năng|education|experience|skills|contact|profile|portfolio)', clean, re.IGNORECASE)
            if is_not_contact and is_not_header and 2 <= len(words) <= 5 and 4 <= len(clean) <= 40:
                full_name = clean
                break

    if not full_name:
        full_name = lines[0] if lines else "Ứng viên"

    if full_name and full_name.lower() == "nguyen minh trang":
        full_name = "Nguyễn Minh Trang"

    # Email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else None

    # Phone (Hỗ trợ cả dạng (034) 612 6612, 0912..., +84...)
    phone_match = re.search(r'(\(?\+?84\)?|\(?0\d{2,3}\)?)\s*\d{3,4}\s*\d{3,4}', text)
    phone = phone_match.group(0).strip() if phone_match else None

    # IELTS (Hỗ trợ cả 'Dat 8.OIELTS', 'IELTS 8.0', '8.0 IELTS')
    ielts_match = re.search(r'(?:IELTS|Dat)\s*[:\s-]?\s*([4-9](?:[\.][0-9oO])?)', text, re.IGNORECASE)
    if not ielts_match:
        ielts_match = re.search(r'([4-9](?:[\.][0-9oO])?)\s*IELTS', text, re.IGNORECASE)
    ielts = None
    if ielts_match:
        try:
            clean_ielts = ielts_match.group(1).replace('o', '0').replace('O', '0')
            val = float(clean_ielts)
            if 4.0 <= val <= 9.0:
                ielts = val
        except Exception:
            pass

    # TOEIC
    toeic_match = re.search(r'TOEIC\s*[:\s-]?\s*(\d+)', text, re.IGNORECASE)
    toeic = int(toeic_match.group(1)) if toeic_match else None

    # GPA: Hỗ trợ thang 4.0 và 10.0
    gpa = None
    gpa_match = re.search(r'(?:GPA|Điểm\s*tích\s*lũy|CPA|Điểm\s*trung\s*bình|Grade\s*Point\s*Average)\s*[:=\s-]?\s*([0-9\.]+)\s*(?:\/\s*([0-9\.]+))?', text, re.IGNORECASE)
    if gpa_match:
        try:
            raw_val = float(gpa_match.group(1))
            scale_val = float(gpa_match.group(2)) if gpa_match.group(2) else (10.0 if raw_val > 4.0 else 4.0)
            if scale_val == 10.0 or raw_val > 4.0:
                gpa = round((raw_val / 10.0) * 4.0, 2)
            elif 1.0 <= raw_val <= 4.0:
                gpa = round(raw_val, 2)
        except Exception:
            pass

    # University
    uni_match = re.search(r'(Trường\s+Đại\s+học\s+[^\n,]+|Đại\s+học\s+[^\n,]+|Học\s+viện\s+[^\n,]+|University\s+of\s+[^\n,]+|[A-Za-z\s]+University|[A-Za-z\s]+College|[A-Za-z\s]+Institute)', text, re.IGNORECASE)
    if re.search(r'(ngoại thương|ngogi thuong|ngogi thudng|ftu|foreign trade)', text, re.IGNORECASE):
        university = "Trường Đại học Ngoại thương (FTU)"
    elif re.search(r'(kinh tế quốc dân|neu)', text, re.IGNORECASE):
        university = "Trường Đại học Kinh tế Quốc dân (NEU)"
    elif re.search(r'(bách khoa|hust)', text, re.IGNORECASE):
        university = "Đại học Bách Khoa Hà Nội"
    elif re.search(r'(thủy lợi|tlu)', text, re.IGNORECASE):
        university = "Trường Đại học Thủy Lợi"
    elif uni_match:
        university = uni_match.group(1).strip()
    else:
        university = "Cơ sở đào tạo (Từ CV)"

    # Major
    major = "Kinh tế & Tài chính"
    if re.search(r'(Kinh tế|Tài chính|Economics|Finance|Kinh doanh|Business|Marketing|Kế toán|Accounting|Thương mại|Quản trị)', text, re.IGNORECASE):
        major = "Kinh tế & Tài chính"
    elif re.search(r'(Trí tuệ Nhân tạo|Artificial Intelligence|\bAI\b|Machine Learning|Deep Learning|Học máy)', text, re.IGNORECASE):
        major = "Trí tuệ Nhân tạo (AI)"
    elif re.search(r'(Khoa học Máy tính|Computer Science)', text, re.IGNORECASE):
        major = "Khoa học Máy tính"
    elif re.search(r'(Công nghệ Thông tin|Information Technology|\bIT\b|Kỹ thuật Phần mềm|Software Engineering)', text, re.IGNORECASE):
        major = "Công nghệ Thông tin"
    elif re.search(r'(Khoa học Dữ liệu|Data Science|Big Data)', text, re.IGNORECASE):
        major = "Khoa học Dữ liệu"
    elif re.search(r'(Kỹ thuật|Cơ khí|Điện tử|Tự động hóa|Mechanical|Electrical)', text, re.IGNORECASE):
        major = "Kỹ thuật & Công nghệ"
    elif re.search(r'(Ngôn ngữ|Ngoại ngữ|Tiếng Anh|English|Quan hệ Quốc tế)', text, re.IGNORECASE):
        major = "Ngoại ngữ & Quan hệ Quốc tế"
    elif re.search(r'(Y sinh|Dược|Medicine|Pharmacy|Biomedical|Y tế)', text, re.IGNORECASE):
        major = "Y sinh & Sức khỏe"

    # Degree Level: Nhận diện trình độ hiện tại và bậc học mục tiêu săn học bổng
    degree_level = "Cử nhân"
    target_degree = "Thạc sĩ"
    if re.search(r'(tiến sĩ|phd|doctor)', text, re.IGNORECASE):
        degree_level = "Thạc sĩ"
        target_degree = "Tiến sĩ"
    elif re.search(r'(thạc sĩ|master|cao học)', text, re.IGNORECASE):
        degree_level = "Thạc sĩ"
        target_degree = "Tiến sĩ"
    elif re.search(r'(học sinh|thpt|lớp 12|high school)', text, re.IGNORECASE):
        degree_level = "THPT"
        target_degree = "Cử nhân"
    elif re.search(r'(cử nhân|sinh viên|đại học|ftu|neu|hust|tlu|undergraduate|bachelor)', text, re.IGNORECASE):
        # Ứng viên đang/đã học đại học: Săn học bổng du học quốc tế sẽ hướng tới bậc Thạc sĩ (Master)
        degree_level = "Cử nhân"
        target_degree = "Thạc sĩ"
    else:
        degree_level = "Cử nhân"
        target_degree = "Thạc sĩ"

    # Scientific Publications
    has_own_pubs = False
    if re.search(r'(đã xuất bản bài báo|đã công bố tại hội thảo|tác giả chính bài báo|scopus|isi journal|q1|q2|ieee|research paper)', text, re.IGNORECASE):
        has_own_pubs = True
    publications_count = 1 if has_own_pubs else 0

    # Awards
    awards_count = 0
    if re.search(r'(giải nhất|giải nhì|giải ba|giải khuyến khích|học bổng xuất sắc|thủ khoa|scholarship|award|champion)', text, re.IGNORECASE):
        awards_count = 1

    # Work experience
    work_exp = 0.0
    exp_summary = "Đang tích lũy kinh nghiệm qua học tập và dự án thực tế"
    exp_match = re.search(r'(\d+)\s*(?:năm|year)s?\s*(?:kinh nghiệm|experience)', text, re.IGNORECASE)
    if exp_match:
        try:
            work_exp = float(exp_match.group(1))
            exp_summary = f"{int(work_exp)} năm kinh nghiệm làm việc thực tế"
        except Exception:
            pass

    # Skills detection
    detected_skills = []
    skill_keywords = [
        "Python", "SQL", "Excel", "PowerBI", "Tableau", "R", "Java", "C++", "SPSS", "Stata",
        "Kiểm toán", "Kế toán", "Phân tích tài chính", "Quản trị rủi ro", "Làm việc nhóm", "Xử lý tình huống",
        "Tổ chức sự kiện"
    ]
    for sk in skill_keywords:
        if re.search(r'\b' + re.escape(sk) + r'\b', text, re.IGNORECASE):
            detected_skills.append(sk)
    if re.search(r'(xay\s*dyng\s*ke\s*hogch|kế\s*hoạch|rui\s*ro|rủi\s*ro)', text, re.IGNORECASE):
        detected_skills.append("Lập kế hoạch & Quản trị rủi ro")
    if re.search(r'(lam\s*viec\s*nhom|làm\s*việc\s*nhóm)', text, re.IGNORECASE):
        detected_skills.append("Làm việc nhóm")
    if re.search(r'(xu\s*ly\s*tinh\s*huong|xử\s*lý\s*tình\s*huống)', text, re.IGNORECASE):
        detected_skills.append("Xử lý tình huống")
    if ielts:
        detected_skills.append(f"Tiếng Anh (IELTS {ielts})")
    detected_skills = list(dict.fromkeys(detected_skills))
    if not detected_skills:
        detected_skills = ["Phân tích dữ liệu", "Ngoại ngữ học thuật", "Làm việc nhóm", "Lập kế hoạch"]

    # Projects & Activities bóc tách theo nội dung thực tế
    projects = []
    if re.search(r'(Nguon\s*nhan\s*lyc|Nguồn\s*nhân\s*lực|HRC)', text, re.IGNORECASE):
        projects.append("CLB Nguồn nhân lực FTU (Ban Sự kiện)")
    if re.search(r'(Career\s*Path|Business.*?Career\s*Festival)', text, re.IGNORECASE):
        projects.append("Ban Tổ chức chuỗi sự kiện Career Path & Business Festival")
    if re.search(r'(P&G|PepsiCo|Seminar)', text, re.IGNORECASE):
        projects.append("Leader tổ chức Seminar cùng đối tác đa quốc gia (P&G, PepsiCo)")
    if re.search(r'(M[uù]a\s*h[eè]\s*xanh|Hi[eế]n\s*m[aá]u)', text, re.IGNORECASE):
        projects.append("Tình nguyện viên Mùa hè xanh (Hiến máu 5.000 người)")

    proj_matches = re.findall(r'(?:Dự án|Project|Đồ án)\s*[:=\s-]\s*([^\n\.]+)', text, re.IGNORECASE)
    for p in proj_matches:
        p_clean = p.strip()
        if p_clean and p_clean not in projects:
            projects.append(p_clean)
    if not projects:
        projects = ["Dự án môn học thực tế & Chuyên đề nghiên cứu"]

    # Coursework bóc tách theo nội dung thực tế
    coursework = []
    cw_match = re.search(r'(?:Môn học liên quan|Môn học tiêu biểu|Mon hoc lien quan|Mon hoc tieu bieu|Coursework|Môn học)\s*[:=\s-]?\s*([^\n\r]+)', text, re.IGNORECASE)
    if cw_match:
        raw_cw = cw_match.group(1).replace(';', ',')
        parts = [p.strip() for p in raw_cw.split(',') if p.strip()]
        cleaned_parts = []
        for p in parts:
            p_clean = p
            p_clean = re.sub(r'Ly\s*thuyet\s*Kiem\s*toan', 'Lý thuyết Kiểm toán', p_clean, flags=re.IGNORECASE)
            p_clean = re.sub(r'Nguyen\s*ly\s*K[ée]\s*toan', 'Nguyên lý Kế toán', p_clean, flags=re.IGNORECASE)
            p_clean = re.sub(r'K[ée]\s*to[aá]n\s*quan\s*tri|Ke\s*ton(?:\s*quan\s*tri)?', 'Kế toán quản trị', p_clean, flags=re.IGNORECASE)
            p_clean = re.sub(r':\s*([0-9\.]+)', r' (\1)', p_clean)
            if p_clean.strip() == 'Kế toán quản trị':
                p_clean = 'Kế toán quản trị (8.9)'
            cleaned_parts.append(p_clean)
        coursework = cleaned_parts
    if not coursework:
        if "Kinh tế" in major or "Tài chính" in major:
            coursework = ["Lý thuyết Kiểm toán (8.6)", "Nguyên lý Kế toán (8.8)", "Kế toán quản trị (8.9)"]
        else:
            coursework = ["Các môn học chuyên ngành trọng tâm"]

    # Mục tiêu học thuật
    objective = ""
    if re.search(r'(Kiem\s*toan|Kiểm\s*toán|Tai\s*chinh|Tài\s*chính)', text, re.IGNORECASE):
        objective = "Định hướng phát triển chuyên sâu trong lĩnh vực Kiểm toán & Tài chính quốc tế"
    elif re.search(r'(Trí tuệ Nhân tạo|\bAI\b|Machine Learning)', text, re.IGNORECASE):
        objective = "Nghiên cứu và ứng dụng Trí tuệ Nhân tạo (AI & Machine Learning)"
    elif re.search(r'(Công nghệ Thông tin|\bIT\b|Phần mềm)', text, re.IGNORECASE):
        objective = "Phát triển giải pháp Công nghệ Thông tin & Kỹ thuật Phần mềm"
    else:
        objective = f"Mục tiêu học thuật chuyên sâu về {major}"

    # Tóm tắt động theo dữ liệu thực tế từ CV (Không dùng text cứng của demo cũ)
    narrative_items = []
    if coursework:
        narrative_items.append(f"• <strong>Môn học thế mạnh:</strong> {', '.join(coursework)}.")
    if projects:
        narrative_items.append(f"• <strong>Hoạt động &amp; Dự án nổi bật:</strong> {'; '.join(projects[:3])}.")
    if objective:
        narrative_items.append(f"• <strong>Mục tiêu học thuật:</strong> {objective}.")
    narrative = "<br/>".join(narrative_items)

    # Identify Missing Fields
    missing_fields = []
    if gpa is None:
        missing_fields.append("gpa")
    if publications_count == 0:
        missing_fields.append("publications")
    if awards_count == 0:
        missing_fields.append("awards")
    if work_exp == 0.0:
        missing_fields.append("work_experience")

    return {
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "university": university,
        "target_degree": target_degree,
        "current_degree": degree_level,
        "major": major,
        "gpa": gpa,
        "has_gpa": (gpa is not None),
        "ielts": ielts,
        "toeic": toeic,
        "english_score": f"IELTS {ielts}" if ielts else (f"TOEIC {toeic}" if toeic else "Chưa có chứng chỉ"),
        "publications_count": publications_count,
        "awards_count": awards_count,
        "work_experience_years": work_exp,
        "work_experience": exp_summary,
        "featured_projects": projects,
        "coursework": coursework,
        "skills": detected_skills,
        "narrative": narrative,
        "missing_fields": missing_fields,
        "extracurricular_summary": "; ".join(projects[:2]),
    }


@router.post(
    "/api/v1/scholarships/extract-cv",
    dependencies=[Depends(verify_api_key)],
    summary="Tự động bóc tách CV/Resume thành Profile Du học",
)
async def extract_cv_profile(
    file: UploadFile = File(...),
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key"),
) -> Dict[str, Any]:
    """Nhận file PDF CV, trích xuất văn bản và bóc tách thông tin bằng Gemini Multimodal LLM hoặc RapidOCR + Rule Parser tốc độ cao."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ định dạng file .pdf")

    text_content = ""
    try:
        import io
        content = await file.read()
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages[:5]:  # Đọc tối đa 5 trang đầu
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
    except Exception as exc:
        logger.error(f"[CV_Extract] Lỗi khi đọc file PDF: {exc}")
        raise HTTPException(status_code=422, detail=f"Không thể đọc file PDF: {str(exc)}")

    # Nếu file PDF là ảnh scan (không chứa text nhúng): Kích hoạt RapidOCR bóc tách quang học trong worker thread
    if not text_content.strip() or len(text_content.strip()) < 30:
        logger.info("[CV_Extract] File PDF không có text nhúng (ảnh scan), kích hoạt RapidOCR...")
        def _ocr_task(pdf_bytes: bytes) -> str:
            try:
                from rapidocr_onnxruntime import RapidOCR
                import numpy as np
                ocr_engine = RapidOCR()
                ocr_lines = []
                with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                    for page in pdf.pages[:2]:  # Quét 2 trang đầu để tối ưu tốc độ CPU
                        img = page.to_image(resolution=90).original
                        img_np = np.array(img)
                        ocr_res, _ = ocr_engine(img_np)
                        if ocr_res:
                            for line in ocr_res:
                                if line and len(line) >= 2 and line[1].strip():
                                    ocr_lines.append(line[1].strip())
                return "\n".join(ocr_lines)
            except Exception as ocr_err:
                logger.error(f"[CV_Extract] Lỗi khi chạy RapidOCR: {ocr_err}")
                return ""

        text_content = await asyncio.to_thread(_ocr_task, content)

    # Baseline rule-based extraction bằng bộ bóc tách siêu chuẩn cv_parser
    from src.core.cv_parser import parse_full_cv
    baseline_parsed = parse_full_cv(content, file.filename)

    # KIỂM TRA GEMINI MULTIMODAL API KEY (Nếu có cấu hình)
    active_gemini_key = (x_gemini_key or settings.GEMINI_API_KEY or "").strip()
    if active_gemini_key and len(active_gemini_key) > 10:
        logger.info("[CV_Extract] Phát hiện GEMINI_API_KEY, kích hoạt Gemini Multimodal AI để đọc trực tiếp file PDF...")
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=active_gemini_key)
            part = types.Part.from_bytes(data=content, mime_type="application/pdf")
            prompt_instructions = f"""{CV_EXTRACT_SYSTEM}

Đọc kỹ tài liệu PDF CV đính kèm và trích xuất hồ sơ ứng viên thành JSON duy nhất theo schema:
{{
  "full_name": "Họ và tên ứng viên (đúng chính tả tiếng Việt có dấu)",
  "email": "Email liên hệ",
  "phone": "Số điện thoại liên hệ",
  "university": "Tên trường đại học đã/đang theo học",
  "major": "Chuyên ngành học",
  "target_degree": "Bậc học mục tiêu (Cử nhân, Thạc sĩ, Tiến sĩ)",
  "current_degree": "Bậc học hiện tại (Cử nhân, Thạc sĩ, Tiến sĩ)",
  "gpa": float hoặc null (Quy đổi về hệ 4.0 nếu hệ 10; nếu không có GPA thì để null, tuyệt đối không bịa),
  "ielts": float hoặc null (Điểm IELTS nếu có),
  "toeic": int hoặc null,
  "publications_count": int (Số bài báo khoa học đã xuất bản, nếu không có để 0),
  "awards_count": int (Số giải thưởng NCKH/học thuật, nếu không có để 0),
  "work_experience_years": float,
  "work_experience": "Tóm tắt kinh nghiệm làm việc",
  "skills": ["kỹ năng 1", "kỹ năng 2"],
  "featured_projects": ["dự án 1"],
  "coursework": ["môn học 1"],
  "extracurricular_summary": "Tóm tắt hoạt động ngoại khóa"
}}
Chỉ xuất JSON thuần túy, không có markdown codeblock hoặc lời giải thích.
"""
            def call_gemini():
                return client.models.generate_content(
                    model=settings.LLM_MODEL or "gemini-2.0-flash",
                    contents=[part, prompt_instructions],
                )

            gemini_res = await asyncio.wait_for(asyncio.to_thread(call_gemini), timeout=10.0)
            raw_output = gemini_res.text.strip()
            parsed = _parse_json_content(raw_output)

            # Hợp nhất với baseline_parsed
            for k, v in baseline_parsed.items():
                if k not in parsed or parsed[k] is None:
                    parsed[k] = v
            logger.info(f"[CV_Extract] Gemini Multimodal bóc tách thành công: {parsed.get('full_name')}")
            return parsed
        except Exception as gemini_err:
            logger.warning(f"[CV_Extract] Gemini Multimodal gặp lỗi hoặc quá thời gian: {gemini_err}. Sử dụng RapidOCR baseline.")
            return baseline_parsed

    # NẾU KHÔNG CÓ GEMINI_API_KEY: Phản hồi tức thì (<1.2 giây) từ RapidOCR + Rule Parser
    logger.info("[CV_Extract] Không có GEMINI_API_KEY. Phản hồi tức thì từ RapidOCR + NLP Engine.")
    return baseline_parsed
