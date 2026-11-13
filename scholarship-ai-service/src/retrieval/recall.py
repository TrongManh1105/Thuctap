import re
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
    "hà lan": ["Hà Lan", "Netherlands", "Holland"],
    "singapore": ["Singapore"],
    "thụy điển": ["Thụy Điển", "Sweden"],
    "thụy sĩ": ["Thụy Sĩ", "Switzerland"],
    "đài loan": ["Đài Loan", "Taiwan"],
    "phần lan": ["Phần Lan", "Finland"],
    "finland": ["Phần Lan", "Finland"],
    "ý": ["Ý", "Italy", "Italia"],
    "italy": ["Ý", "Italy", "Italia"],
    "new zealand": ["New Zealand", "NZ"],
    "ireland": ["Ireland", "Ai-len"],
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
    if "countries" in filters:
        preferred_countries = filters["countries"] if filters["countries"] is not None else []
    else:
        preferred_countries = candidate_profile.get("preferred_countries") or []
    target_degree = filters.get("degree_level") or candidate_profile.get("target_degree") or ""
    candidate_vec = candidate_profile.get("profile_vector")

    base_conditions = ["1=1"]
    base_params: Dict[str, Any] = {}

    if target_degree:
        t_clean = target_degree.strip().lower()
        if "thạc sĩ" in t_clean or "master" in t_clean or "cao học" in t_clean:
            base_conditions.append("(degree_level ILIKE '%Thạc sĩ%' OR degree_level ILIKE '%Master%' OR degree_level ILIKE '%Cao học%' OR degree_level ILIKE '%Postgraduate%' OR degree_level ILIKE '%Bachelors / Masters%' OR degree_level IS NULL OR degree_level ILIKE '%Mọi bậc%')")
        elif "cử nhân" in t_clean or "bachelor" in t_clean or "đại học" in t_clean or "undergraduate" in t_clean:
            base_conditions.append("(degree_level ILIKE '%Cử nhân%' OR degree_level ILIKE '%Bachelor%' OR degree_level ILIKE '%Undergraduate%' OR degree_level ILIKE '%Đại học%' OR degree_level ILIKE '%Bachelors / Masters%' OR degree_level ILIKE '%Thạc sĩ / Cử nhân%' OR degree_level IS NULL OR degree_level ILIKE '%Mọi bậc%')")
        elif "tiến sĩ" in t_clean or "phd" in t_clean or "doctor" in t_clean:
            base_conditions.append("(degree_level ILIKE '%Tiến sĩ%' OR degree_level ILIKE '%PhD%' OR degree_level ILIKE '%Doctor%' OR degree_level IS NULL OR degree_level ILIKE '%Mọi bậc%')")
        else:
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


