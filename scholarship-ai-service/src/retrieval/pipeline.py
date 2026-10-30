import logging
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.retrieval.recall import recall_scholarships, expand_country_aliases
from src.retrieval.reranker import rerank_scholarships
from src.retrieval.explain import explain_scholarship, explain_deterministic
from src.retrieval.gap_analysis import perform_gap_analysis

logger = logging.getLogger(__name__)


def select_diverse_top_scholarships(
    reranked: List[Dict[str, Any]],
    preferred_countries: List[str],
    final_limit: int,
) -> List[Dict[str, Any]]:
    """
    Thuật toán Round-robin Fair Allocation:
    Đảm bảo khi người dùng chọn nhiều quốc gia (ví dụ: Hàn Quốc, Nhật Bản, Trung Quốc),
    danh sách kết quả sẽ có đại diện phong phú của tất cả các quốc gia được chọn.
    """
    if not preferred_countries or len(preferred_countries) <= 1:
        return reranked[:final_limit]

    country_buckets: Dict[str, List[Dict[str, Any]]] = {c: [] for c in preferred_countries}
    other_bucket: List[Dict[str, Any]] = []

    for item in reranked:
        h_country = (item.get("host_country") or "").lower()
        matched_c = None
        for c in preferred_countries:
            aliases = expand_country_aliases(c)
            if any(a.lower() in h_country for a in aliases):
                matched_c = c
                break
        if matched_c:
            country_buckets[matched_c].append(item)
        else:
            other_bucket.append(item)

    selected: List[Dict[str, Any]] = []
    seen_ids = set()
    pointers = {c: 0 for c in preferred_countries}

    while len(selected) < final_limit:
        added_in_round = False
        for c in preferred_countries:
            bucket = country_buckets[c]
            ptr = pointers[c]
            while ptr < len(bucket) and str(bucket[ptr].get("id")) in seen_ids:
                ptr += 1
            if ptr < len(bucket):
                cand = bucket[ptr]
                cand_id = str(cand.get("id"))
                seen_ids.add(cand_id)
                selected.append(cand)
                pointers[c] = ptr + 1
                added_in_round = True
                if len(selected) >= final_limit:
                    break
        if not added_in_round:
            for cand in other_bucket:
                cand_id = str(cand.get("id"))
                if cand_id not in seen_ids:
                    seen_ids.add(cand_id)
                    selected.append(cand)
                    if len(selected) >= final_limit:
                        break
            break

    # Sắp xếp lại theo match_percent giảm dần
    selected.sort(key=lambda x: x.get("match_percent", 0.0), reverse=True)
    return selected


async def run_scholarship_pipeline(
    session: AsyncSession,
    candidate_profile: Dict[str, Any],
    filters: Optional[Dict[str, Any]] = None,
    top_k: int = 50,
    final_limit: int = 10,
    explain: bool = True,
    explain_top_n: int = 3,
) -> List[Dict[str, Any]]:
    """
    Orchestrator kết nối toàn bộ các giai đoạn của Bộ máy Gợi ý Học bổng:
      Phase 1: Recall cân bằng đa quốc gia (pgvector + Hard filters)
      Phase 2: Rerank (5 yếu tố học thuật + Tier Offset Group A, B, C)
      Phase 3: Diverse Fair Share Selection (Đầy đủ các quốc gia được chọn)
      Phase 4: Gap Analysis & Grounded Explanation (LLM / Template)
    """
    filters = filters or {}
    preferred_countries = filters.get("countries") or candidate_profile.get("preferred_countries") or []

    # 1. Recall
    recalled = await recall_scholarships(session, candidate_profile, filters=filters, top_k=top_k)
    if not recalled:
        logger.info("[Pipeline] Không tìm thấy học bổng nào trong giai đoạn Recall.")
        return []

    # 2. Rerank
    reranked = rerank_scholarships(recalled, candidate_profile)

    # 3. Diverse Selection đa quốc gia
    top_results = select_diverse_top_scholarships(reranked, preferred_countries, final_limit)

    # 4. Gap Analysis & Explain
    for idx, item in enumerate(top_results):
        item["id"] = str(item.get("id", ""))
        item["gap_analysis"] = perform_gap_analysis(item, candidate_profile)

        if explain and idx < explain_top_n:
            item["explanation"] = await explain_scholarship(item, candidate_profile, use_llm=True)
        else:
            item["explanation"] = explain_deterministic(item, candidate_profile)

    return top_results
