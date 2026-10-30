from typing import Any, Dict, List


def perform_gap_analysis(
    scholarship: Dict[str, Any],
    candidate: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Phân tích chi tiết khoảng cách tiêu chuẩn (Gap Analysis) giữa ứng viên và học bổng.
    Trả về:
      - strengths: Các tiêu chí ứng viên đã vượt hoặc đạt chuẩn.
      - gaps: Các tiêu chí chưa đạt, số điểm/kinh nghiệm còn thiếu.
      - checklist: Danh sách hồ sơ giấy tờ cần chuẩn bị.
      - action_plan: Kế hoạch hành động cụ thể để hoàn thiện hồ sơ.
    """
    cand_gpa = float(candidate.get("gpa") or 0.0)
    cand_ielts = float(candidate.get("ielts") or 0.0)
    cand_topik = int(candidate.get("topik_level") or 0)
    cand_work_yrs = float(candidate.get("work_experience_years") or 0.0)
    cand_research_yrs = float(candidate.get("research_experience_years") or 0.0)
    cand_pubs = int(candidate.get("publications_count") or 0)

    min_gpa = float(scholarship["min_gpa"]) if scholarship.get("min_gpa") is not None else None
    min_ielts = float(scholarship["min_ielts"]) if scholarship.get("min_ielts") is not None else None
    min_work = float(scholarship["min_work_exp_years"]) if scholarship.get("min_work_exp_years") is not None else None
    country = scholarship.get("host_country") or ""
    checklist_raw = scholarship.get("checklist") or "CV, Bảng điểm, Thư giới thiệu (LOR), Bài luận (SOP)"

    strengths: List[str] = []
    gaps: List[str] = []
    action_plan: List[str] = []

    # 1. Đánh giá GPA
    if min_gpa is not None:
        if cand_gpa >= min_gpa:
            strengths.append(f"Điểm học tập GPA {cand_gpa:.2f}/4.0 vượt ngưỡng tối thiểu yêu cầu ({min_gpa:.2f}/4.0)")
        else:
            diff = min_gpa - cand_gpa
            gaps.append(f"Điểm GPA hiện tại {cand_gpa:.2f}/4.0 thấp hơn yêu cầu {min_gpa:.2f}/4.0 (thiếu {diff:.2f} điểm)")
            action_plan.append("Tập trung cải thiện điểm các môn chuyên ngành sắp tới hoặc bổ sung bằng khen để bù đắp GPA.")
    else:
        strengths.append(f"GPA hiện tại {cand_gpa:.2f}/4.0 đạt mức cạnh tranh tốt.")

    # 2. Đánh giá Ngoại ngữ
    is_korea = "hàn" in country.lower()
    if is_korea and cand_topik >= 3:
        strengths.append(f"Sở hữu chứng chỉ tiếng Hàn TOPIK level {cand_topik} - lợi thế lớn khi xin học bổng chính phủ Hàn Quốc.")

    if min_ielts is not None:
        if cand_ielts >= min_ielts:
            strengths.append(f"Chứng chỉ IELTS {cand_ielts:.1f} đạt chuẩn yêu cầu hồ sơ ({min_ielts:.1f})")
        else:
            diff = min_ielts - cand_ielts
            gaps.append(f"Chứng chỉ IELTS {cand_ielts:.1f} chưa đạt ngưỡng tối thiểu {min_ielts:.1f} (cần nâng thêm {diff:.1f} band)")
            action_plan.append(f"Lên kế hoạch ôn luyện và thi lại IELTS để nâng thêm ít nhất {diff:.1f} band trước hạn nộp.")
    elif cand_ielts >= 6.5:
        strengths.append(f"IELTS {cand_ielts:.1f} là điểm cộng uy tín cho hồ sơ quốc tế.")

    # 3. Đánh giá Kinh nghiệm & Nghiên cứu
    if min_work is not None and min_work > 0:
        if cand_work_yrs >= min_work:
            strengths.append(f"Kinh nghiệm làm việc {cand_work_yrs:.1f} năm đáp ứng điều kiện tiên quyết ({min_work:.1f} năm)")
        else:
            diff = min_work - cand_work_yrs
            gaps.append(f"Cần tối thiểu {min_work:.1f} năm kinh nghiệm làm việc (hiện có {cand_work_yrs:.1f} năm)")
            action_plan.append("Tích lũy thêm dự án thực tế hoặc thư xác nhận kinh nghiệm từ tổ chức/doanh nghiệp.")

    if cand_pubs > 0:
        strengths.append(f"Đã có {cand_pubs} bài báo/công trình nghiên cứu khoa học - điểm cộng vượt trội cho bậc Thạc sĩ/Tiến sĩ.")
    elif scholarship.get("degree_level") in ("Thạc sĩ", "Tiến sĩ"):
        gaps.append("Hồ sơ chưa có công bố nghiên cứu khoa học.")
        action_plan.append("Tham gia nhóm nghiên cứu tại trường hoặc viết bài tham luận cho hội thảo học thuật.")

    # 4. Phân tích Checklist hồ sơ
    checklist_items: List[Dict[str, str]] = []
    for doc in [d.strip() for d in checklist_raw.split(",") if d.strip()]:
        status = "Đã có" if doc.lower() in ("cv", "bảng điểm") else "Cần chuẩn bị"
        checklist_items.append({"document": doc, "status": status})

    if not action_plan:
        action_plan.append("Hồ sơ của bạn rất mạnh! Hãy tập trung viết bài luận (Statement of Purpose) thật ấn tượng và xin Thư giới thiệu (LOR) sớm.")

    return {
        "scholarship_id": str(scholarship.get("id")),
        "scholarship_title": scholarship.get("title"),
        "host_country": scholarship.get("host_country"),
        "funding_type": scholarship.get("funding_type"),
        "deadline": scholarship.get("deadline"),
        "strengths": strengths,
        "gaps": gaps,
        "checklist": checklist_items,
        "action_plan": action_plan,
    }