async def recall_target_scholarships(
    session: AsyncSession,
    target_unis: List[str],
    candidate_profile: Dict[str, Any],
    preferred_countries: Optional[List[str]] = None,
    limit: int = 15,
) -> List[Dict[str, Any]]:
    """
    Tầng 1: Recall ưu tiên cho các trường Đại học mục tiêu (A, B, C).
    Truy vấn chính xác các học bổng thuộc các trường mục tiêu đã chọn.
    """
    if not target_unis:
        return []

    conditions = []
    params: Dict[str, Any] = {"limit": limit}

    # Điều kiện trường mục tiêu (hỗ trợ bóc tách viết tắt, tên tiếng Việt và tên tiếng Anh)
    uni_clauses = []
    param_counter = 0
    for u in target_unis:
        u_clean = u.strip()
        aliases = {u_clean}
        
        # Bóc tách tên trong ngoặc đơn (ví dụ: SUSS, CGU, SNU, KAIST...)
        paren_match = re.search(r'\((.*?)\)', u_clean)
        if paren_match:
            short_code = paren_match.group(1).strip()
            if len(short_code) >= 2:
                aliases.add(short_code)
        
        # Bóc tách tên trường không kèm ngoặc
        base_name = re.sub(r'\(.*?\)', '', u_clean).strip()
        if len(base_name) >= 3:
            aliases.add(base_name)
            # Rút gọn chữ 'Đại học' nếu có
            if base_name.lower().startswith('đại học'):
                aliases.add(base_name[7:].strip())

        # Ánh xạ tên tiếng Anh phổ biến
        u_lower = u_clean.lower()
        if 'hanken' in u_lower:
            aliases.update(['Hanken', 'Hanken School of Economics'])
        elif 'aalto' in u_lower:
            aliases.update(['Aalto', 'Aalto University'])
        elif 'helsinki' in u_lower:
            aliases.update(['Helsinki', 'University of Helsinki'])
        elif 'tampere' in u_lower:
            aliases.update(['Tampere', 'Tampere University'])
        elif 'smu' in u_lower or 'quản lý singapore' in u_lower:
            aliases.update(['SMU', 'Singapore Management University'])
        elif 'suss' in u_lower or 'khoa học xã hội singapore' in u_lower:
            aliases.update(['SUSS', 'Singapore University of Social Sciences'])
        elif 'cgu' in u_lower or 'trường canh' in u_lower:
            aliases.update(['CGU', 'Chang Gung'])
        elif 'snu' in u_lower or 'quốc gia seoul' in u_lower:
            aliases.update(['SNU', 'Seoul National University'])
        elif 'kaist' in u_lower:
            aliases.update(['KAIST', 'Korea Advanced Institute'])
        elif 'yonsei' in u_lower:
            aliases.update(['Yonsei'])
        elif 'korea' in u_lower or 'đại học korea' in u_lower:
            aliases.update(['Korea University'])
        elif 'nus' in u_lower or 'quốc gia singapore' in u_lower:
            aliases.update(['NUS', 'National University of Singapore'])
        elif 'ntu' in u_lower or 'nanyang' in u_lower:
            aliases.update(['NTU', 'Nanyang'])
        elif 'sutd' in u_lower:
            aliases.update(['SUTD', 'Singapore University of Technology'])

        sub_clauses = []
        for a in aliases:
            if not a: continue
            p_name = f"uni_alias_{param_counter}"
            sub_clauses.append(f"(source_name ILIKE :{p_name} OR title ILIKE :{p_name})")
            params[p_name] = f"%{a}%"
            param_counter += 1

        if sub_clauses:
            uni_clauses.append(f"({' OR '.join(sub_clauses)})")

    if uni_clauses:
        conditions.append(f"({' OR '.join(uni_clauses)})")

    # Điều kiện quốc gia nếu có
    if preferred_countries:
        c_clauses = []
        for idx, c in enumerate(preferred_countries):
            aliases = expand_country_aliases(c)
            for a_idx, a in enumerate(aliases):
                p_cname = f"c_{idx}_{a_idx}"
                c_clauses.append(f"host_country ILIKE :{p_cname}")
                params[p_cname] = f"%{a}%"
        if c_clauses:
            conditions.append(f"({' OR '.join(c_clauses)})")

    # Bậc học nếu có
    target_degree = candidate_profile.get("target_degree")
    if target_degree:
        conditions.append("(degree_level ILIKE :deg OR degree_level IS NULL OR degree_level ILIKE '%Mọi bậc%')")
        params["deg"] = f"%{target_degree.strip()}%"

    where_sql = " AND ".join(conditions)

    candidate_vec = candidate_profile.get("profile_vector")
    if candidate_vec and len(candidate_vec) == settings.EMBEDDING_DIM:
        params["vec"] = str(candidate_vec)
        query = f"""
            SELECT 
                id, title, source_name, host_country, degree_level,
                major_applied, funding_type, funding_details,
                min_gpa, min_ielts, min_work_exp_years,
                deadline, apply_method, link, checklist, commitment,
                (1.0 - (embedding <=> CAST(:vec AS vector))) AS vector_similarity
            FROM scholarships
            WHERE {where_sql}
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
                0.85 AS vector_similarity
            FROM scholarships
            WHERE {where_sql}
            ORDER BY created_at DESC
            LIMIT :limit
        """

    try:
        result = await session.execute(text(query), params)
        rows = [dict(row) for row in result.mappings().all()]
        logger.info(f"[Target Recall] Tìm thấy {len(rows)} học bổng cho các trường mục tiêu: {target_unis}")
        return rows
    except Exception as exc:
        logger.error(f"[Target Recall] Lỗi truy vấn trường mục tiêu: {exc}")
        return []
