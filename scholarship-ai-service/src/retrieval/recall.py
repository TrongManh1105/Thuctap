import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.config import settings

logger = logging.getLogger(__name__)

# Từ điển ánh xạ từ khóa quốc gia sang các biến thể thường gặp trong DB
COUNTRY_ALIASES = {
    "hàn quốc": ["Hàn Quốc", "Korea", "South Korea"],
    "nhật bản": ["Nhật Bản", "Japan"],
    "trung quốc": ["Trung Quốc", "China"],
    "hoa kỳ": ["Hoa Kỳ", "Mỹ", "USA", "United States"],
    "mỹ": ["Hoa Kỳ", "Mỹ", "USA", "United States"],
    "vương quốc anh": ["Vương Quốc Anh", "Anh", "UK", "United Kingdom", "London"],
    "anh": ["Vương Quốc Anh", "Anh", "UK", "United Kingdom", "London"],
    "đức": ["Đức", "Germany"],
    "úc": ["Úc", "Australia"],
    "canada": ["Canada"],
    "pháp": ["Pháp", "France"],
    "hà lan": ["Hà Lan", "Netherlands"],
    "singapore": ["Singapore"],
    "thụy điển": ["Thụy Điển", "Sweden"],
    "thụy sĩ": ["Thụy Sĩ", "Switzerland"],
    "đài loan": ["Đài Loan", "Taiwan"],
}


def expand_country_aliases(country_name: str) -> List[str]:
    c_lower = country_name.strip().lower()
    for key, aliases in COUNTRY_ALIASES.items():
        if key in c_lower or c_lower in key:
            return aliases
    return [country_name.strip()]


async def recall_for_single_condition(
    session: AsyncSession,
    where_clause: str,
    params: Dict[str, Any],
    candidate_vec: Optional[List[float]] = None,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """Truy vấn học bổng theo một điều kiện WHERE cụ thể."""
    q_params = dict(params)
    q_params["limit"] = limit

    if candidate_vec and len(candidate_vec) == settings.EMBEDDING_DIM:
        q_params["vec"] = str(candidate_vec)
        query = f"""
            SELECT 
                id, title, source_name, host_country, degree_level,
                major_applied, funding_type, funding_details,
                min_gpa, min_ielts, min_work_exp_years,
                deadline, apply_method, link, checklist, commitment,
                (1.0 - (embedding <=> CAST(:vec AS vector))) AS vector_similarity
            FROM scholarships
            WHERE {where_clause}
            ORDER BY embedding <=> CAST(:vec AS vector) ASC
            LIMIT :limit
        """
    else:
        query = f"""
            SELECT 
                id, title, source_name, host_country, degree_level,
                major_applied, funding_type, funding_details,
                min_gpa, min_ielts, min_work_exp_years,
                deadline, apply_method, link, checklist, commitment,
                0.7 AS vector_similarity
            FROM scholarships
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT :limit
        """
    try:
        result = await session.execute(text(query), q_params)
        return [dict(row) for row in result.mappings().all()]
    except Exception as exc:
        logger.error(f"[Recall] Lỗi truy vấn: {exc}")
        return []


async def recall_scholarships(
    session: AsyncSession,
    candidate_profile: Dict[str, Any],
    filters: Optional[Dict[str, Any]] = None,
    top_k: int = 50,
) -> List[Dict[str, Any]]:
    """
    Phase 1: Recall cân bằng đa quốc gia (Balanced Multi-Country Recall).
    Đảm bảo khi người dùng chọn nhiều quốc gia (ví dụ: Hàn Quốc, Nhật Bản, Trung Quốc),
    hệ thống sẽ truy vấn đại diện đầy đủ từng nước, không để 1 quốc gia áp đảo kết quả.
    """
    filters = filters or {}
    preferred_countries = filters.get("countries") or candidate_profile.get("preferred_countries") or []
    target_degree = filters.get("degree_level") or candidate_profile.get("target_degree") or ""
    candidate_vec = candidate_profile.get("profile_vector")

    base_conditions = ["1=1"]
    base_params: Dict[str, Any] = {}

    if target_degree:
        base_conditions.append("(degree_level ILIKE :deg OR degree_level IS NULL OR degree_level ILIKE '%Mọi bậc%')")
        base_params["deg"] = f"%{target_degree.strip()}%"

    # Nếu người dùng chọn nhiều hơn 1 quốc gia -> Triển khai Balanced Recall theo từng quốc gia
    if preferred_countries and len(preferred_countries) > 1:
        per_country_quota = max(15, top_k // len(preferred_countries) + 5)
        combined_results: List[Dict[str, Any]] = []
        seen_ids = set()

        for c_idx, country in enumerate(preferred_countries):
            aliases = expand_country_aliases(country)
            or_clauses = []
            country_params = dict(base_params)

            for a_idx, alias in enumerate(aliases):
                p_name = f"c_{c_idx}_{a_idx}"
                or_clauses.append(f"host_country ILIKE :{p_name}")
                country_params[p_name] = f"%{alias}%"

            country_where = " AND ".join(base_conditions + [f"({' OR '.join(or_clauses)})"])
            rows = await recall_for_single_condition(
                session=session,
                where_clause=country_where,
                params=country_params,
                candidate_vec=candidate_vec,
                limit=per_country_quota,
            )
            for r in rows:
                r_id = str(r["id"])
                if r_id not in seen_ids:
                    seen_ids.add(r_id)
                    combined_results.append(r)

        logger.info(f"[Recall] Balanced Recall thu thập được {len(combined_results)} học bổng từ {len(preferred_countries)} quốc gia.")
        return combined_results

    # Trường hợp chọn 1 quốc gia hoặc không chọn quốc gia
    conditions = list(base_conditions)
    params = dict(base_params)

    if preferred_countries and len(preferred_countries) == 1:
        country = preferred_countries[0]
        aliases = expand_country_aliases(country)
        or_clauses = []
        for a_idx, alias in enumerate(aliases):
            p_name = f"c_{a_idx}"
            or_clauses.append(f"host_country ILIKE :{p_name}")
            params[p_name] = f"%{alias}%"
        conditions.append(f"({' OR '.join(or_clauses)})")

    where_clause = " AND ".join(conditions)
    return await recall_for_single_condition(
        session=session,
        where_clause=where_clause,
        params=params,
        candidate_vec=candidate_vec,
        limit=top_k,
    )
