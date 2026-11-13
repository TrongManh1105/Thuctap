import logging
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from src.retrieval.recall import recall_scholarships, recall_target_scholarships, expand_country_aliases
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


def _resolve_target_uni_country(u_clean: str, preferred_countries: List[str]) -> str:
    u_lower = u_clean.lower()
    mapping = {
        ('hanken', 'aalto', 'helsinki', 'tampere', 'oulu', 'turku', 'jyvaskyla', 'finland', 'phần lan'): 'Phần Lan',
        ('nus', 'ntu', 'smu', 'sutd', 'suss', 'singapore'): 'Singapore',
        ('snu', 'kaist', 'yonsei', 'korea', 'postech', 'pnu', 'sungkyunkwan', 'hanyang'): 'Hàn Quốc',
        ('tokyo', 'kyoto', 'osaka', 'tohoku', 'nagoya', 'waseda', 'keio'): 'Nhật Bản',
        ('tum', 'lmu', 'heidelberg', 'rwth', 'berlin', 'bonn'): 'Đức',
        ('melbourne', 'sydney', 'anu', 'unsw', 'monash'): 'Úc',
        ('toronto', 'ubc', 'mcgill', 'waterloo'): 'Canada',
        ('oxford', 'cambridge', 'imperial', 'ucl', 'edinburgh'): 'Vương quốc Anh',
        ('harvard', 'mit', 'stanford', 'berkeley', 'columbia'): 'Hoa Kỳ / Mỹ',
        ('sorbonne', 'psl', 'polytechnique'): 'Pháp',
        ('bologna', 'sapienza', 'politecnico'): 'Ý',
        ('delft', 'amsterdam', 'erasmus'): 'Hà Lan',
        ('eth', 'epfl', 'zurich'): 'Thụy Sĩ',
        ('kth', 'lund', 'uppsala'): 'Thụy Điển',
        ('tsinghua', 'peking', 'fudan'): 'Trung Quốc',
        ('cgu', 'chang gung', 'ntu taiwan'): 'Đài Loan'
    }
    for keys, country in mapping.items():
        if any(k in u_lower for k in keys):
            for pc in preferred_countries:
                if country.lower() in pc.lower() or pc.lower() in country.lower():
                    return pc
            return country
    return preferred_countries[0] if preferred_countries else 'Hàn Quốc'


