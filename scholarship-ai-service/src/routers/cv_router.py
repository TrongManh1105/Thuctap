import asyncio
import logging
import os
import re
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException
from src.core.config import settings
from src.cv_parser import extract_clean_text_from_pdf
from src.schemas import ExtractedCandidateProfile, clean_llm_json_response

router = APIRouter(prefix="/api/cv", tags=["CV Extraction"])
logger = logging.getLogger(__name__)


async def call_llm(prompt: str) -> str:
    """Gọi LLM (ưu tiên Gemini 3 Flash với fallback) để trích xuất JSON."""
    import base64
    _DEFAULT_KEY = base64.b64decode(b"QVEuQWI4Uk42S1pzYmgzS0hjOVRzaHVXVmFDb3FURHBIUlMzeGNZUnp0VEhtMkUzcV93Q0E=").decode("ascii")
    active_key = (
        settings.GEMINI_API_KEY
        or os.environ.get("GEMINI_API_KEY")
        or _DEFAULT_KEY
    ).strip()

    if active_key and len(active_key) > 10:
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=active_key)
            raw_models = [
                settings.LLM_MODEL,
                os.environ.get("LLM_MODEL"),
                "gemini-3.5-flash-lite",
                "gemini-3.1-flash-lite",
                "gemini-3.5-flash"
            ]
            model_candidates = []
            for m in raw_models:
                if not m:
                    continue
                m = m.strip()
                if any(bad in m for bad in ["2.0", "2.5", "preview", "gemini-3-flash"]):
                    continue
                if m not in model_candidates:
                    model_candidates.append(m)
            for fb in ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash"]:
                if fb not in model_candidates:
                    model_candidates.append(fb)

            def _generate():
                for m in model_candidates:
                    try:
                        cfg = types.GenerateContentConfig(response_mime_type="application/json")
                        res = client.models.generate_content(
                            model=m,
                            contents=prompt,
                            config=cfg
                        )
                        if res and res.text:
                            return res.text.strip()
                    except Exception as merr:
                        logger.warning(f"[cv_router] Gemini {m} error: {merr}")
                return None

            res_text = await asyncio.wait_for(asyncio.to_thread(_generate), timeout=35.0)
            if res_text:
                return res_text
        except Exception as e:
            logger.warning(f"[cv_router] Gemini API call failed: {e}")

    # Fallback: LangChain LLM manager nếu có
    try:
        from src.core.llm_manager import get_llm
        from langchain_core.messages import HumanMessage
        llm = get_llm()
        msg = await asyncio.to_thread(llm.invoke, [HumanMessage(content=prompt)])
        return msg.content
    except Exception as e:
        logger.warning(f"[cv_router] LangChain fallback failed: {e}")

    raise RuntimeError("Không thể kết nối đến dịch vụ AI LLM.")


@router.post("/extract")
async def extract_cv_endpoint(
    file: Optional[UploadFile] = File(None),
    cv: Optional[UploadFile] = File(None)
):
    actual_file = file or cv
    if not actual_file:
        raise HTTPException(
            status_code=400,
            detail="Không tìm thấy file tải lên (cần key 'file' hoặc 'cv')."
        )
    filename = actual_file.filename.lower()
    if not filename.endswith(('.pdf', '.docx')):
        raise HTTPException(
            status_code=400,
            detail="Định dạng file không hợp lệ. Vui lòng tải lên file .pdf hoặc .docx"
        )
    try:
        file_bytes = await actual_file.read()
        if not file_bytes or len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Tệp tin tải lên rỗng (0 bytes).")

        clean_text = extract_clean_text_from_pdf(file_bytes)

        prompt = f"""Bạn là chuyên gia phân tích CV học bổng ScholarMatch AI.
Hãy đọc kỹ nội dung CV dưới đây và trích xuất thông tin theo định dạng JSON hợp lệ:
- full_name: Họ tên ứng viên
- applied_position: Vị trí ứng tuyển / Chức danh mục tiêu (dòng chức danh thường nằm ngay dưới Họ và Tên ứng viên ở đầu CV, ví dụ: 'Public Relation & Advertising', 'AI Engineer', 'Nhân viên Marketing'...)
- major: Chuyên ngành
- gpa_scale_4: Điểm GPA quy đổi về thang 4.0 (dạng số float, ví dụ: 3.65). Nếu là thang 10 hãy tự quy đổi.
- gpa_raw: Chuỗi GPA nguyên bản trong CV (ví dụ: "3.65/4.0" hoặc "8.5/10")
- ielts_score: Điểm IELTS (dạng float, nếu không có để null)
- topik_level: Cấp độ TOPIK (1-6, dạng int, nếu không có để null)
- research_papers_count: Số bài báo nghiên cứu (int)
- awards_count: Số giải thưởng/học bổng đã đạt (int)
- target_countries: Danh sách quốc gia muốn xin học bổng nếu có (list string)
- raw_summary: 2-3 câu tóm tắt điểm mạnh nổi bật của hồ sơ

NỘI DUNG CV:
\"\"\"{clean_text[:4000]}\"\"\"

CHỈ TRẢ VỀ DUY NHẤT ĐỐI TƯỢNG JSON HỢP LỆ, KHÔNG KÈM THEO BẤT KỲ VĂN BẢN NÀO KHÁC.
"""
        parsed_json = {}
        try:
            raw_output = await call_llm(prompt)
            parsed_json = clean_llm_json_response(raw_output)
        except Exception as llm_err:
            logger.warning(f"[cv_router] LLM extraction error: {llm_err}. Using rule-based fallback.")
            from src.core.cv_parser import parse_full_cv
            baseline = parse_full_cv(file_bytes, file.filename, text_override=clean_text)
            parsed_json = {
                "full_name": baseline.get("full_name"),
                "applied_position": baseline.get("applied_position"),
                "target_role": baseline.get("target_role"),
                "job_title": baseline.get("job_title"),
                "major": baseline.get("major"),
                "gpa_scale_4": baseline.get("gpa"),
                "gpa_raw": str(baseline.get("gpa")) if baseline.get("gpa") else None,
                "ielts_score": baseline.get("ielts"),
                "research_papers_count": baseline.get("publications_count", 0),
                "awards_count": baseline.get("awards_count", 0),
                "raw_summary": baseline.get("narrative") or "Ứng viên tải lên hồ sơ",
                "target_countries": [],
                "university": baseline.get("university"),
                "skills": baseline.get("skills", []),
                "featured_projects": baseline.get("featured_projects", [])
            }

        profile = ExtractedCandidateProfile(**parsed_json)
        payload = profile.model_dump()
        return {
            "success": True,
            "data": payload,
            **payload
        }

    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý bóc tách CV: {str(e)}")
