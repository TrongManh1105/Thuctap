import json
import logging
import tempfile
from typing import Any, Dict
import pdfplumber
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from langchain_core.messages import HumanMessage, SystemMessage
from src.core.llm_manager import get_llm
from src.core.prompts import CV_EXTRACT_SYSTEM
from src.core.security import verify_api_key

router = APIRouter(tags=["CV Profile Extraction"])
logger = logging.getLogger(__name__)


@router.post(
    "/api/v1/scholarships/extract-cv",
    dependencies=[Depends(verify_api_key)],
    summary="Tự động bóc tách CV/Resume thành Profile Du học",
)
async def extract_cv_profile(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Nhận file PDF CV, trích xuất văn bản và dùng LLM chuyển đổi thành JSON chuẩn hóa."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ định dạng file .pdf")

    text_content = ""
    try:
        with tempfile.NamedTemporaryFile(delete=True, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp.flush()

            with pdfplumber.open(tmp.name) as pdf:
                for page in pdf.pages[:5]:  # Đọc tối đa 5 trang đầu
                    page_text = page.extract_text()
                    if page_text:
                        text_content += page_text + "\n"
    except Exception as exc:
        logger.error(f"[CV_Extract] Lỗi khi đọc file PDF: {exc}")
        raise HTTPException(status_code=422, detail=f"Không thể đọc file PDF: {str(exc)}")

    if not text_content.strip():
        raise HTTPException(status_code=422, detail="File PDF không chứa văn bản có thể trích xuất.")

    try:
        llm = get_llm()
        messages = [
            SystemMessage(content=CV_EXTRACT_SYSTEM),
            HumanMessage(content=f"RAW CV TEXT:\n{text_content[:6000]}"),
        ]
        response = await llm.ainvoke(messages)
        raw_output = response.content.strip()

        # Làm sạch chuỗi markdown ```json nếu có
        clean_json = raw_output
        if clean_json.startswith("```"):
            clean_json = clean_json.split("\n", 1)[1]
        if clean_json.endswith("```"):
            clean_json = clean_json.rsplit("\n", 1)[0]
        clean_json = clean_json.replace("```json", "").replace("```", "").strip()

        parsed = json.loads(clean_json)
        return parsed
    except Exception as exc:
        logger.error(f"[CV_Extract] Lỗi parse LLM: {exc}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi trích xuất thông tin từ CV: {str(exc)}")