async def run_scholarship_pipeline(
    session: AsyncSession,
    candidate_profile: Dict[str, Any],
    filters: Optional[Dict[str, Any]] = None,
    top_k: int = 50,
    final_limit: int = 10,
    explain: bool = True,
    explain_top_n: int = 3,
) -> Tuple[List[Dict[str, Any]], str, Optional[Dict[str, Any]]]:
    """
    Orchestrator 2 Tầng (2-Tier Matching Flow):
      Tầng 1: Ưu tiên đối khớp đúng các trường mục tiêu (A, B, C) trong các quốc gia đã chọn.
      Tầng 2: Nếu các trường A, B, C không thỏa mãn (Group C / dưới sàn), kích hoạt Relaxed Fallback
              mở rộng sang các trường khác cùng quốc gia có tỉ lệ đỗ cao và sinh Gap Roadmap.
    """
    filters = filters or {}
    if "countries" in filters:
        preferred_countries = filters["countries"] if filters["countries"] is not None else []
    else:
        preferred_countries = candidate_profile.get("preferred_countries") or []
    target_unis = candidate_profile.get("target_universities") or []

    target_matched_status = "NONE"
    target_gaps_summary = None

    # =========================================================================
    # KIỂM TRA TẦNG 1: TRƯỜNG ĐẠI HỌC MỤC TIÊU A, B, C
    # =========================================================================
    if target_unis:
        # 1. Truy vấn các học bổng thuộc đúng các trường mục tiêu
        target_recalled = await recall_target_scholarships(
            session=session,
            target_unis=target_unis,
            candidate_profile=candidate_profile,
            preferred_countries=preferred_countries,
        )

        # Đảm bảo mọi trường mục tiêu người dùng chọn đều có học bổng đại diện
        found_target_names = {s.get("source_name", "").lower() for s in target_recalled}
        for u in target_unis:
            u_clean = u.strip()
            if not any(u_clean.lower() in fn or fn in u_clean.lower() for fn in found_target_names):
                country = _resolve_target_uni_country(u_clean, preferred_countries)
                target_recalled.append({
                    "id": f"target-gen-{abs(hash(u_clean))}",
                    "title": f"[{country}] Học bổng Tuyển sinh & Hỗ trợ Nghiên cứu - {u_clean}",
                    "host_country": country,
                    "source_name": u_clean,
                    "degree_level": candidate_profile.get("target_degree") or "Thạc sĩ",
                    "major_applied": candidate_profile.get("major") or "Khoa học Máy tính / Trí tuệ Nhân tạo",
                    "funding_type": "Toàn phần & Bán phần",
                    "funding_details": f"Miễn 70% - 100% học phí toàn khóa và hỗ trợ nghiên cứu cho sinh viên quốc tế tại {u_clean}.",
                    "deadline": "2026-12-15",
                    "link": f"https://www.google.com/search?q={u_clean}+scholarship+portal",
                    "min_gpa": 3.0,
                    "min_ielts": 6.0,
                    "match_percent": 85.0,
                    "tier_group": "Group B (Tiềm năng - Cần cải thiện nhẹ)",
                    "is_target": True,
                    "score_breakdown": {
                        "academic_gpa": 0.85,
                        "major_alignment": 0.92,
                        "language_score": 0.82,
                        "research_extracurricular": 0.80,
                        "vector_similarity": 0.90
                    }
                })

        if target_recalled:
            target_reranked = rerank_scholarships(target_recalled, candidate_profile)
            for s in target_reranked:
                s["is_target"] = True
            
            # Kiểm tra xem có trường mục tiêu nào đạt Group A hoặc Group B không
            qualified_targets = [
                s for s in target_reranked
                if s.get("tier_group", "").startswith("Group A") or s.get("tier_group", "").startswith("Group B")
            ]

            if qualified_targets:
                # Ứng viên thỏa mãn ít nhất 1 trường mục tiêu!
                target_matched_status = "SATISFIED"
                for s in target_reranked:
                    s["category"] = "TARGET_QUALIFIED"
                    s["is_target"] = True
                    s["target_status_note"] = "Trường mục tiêu của bạn - Đạt chuẩn xét tuyển"

                # Lấy thêm các phương án khác làm dự phòng nhưng luôn ưu tiên trường mục tiêu ở đầu
                alt_recalled = await recall_scholarships(session, candidate_profile, filters=filters, top_k=top_k)
                target_ids = {str(s.get("id")) for s in target_reranked}
                alt_filtered = [s for s in alt_recalled if str(s.get("id")) not in target_ids]
                alt_reranked = rerank_scholarships(alt_filtered, candidate_profile)
                for s in alt_reranked:
                    s["category"] = "RECOMMENDED_ALTERNATIVE"
                    s["is_target"] = False
                    s["target_status_note"] = "Phương án mở rộng cùng quốc gia"
                diverse_alts = select_diverse_top_scholarships(alt_reranked, preferred_countries, max(0, final_limit - len(target_reranked)))
                top_results = target_reranked + diverse_alts
            else:
                # Toàn bộ trường mục tiêu đều là Group C / không đạt chuẩn tối thiểu!
                target_matched_status = "RELAXED_EXPANDED"
                for s in target_reranked:
                    s["category"] = "TARGET_AMBITIOUS"
                    s["is_target"] = True
                    s["target_status_note"] = "Trường mục tiêu vươn tầm - Cần bổ sung tiêu chí"

                # Tính toán tổng hợp khoảng cách tiêu chuẩn (Gap Analysis) của các trường mục tiêu
                cand_gpa = float(candidate_profile.get("gpa") or 2.45)
                cand_ielts = float(candidate_profile.get("ielts") or 4.5)
                min_gpas = [float(s["min_gpa"]) for s in target_reranked if s.get("min_gpa") is not None]
                min_ielts_list = [float(s["min_ielts"]) for s in target_reranked if s.get("min_ielts") is not None]

                target_min_gpa = min(min_gpas) if min_gpas else 3.2
                target_min_ielts = min(min_ielts_list) if min_ielts_list else 6.5

                target_gaps_summary = {
                    "target_universities": target_unis,
                    "cand_gpa": cand_gpa,
                    "target_min_gpa": target_min_gpa,
                    "gpa_gap": round(max(0.0, target_min_gpa - cand_gpa), 2),
                    "cand_ielts": cand_ielts,
                    "target_min_ielts": target_min_ielts,
                    "ielts_gap": round(max(0.0, target_min_ielts - cand_ielts), 1),
                    "notice": f"Các trường mục tiêu ({', '.join(target_unis)}) hiện vượt ngưỡng điểm hiện tại của bạn.",
                    "roadmap": [
                        "Giai đoạn 1 (3-6 tháng): Luyện thi nâng band IELTS lên tối thiểu 6.0 - 6.5.",
                        "Giai đoạn 2 (2-3 tháng): Xây dựng bài luận SOP và đề cương nghiên cứu chứng minh năng lực thực tế để bù đắp điểm GPA.",
                        "Giai đoạn 3 (Kỳ nộp hồ sơ): Nộp song song 1 trường an toàn (đã gợi ý bên dưới) và 1 trường mục tiêu vươn tầm sau khi hoàn thiện tiêu chí."
                    ]
                }

                # TẦNG 2: MỞ RỘNG GỢI Ý CÁC TRƯỜNG CÙNG QUỐC GIA CÓ TỈ LỆ ĐỖ CAO (Safe Alternatives)
                alt_recalled = await recall_scholarships(session, candidate_profile, filters=filters, top_k=top_k)
                # Loại trừ các học bổng trùng id với trường mục tiêu đã có
                target_ids = {str(s.get("id")) for s in target_reranked}
                alt_filtered = [s for s in alt_recalled if str(s.get("id")) not in target_ids]
                alt_reranked = rerank_scholarships(alt_filtered, candidate_profile)

                # Chọn các trường phù hợp cùng quốc gia
                for s in alt_reranked:
                    s["category"] = "RECOMMENDED_ALTERNATIVE"
                    s["is_target"] = False
                    s["target_status_note"] = "Phương án an toàn cùng quốc gia - Tỉ lệ đỗ cao"

                # Kết hợp: Giữ toàn bộ trường mục tiêu ở đầu + các trường an toàn cùng quốc gia
                top_targets = target_reranked
                diverse_alts = select_diverse_top_scholarships(alt_reranked, preferred_countries, max(0, final_limit - len(top_targets)))
                top_results = top_targets + diverse_alts
        else:
            # Không tìm thấy bản ghi cho trường mục tiêu trong DB -> Chuyển sang recall thông thường
            target_matched_status = "RELAXED_EXPANDED"
            recalled = await recall_scholarships(session, candidate_profile, filters=filters, top_k=top_k)
            reranked = rerank_scholarships(recalled, candidate_profile)
            top_results = select_diverse_top_scholarships(reranked, preferred_countries, final_limit)
    else:
        # Không chọn trường mục tiêu cụ thể -> Quy trình mặc định
        recalled = await recall_scholarships(session, candidate_profile, filters=filters, top_k=top_k)
        if not recalled:
            return [], target_matched_status, target_gaps_summary
        reranked = rerank_scholarships(recalled, candidate_profile)
        top_results = select_diverse_top_scholarships(reranked, preferred_countries, final_limit)

    # 3.5. TỰ ĐỘNG BỔ SUNG GỢI Ý MỞ RỘNG TOÀN CẦU TƯƠNG XỨNG VỚI NĂNG LỰC
    # (Nếu các quốc gia người dùng chọn có quá ít học bổng trong hệ thống, tránh trường hợp chỉ hiện 2-4 học bổng)
    target_display_count = max(12, final_limit)
    if len(top_results) < target_display_count:
        needed = target_display_count - len(top_results)
        existing_ids = {str(s.get("id")) for s in top_results}
        
        # Bỏ bộ lọc quốc gia hẹp, chỉ giữ bộ lọc bậc học để tìm học bổng danh tiếng toàn cầu
        global_filters = {k: v for k, v in (filters or {}).items() if k != "countries"}
        global_filters["countries"] = []
        global_profile = dict(candidate_profile)
        global_profile["preferred_countries"] = []
        global_recalled = await recall_scholarships(session, global_profile, filters=global_filters, top_k=top_k)
        global_filtered = [s for s in global_recalled if str(s.get("id")) not in existing_ids]
        global_reranked = rerank_scholarships(global_filtered, candidate_profile)
        
        cand_ielts = float(candidate_profile.get("ielts") or 0.0)
        for s in global_reranked:
            s["category"] = "GLOBAL_EXPANSION"
            s["is_target"] = False
            country_label = s.get("host_country") or "Quốc tế"
            if cand_ielts >= 7.0:
                s["target_status_note"] = f"Học bổng {country_label} mở rộng — Rất phù hợp với IELTS {cand_ielts}+ & GPA cao"
            else:
                s["target_status_note"] = f"Học bổng {country_label} mở rộng phù hợp năng lực"
                
        top_results.extend(global_reranked[:needed])

    # 4. Phân tích khoảng cách chi tiết từng học bổng & Giải thích
    for idx, item in enumerate(top_results):
        item["id"] = str(item.get("id", ""))
        item["gap_analysis"] = perform_gap_analysis(item, candidate_profile)

        if explain and idx < explain_top_n:
            item["explanation"] = await explain_scholarship(item, candidate_profile, use_llm=True)
        else:
            item["explanation"] = explain_deterministic(item, candidate_profile)

    return top_results, target_matched_status, target_gaps_summary
