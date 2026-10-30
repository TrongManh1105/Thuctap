import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def _compute_academic_score(candidate_gpa: float, min_gpa: float | None) -> float:
    if not min_gpa or min_gpa <= 0:
        return 0.85
    if candidate_gpa >= min_gpa:
        bonus = min(0.15, (candidate_gpa - min_gpa) * 0.2)
        return min(1.0, 0.85 + bonus)
    gap = min_gpa - candidate_gpa
    return max(0.0, 0.8 - (gap * 1.5))


def _compute_language_score(
    candidate_ielts: float,
    min_ielts: float | None = None,
    candidate_topik: int = 0,
    host_country: str | None = None,
) -> float:
    # Nếu đi Hàn Quốc và có TOPIK cao
    is_korea = host_country and any(k in host_country.lower() for k in ["hàn", "korea"])
    if is_korea and candidate_topik >= 3:
        return min(1.0, 0.7 + (candidate_topik * 0.06))

    if not min_ielts or min_ielts <= 0:
        return 0.85
    if candidate_ielts >= min_ielts:
        bonus = min(0.15, (candidate_ielts - min_ielts) * 0.1)
        return min(1.0, 0.85 + bonus)
    gap = min_ielts - candidate_ielts
    return max(0.0, 0.75 - (gap * 0.8))


def _compute_major_score(candidate_major: str, major_applied: str | None) -> float:
    if not major_applied or not candidate_major:
        return 0.8
    applied_lower = major_applied.lower()
    cand_lower = candidate_major.lower()

    if any(kw in applied_lower for kw in ["mọi ngành", "đa ngành", "tất cả"]):
        return 0.9

    cand_tokens = set(re.findall(r"\w+", cand_lower))
    applied_tokens = set(re.findall(r"\w+", applied_lower))

    overlap = cand_tokens.intersection(applied_tokens)
    if overlap:
        return 1.0
    return 0.4


def _compute_research_score(candidate: Dict[str, Any]) -> float:
    pubs = candidate.get("publications_count", 0)
    awards = candidate.get("awards_count", 0)
    research_yrs = candidate.get("research_experience_years", 0)
    work_yrs = candidate.get("work_experience_years", 0)

    score = 0.5
    score += min(0.25, pubs * 0.1)
    score += min(0.15, awards * 0.08)
    score += min(0.1, (research_yrs + work_yrs * 0.5) * 0.05)
    return min(1.0, score)


def rerank_scholarships(
    scholarships: List[Dict[str, Any]],
    candidate: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Phase 2: Reranker 5 yếu tố học thuật + Phân tầng Group A, B, C.
    """
    candidate_gpa = float(candidate.get("gpa") or 3.0)
    candidate_ielts = float(candidate.get("ielts") or 6.0)
    candidate_topik = int(candidate.get("topik_level") or 0)
    candidate_major = str(candidate.get("major") or "")

    ranked: List[Dict[str, Any]] = []

    for item in scholarships:
        min_gpa = float(item["min_gpa"]) if item.get("min_gpa") is not None else None
        min_ielts = float(item["min_ielts"]) if item.get("min_ielts") is not None else None
        country = item.get("host_country") or ""
        major_applied = item.get("major_applied") or ""

        # 1. Tính các điểm thành phần
        s_academic = _compute_academic_score(candidate_gpa, min_gpa)
        s_lang = _compute_language_score(
            candidate_ielts=candidate_ielts,
            min_ielts=min_ielts,
            candidate_topik=candidate_topik,
            host_country=country,
        )
        s_major = _compute_major_score(candidate_major, major_applied)
        s_research = _compute_research_score(candidate)
        s_vector = float(item.get("vector_similarity") or 0.7)

        # Trọng số điểm chuyên môn
        academic_composite = (
            s_academic * 0.30 +
            s_lang * 0.25 +
            s_major * 0.20 +
            s_research * 0.15 +
            s_vector * 0.10
        )

        # 2. Phân tầng Tier Offset
        # Group A: Đạt đủ điều kiện tiên quyết sàn (Offset = 2.0)
        # Group B: Thiếu nhẹ không quá 0.3 GPA hoặc 0.5 IELTS (Offset = 1.0)
        # Group C: Không đạt yêu cầu sàn (Offset = 0.0)
        is_gpa_pass = (min_gpa is None) or (candidate_gpa >= min_gpa)
        is_lang_pass = (min_ielts is None) or (candidate_ielts >= min_ielts)

        if is_gpa_pass and is_lang_pass:
            tier_offset = 2.0
            tier_group = "Group A (Đủ điều kiện xét tuyển)"
        elif (candidate_gpa >= (min_gpa or 0) - 0.3) and (candidate_ielts >= (min_ielts or 0) - 0.5):
            tier_offset = 1.0
            tier_group = "Group B (Tiềm năng - Cần cải thiện nhẹ)"
        else:
            tier_offset = 0.0
            tier_group = "Group C (Chưa đủ điều kiện sàn)"

        final_score = tier_offset + academic_composite
        match_percent = min(100.0, round((final_score / 3.0) * 100.0, 1))

        item_enriched = dict(item)
        item_enriched["match_percent"] = match_percent
        item_enriched["tier_group"] = tier_group
        item_enriched["score_breakdown"] = {
            "academic_gpa": round(s_academic, 3),
            "language_score": round(s_lang, 3),
            "major_alignment": round(s_major, 3),
            "research_extracurricular": round(s_research, 3),
            "vector_similarity": round(s_vector, 3),
        }
        ranked.append(item_enriched)

    # Sắp xếp theo match_percent giảm dần
    ranked.sort(key=lambda x: x["match_percent"], reverse=True)
    return ranked
