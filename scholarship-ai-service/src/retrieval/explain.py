import logging
from typing import Any, Dict
from langchain_core.messages import HumanMessage, SystemMessage
from src.core.llm_manager import get_llm
from src.core.prompts import SCHOLARSHIP_EXPLAIN_SYSTEM
from src.core.pii import redact_pii

logger = logging.getLogger(__name__)


def explain_deterministic(scholarship: Dict[str, Any], candidate: Dict[str, Any]) -> str:
    """Giải thích dựa trên luật cố định - 0% ảo tưởng, 0 latency LLM."""
    title = scholarship.get("title", "")
    country = scholarship.get("host_country", "")
    funding = scholarship.get("funding_type", "")
    match_pct = scholarship.get("match_percent", 0.0)
    tier = scholarship.get("tier_group", "")

    gpa = candidate.get("gpa", 0.0)
    ielts = candidate.get("ielts", 0.0)
    min_gpa = scholarship.get("min_gpa")
    min_ielts = scholarship.get("min_ielts")

    reasons = []
    if min_gpa and gpa >= float(min_gpa):
        reasons.append(f"GPA {gpa:.2f} đáp ứng tốt ngưỡng tối thiểu ({min_gpa:.2f})")
    if min_ielts and ielts >= float(min_ielts):
        reasons.append(f"Chứng chỉ ngoại ngữ IELTS {ielts:.1f} đạt yêu cầu ({min_ielts:.1f})")

    qual_str = ", ".join(reasons) if reasons else "Hồ sơ của bạn có nhiều tiềm năng phù hợp với định hướng học bổng này"
    return f"Học bổng '{title}' tại {country} ({funding}) đạt mức độ tương thích {match_pct}% ({tier}). {qual_str}. Hãy hoàn thiện bài luận và nộp hồ sơ trước hạn."


async def explain_scholarship(
    scholarship: Dict[str, Any],
    candidate: Dict[str, Any],
    use_llm: bool = True,
) -> str:
    """Sinh lời giải thích tự nhiên bằng tiếng Việt cho cặp ứng viên - học bổng."""
    if not use_llm:
        return explain_deterministic(scholarship, candidate)

    try:
        llm = get_llm()
        breakdown = scholarship.get("score_breakdown", {})
        prompt_content = f"""
THÔNG TIN HỌC BỔNG:
- Tên học bổng: {scholarship.get('title')}
- Quốc gia: {scholarship.get('host_country')}
- Bậc học: {scholarship.get('degree_level')}
- Chuyên ngành: {scholarship.get('major_applied')}
- Mức tài trợ: {scholarship.get('funding_type')}
- Quyền lợi: {scholarship.get('funding_details')}
- Hạn nộp: {scholarship.get('deadline')}

HỒ SƠ ỨNG VIÊN ĐÃ ĐÁNH GIÁ:
- Điểm tương thích tổng quan: {scholarship.get('match_percent')}% ({scholarship.get('tier_group')})
- Điểm GPA: {candidate.get('gpa')}/4.0 (Yêu cầu sàn: {scholarship.get('min_gpa') or 'Không yêu cầu'})
- Ngoại ngữ: IELTS {candidate.get('ielts')} / TOPIK {candidate.get('topik_level', 0)} (Yêu cầu sàn: {scholarship.get('min_ielts') or 'Không yêu cầu'})
- Ngành học: {candidate.get('major')}
- Điểm thành phần chi tiết: {breakdown}

Hãy viết lời giải thích súc tích, truyền cảm hứng từ 3-5 câu bằng tiếng Việt theo đúng chỉ dẫn hệ thống.
"""
        messages = [
            SystemMessage(content=SCHOLARSHIP_EXPLAIN_SYSTEM),
            HumanMessage(content=redact_pii(prompt_content)),
        ]
        response = await llm.ainvoke(messages)
        return response.content.strip()
    except Exception as exc:
        logger.warning(f"[Explain] LLM lỗi ({exc}), chuyển sang dùng template dự phòng.")
        return explain_deterministic(scholarship, candidate)
