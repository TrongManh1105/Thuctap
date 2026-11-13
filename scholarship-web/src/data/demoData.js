/**
 * ScholarMatch AI - Demo Dataset & Reference Data
 * Rich catalog of international scholarships across Asia, Europe, North America, and Oceania.
 * Includes complete 5-Factor White-box scores and detailed Gap Analysis.
 */

export const DEMO_PROFILE = {
  full_name: "Nguyễn Trọng Mạnh Tiền",
  target_degree: "Thạc sĩ",
  major: "Trí tuệ Nhân tạo / Khoa học Máy tính",
  gpa: 3.40,
  ielts: 6.5,
  topik_level: 0,
  preferred_countries: ["Hàn Quốc", "Nhật Bản", "Trung Quốc"],
  publications_count: 1,
  awards_count: 2,
  work_experience_years: 1.5,
  research_experience_years: 1.0,
  statement_of_purpose: "Mong muốn theo đuổi nghiên cứu chuyên sâu về học máy, thị giác máy tính và ứng dụng AI trong y tế tại các phòng thí nghiệm hàng đầu châu Á và toàn cầu."
};

export const DEMO_SCHOLARSHIPS = [
  // -------------------------------------------------------------------------
  // HÀN QUỐC (KOREA SCHOLARSHIPS - TOÀN DIỆN MỌI PHÂN TẦNG A, B, C)
  // -------------------------------------------------------------------------
  {
    id: "kr-gks-snu-2026",
    title: "[Hàn Quốc] Học bổng Chính phủ Hàn Quốc (Global Korea Scholarship - GKS) - Đại học Quốc gia Seoul (SNU)",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Khoa học Máy tính, Trí tuệ Nhân tạo, Kỹ thuật Điện tử",
    funding_type: "Toàn phần 100%",
    funding_details: "Đài thọ 100% học phí, trợ cấp sinh hoạt 1,000,000 KRW/tháng, vé máy bay khứ hồi, trợ cấp định cư và 1 năm học tiếng Hàn miễn phí.",
    deadline: "2026-10-25",
    link: "https://en.snu.ac.kr/",
    match_percent: 88.5,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.88,
      major_alignment: 0.95,
      language_score: 0.85,
      research_extracurricular: 0.86,
      vector_similarity: 0.92
    },
    gap_analysis: {
      strengths: [
        "Đại học Quốc gia Seoul ưu tiên xét tuyển ứng viên ngành Khoa học Kỹ thuật và Công nghệ thông tin.",
        "Có định hướng nghiên cứu rõ ràng và cam kết đóng góp vào hợp tác Việt - Hàn."
      ],
      gaps: [
        "Học bổng GKS cạnh tranh rất cao, nên hoàn thiện bài luận giới thiệu bản thân (Personal Statement) thật ấn tượng.",
        "Chưa có chứng chỉ TOPIK (sẽ được tham gia 1 năm học tiếng Hàn bắt buộc trước khóa chuyên ngành)."
      ],
      checklist: [
        { document: "Bảng điểm đại học dịch thuật công chứng", status: "Đã có" },
        { document: "Chứng chỉ IELTS", status: "Đã có" },
        { document: "Bài luận giới thiệu bản thân (Personal Statement)", status: "Cần chuẩn bị" },
        { document: "Kế hoạch học tập (Statement of Purpose)", status: "Cần chuẩn bị" },
        { document: "2 Thư giới thiệu (LOR)", status: "Cần chuẩn bị" },
        { document: "Giấy khám sức khỏe du học", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Chuẩn bị kỹ 2 bài luận GKS theo mẫu chuẩn của NIIED.",
        "Nộp hồ sơ qua đường Đại sứ quán Hàn Quốc tại Hà Nội hoặc nộp trực tiếp cho Đại học Quốc gia Seoul (University Track)."
      ]
    },
    explanation: "Học bổng Chính phủ GKS tại SNU là cơ hội danh giá số 1 Hàn Quốc. Hồ sơ của bạn đạt mức độ tương thích cao 88.5% (Group A) với chuyên ngành AI và nền tảng kỹ thuật vững chắc."
  },
  {
    id: "kr-unist-fellowship-2026",
    title: "[Hàn Quốc] UNIST Global Talent Fellowship - Viện Khoa học & Công nghệ Quốc gia Ulsan",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "AI, Khoa học Dữ liệu, Kỹ thuật Máy tính",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 100% học phí toàn khóa, trợ cấp sinh hoạt hàng tháng 1.2M - 1.5M KRW, bảo hiểm y tế và hỗ trợ chỗ ở ký túc xá.",
    deadline: "2026-11-30",
    link: "https://www.unist.ac.kr/",
    match_percent: 91.5,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.91,
      major_alignment: 0.95,
      language_score: 0.87,
      research_extracurricular: 0.88,
      vector_similarity: 0.93
    },
    gap_analysis: {
      strengths: [
        "Chuyên ngành AI phù hợp trực tiếp với các phòng Lab trọng điểm tại UNIST.",
        "IELTS đáp ứng xuất sắc chuẩn đầu vào của viện.",
        "Có kinh nghiệm làm nghiên cứu khoa học."
      ],
      gaps: [
        "Nên gửi email trao đổi trước với Giáo sư trưởng Lab tại UNIST."
      ],
      checklist: [
        { document: "CV / Resume chuẩn học thuật", status: "Đã có" },
        { document: "Bảng điểm đại học", status: "Đã có" },
        { document: "Bài luận mục đích học tập (SOP)", status: "Cần chuẩn bị" },
        { document: "2 Thư giới thiệu", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Hoàn thiện bài luận SOP nhấn mạnh mục tiêu nghiên cứu AI.",
        "Nộp hồ sơ trực tuyến trên cổng tuyển sinh quốc tế của UNIST trước ngày 30/11."
      ]
    },
    explanation: "Học bổng UNIST tại Hàn Quốc đạt độ tương thích 91.5% (Group A). Hồ sơ của bạn đáp ứng xuất sắc các tiêu chí học thuật và kỹ năng nghiên cứu."
  },
  {
    id: "kr-kaist-stem-2026",
    title: "[Hàn Quốc] KAIST International Graduate Scholarship - Viện KAIST",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Khoa học Máy tính, Trí tuệ Nhân tạo, Robotics",
    funding_type: "Toàn phần 100%",
    funding_details: "Tài trợ 100% học phí, trợ cấp sinh hoạt 350,000 - 400,000 KRW/tháng cộng thêm lương nghiên cứu Lab của Giáo sư (700,000 - 1,200,000 KRW/tháng).",
    deadline: "2026-12-20",
    link: "https://www.kaist.ac.kr/en/",
    match_percent: 89.0,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.89,
      major_alignment: 0.94,
      language_score: 0.85,
      research_extracurricular: 0.87,
      vector_similarity: 0.90
    },
    gap_analysis: {
      strengths: [
        "Nền tảng kỹ thuật tốt, phù hợp hệ sinh thái nghiên cứu công nghệ tiên tiến tại KAIST.",
        "Tiềm năng nghiên cứu xuất sắc trong các Lab AI/Robotics."
      ],
      gaps: [
        "Nên chuẩn bị portfolio dự án GitHub hoặc demo bài báo khoa học."
      ],
      checklist: [
        { document: "Bảng điểm đại học", status: "Đã có" },
        { document: "Portfolio dự án mã nguồn", status: "Cần chuẩn bị" },
        { document: "2 Thư giới thiệu học thuật", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Đăng tải mã nguồn nghiên cứu lên GitHub và đính kèm liên kết vào CV.",
        "Đăng ký nộp hồ sơ KAIST kỳ Thu 2026 trước thời hạn."
      ]
    },
    explanation: "KAIST là viện nghiên cứu công nghệ số 1 Hàn Quốc. Độ tương thích 89.0% xếp hồ sơ của bạn vào Group A với cơ hội nhận hỗ trợ tài chính toàn diện."
  },
  {
    id: "kr-yonsei-leader-2026",
    title: "[Hàn Quốc] Học bổng Yonsei Global Leader Fellowship - Đại học Yonsei (Yonsei University)",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ",
    major_applied: "Trí tuệ Nhân tạo, Khoa học Máy tính, Kỹ thuật Hệ thống",
    funding_type: "Bán phần",
    funding_details: "Miễn 50% - 100% học phí kỳ đầu tiên và duy trì toàn khóa nếu đạt GPA từ 3.4/4.3 trở lên.",
    deadline: "2026-11-15",
    link: "https://www.yonsei.ac.kr/en_sc/",
    match_percent: 84.5,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.84,
      major_alignment: 0.90,
      language_score: 0.83,
      research_extracurricular: 0.80,
      vector_similarity: 0.87
    },
    gap_analysis: {
      strengths: [
        "Đại học Yonsei nằm trong nhóm trường SKY danh giá hàng đầu Hàn Quốc.",
        "Chương trình học quốc tế bằng tiếng Anh không bắt buộc chứng chỉ tiếng Hàn."
      ],
      gaps: [
        "Mức học bổng toàn phần 100% yêu cầu phỏng vấn trực tuyến với hội đồng khoa học."
      ],
      checklist: [
        { document: "Bảng điểm đại học", status: "Đã có" },
        { document: "Bài luận kế hoạch học tập", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Chuẩn bị kỹ phần phỏng vấn giải thích động lực học tập tại Yonsei."
      ]
    },
    explanation: "Đại học Yonsei là cơ sở đào tạo top đầu. Độ tương thích 84.5% (Group B) mang lại cơ hội trúng tuyển học bổng bán phần hoặc toàn phần rất rộng mở."
  },
  {
    id: "kr-pnu-international-2026",
    title: "[Hàn Quốc] Học bổng Đại học Quốc gia Pusan (PNU International Scholarship)",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ",
    major_applied: "Khoa học Máy tính, Kỹ thuật Phần mềm, Trí tuệ Nhân tạo",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 70% - 100% học phí toàn khóa, trợ cấp sinh hoạt 500,000 KRW/tháng cho sinh viên quốc tế xuất sắc.",
    deadline: "2026-12-05",
    link: "https://www.pusan.ac.kr/eng/",
    match_percent: 86.2,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.86,
      major_alignment: 0.92,
      language_score: 0.84,
      research_extracurricular: 0.81,
      vector_similarity: 0.89
    },
    gap_analysis: {
      strengths: [
        "Đại học Quốc gia Pusan là trường đại học công lập hàng đầu miền Nam Hàn Quốc.",
        "Tiêu chuẩn tuyển sinh thân thiện, tỷ lệ xét duyệt cấp học bổng cho sinh viên Việt Nam rất cao."
      ],
      gaps: [
        "Nên bổ sung chứng chỉ ngoại ngữ hoặc thư giới thiệu của giảng viên."
      ],
      checklist: [
        { document: "Bảng điểm đại học", status: "Đã có" },
        { document: "Bản kế hoạch học tập", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Nộp hồ sơ trực tuyến qua hệ thống tuyển sinh sinh viên quốc tế của PNU."
      ]
    },
    explanation: "Đại học Quốc gia Pusan có chính sách học bổng cởi mở và nguồn tài trợ dồi dào, độ tương thích 86.2% giúp bạn tự tin cạnh tranh học bổng miễn học phí toàn phần."
  },
  {
    id: "kr-donga-scholarship-2026",
    title: "[Hàn Quốc] Học bổng Khuyến khích Tài năng Quốc tế - Đại học Dong-A (Busan)",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ / Cử nhân",
    major_applied: "Công nghệ Thông tin, Khoa học Máy tính, Quản trị Công nghệ",
    funding_type: "Bán phần",
    funding_details: "Miễn 50% - 70% học phí kỳ đầu cho sinh viên quốc tế, xét tiếp học bổng kỳ sau theo kết quả học tập.",
    deadline: "2026-12-30",
    link: "https://global.donga.ac.kr/",
    match_percent: 78.0,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.78,
      major_alignment: 0.86,
      language_score: 0.79,
      research_extracurricular: 0.70,
      vector_similarity: 0.82
    },
    gap_analysis: {
      strengths: [
        "Tiêu chí linh hoạt, ngưỡng xét tuyển phù hợp với phổ điểm GPA từ 2.3+ trở lên.",
        "Chi phí sinh hoạt tại Busan phải chăng, cơ hội việc làm thêm phong phú."
      ],
      gaps: [
        "Học bổng các kỳ tiếp theo phụ thuộc vào duy trì điểm số tại trường."
      ],
      checklist: [
        { document: "Bằng và bảng điểm đại học", status: "Đã có" },
        { document: "Kế hoạch học tập", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Hoàn thiện hồ sơ dịch thuật công chứng tiếng Anh/Hàn."
      ]
    },
    explanation: "Đại học Dong-A là lựa chọn an toàn với độ tương thích 78.0% (Group B), rất thích hợp cho ứng viên muốn du học Hàn Quốc với học phí được miễn giảm đáng kể."
  },
  {
    id: "kr-korea-univ-stem-2026",
    title: "[Hàn Quốc] Học bổng KU Global STEM Fellowship - Đại học Korea (Korea University)",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Khoa học Máy tính, Trí tuệ Nhân tạo, Kỹ thuật Y sinh",
    funding_type: "Toàn phần 100%",
    funding_details: "100% học phí và sinh hoạt phí 800,000 KRW/tháng từ quỹ nghiên cứu trọng điểm của trường.",
    deadline: "2026-10-30",
    link: "https://www.korea.edu/",
    match_percent: 87.8,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.87,
      major_alignment: 0.94,
      language_score: 0.85,
      research_extracurricular: 0.84,
      vector_similarity: 0.89
    },
    gap_analysis: {
      strengths: [
        "Khoa Khoa học Máy tính Đại học Korea có mạng lưới hợp tác sâu rộng với Samsung và Naver.",
        "Có điểm GPA và chứng chỉ ngoại ngữ phù hợp."
      ],
      gaps: [
        "Cần chuẩn bị đề tài nghiên cứu phù hợp với các hướng nghiên cứu của viện."
      ],
      checklist: [
        { document: "Bảng điểm đại học", status: "Đã có" },
        { document: "2 Thư giới thiệu", status: "Cần chuẩn bị" },
        { document: "Kế hoạch nghiên cứu", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Nộp hồ sơ trực tuyến qua cổng tuyển sinh quốc tế Korea University."
      ]
    },
    explanation: "Đại học Korea là 1 trong 3 trường SKY danh tiếng nhất Hàn Quốc. Tỷ lệ tương thích 87.8% (Group A) mở ra cơ hội nhận học bổng toàn phần danh giá."
  },

  // -------------------------------------------------------------------------
  // CÁC QUỐC GIA KHÁC (NHẬT BẢN, TRUNG QUỐC, MỸ, ANH, ĐỨC, ÚC, PHÁP, HÀ LAN...)
  // -------------------------------------------------------------------------
  {
    id: "cn-csc-tsinghua-2026",
    title: "[Trung Quốc] Học bổng Chính phủ Trung Quốc (CSC) - Đại học Thanh Hoa (Tsinghua University)",
    host_country: "Trung Quốc",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Khoa học Máy tính, Trí tuệ Nhân tạo, Kỹ thuật",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 100% học phí, cấp ký túc xá miễn phí, bảo hiểm y tế toàn diện và trợ cấp sinh hoạt 3,000 - 3,500 RMB/tháng.",
    deadline: "2026-12-15",
    link: "https://www.tsinghua.edu.cn/en/",
    match_percent: 94.2,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.92,
      major_alignment: 0.98,
      language_score: 0.90,
      research_extracurricular: 0.92,
      vector_similarity: 0.88
    },
    gap_analysis: {
      strengths: [
        "GPA vượt ngưỡng sàn của học bổng CSC.",
        "Chuyên ngành AI thuộc nhóm ưu tiên trọng điểm của trường.",
        "Đã có công trình nghiên cứu khoa học."
      ],
      gaps: [
        "Cần bản kế hoạch nghiên cứu (Study Plan) 800 - 1000 từ.",
        "Nên liên hệ trước với giáo sư hướng dẫn tại Tsinghua."
      ],
      checklist: [
        { document: "CV/Resume chuẩn học thuật", status: "Đã có" },
        { document: "Bảng điểm đại học", status: "Đã có" },
        { document: "Kế hoạch nghiên cứu", status: "Cần chuẩn bị" },
        { document: "2 Thư giới thiệu", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Soạn thảo Research Proposal gửi 2-3 Giáo sư tại Viện AI Tsinghua.",
        "Nộp hồ sơ trực tuyến trên cổng CSC trước ngày 15/12."
      ]
    },
    explanation: "Học bổng CSC tại Đại học Thanh Hoa có độ tương thích cao 94.2% (Group A)."
  },
  {
    id: "jp-mext-todai-2026",
    title: "[Nhật Bản] Học bổng Chính phủ MEXT - Đại học Tokyo (The University of Tokyo)",
    host_country: "Nhật Bản",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Trí tuệ Nhân tạo, Công nghệ Thông tin, Kỹ thuật",
    funding_type: "Toàn phần 100%",
    funding_details: "Đài thọ 100% học phí, vé máy bay khứ hồi, trợ cấp sinh hoạt 144,000 - 147,000 JPY/tháng.",
    deadline: "2026-11-20",
    link: "https://www.u-tokyo.ac.jp/en/",
    match_percent: 92.8,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.90,
      major_alignment: 0.96,
      language_score: 0.88,
      research_extracurricular: 0.90,
      vector_similarity: 0.85
    },
    gap_analysis: {
      strengths: [
        "IELTS đáp ứng tiêu chuẩn chương trình quốc tế dạy bằng tiếng Anh tại Todai.",
        "Năng lực học thuật phù hợp với các Lab nghiên cứu AI của Todai."
      ],
      gaps: [
        "Cần chuẩn bị đề cương nghiên cứu khi phỏng vấn với Giáo sư."
      ],
      checklist: [
        { document: "Field of Study & Research Plan", status: "Cần chuẩn bị" },
        { document: "Bảng điểm & Bằng đại học", status: "Đã có" }
      ],
      action_plan: [
        "Gửi cold email kèm CV cho Giáo sư chủ nhiệm Lab tại Todai."
      ]
    },
    explanation: "Đại học Tokyo là trường top 1 Nhật Bản. Hồ sơ của bạn đạt mức tương thích 92.8% (Group A)."
  },
    {
    id: "sg-nus-undergrad-2026",
    title: "[Singapore] Học bổng Tuyển sinh Cử nhân NUS Global Merit Scholarship – Đại học Quốc gia Singapore (NUS)",
    source_name: "Đại học Quốc gia Singapore (NUS)",
    host_country: "Singapore",
    degree_level: "Cử nhân",
    major_applied: "Kinh tế & Tài chính, Khoa học Máy tính, Trí tuệ Nhân tạo, Đa ngành",
    funding_type: "Toàn phần 100%",
    funding_details: "Tài trợ 100% học phí toàn khóa cử nhân 4 năm tại NUS, trợ cấp sinh hoạt 6,000 SGD/năm, trợ cấp máy tính 1,750 SGD và bảo đảm chỗ ở ký túc xá.",
    deadline: "2027-02-15",
    link: "https://www.nus.edu.sg/oam/scholarships",
    min_gpa: 3.0,
    min_ielts: 6.5,
    match_percent: 88.0,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.88,
      major_alignment: 0.94,
      language_score: 0.84,
      research_extracurricular: 0.80,
      vector_similarity: 0.92
    },
    gap_analysis: {
      strengths: [
        "Đại học Quốc gia Singapore (NUS) là trường đại học mục tiêu hàng đầu Châu Á.",
        "Ngành Kinh tế & Tài chính / Công nghệ có cơ hội việc làm vượt trội tại Singapore."
      ],
      gaps: [
        "Mức chuẩn GPA cạnh tranh khuyến nghị từ 3.2+/4.0 và IELTS 6.5+ để tăng cơ hội phỏng vấn học bổng 100%."
      ],
      checklist: [
        { document: "Học bạ THPT / Bảng điểm đại học", status: "Đã có" },
        { document: "Chứng chỉ ngoại ngữ IELTS / TOEFL", status: "Đã có" },
        { document: "Bài luận cá nhân (Personal Statement)", status: "Cần chuẩn bị" },
        { document: "Thư giới thiệu từ thầy cô / cố vấn", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Đăng ký nộp hồ sơ qua cổng NUS Office of Admissions trước hạn 15/02.",
        "Nhấn mạnh các dự án thực tế và tố chất lãnh đạo trong bài luận SOP."
      ]
    },
    explanation: "Đại học Quốc gia Singapore (NUS) phù hợp hoàn hảo với nguyện vọng học tập của bạn, chính sách xét tuyển mở rộng cho học sinh sinh viên Việt Nam."
  },
  {
    id: "sg-ntu-undergrad-2026",
    title: "[Singapore] Học bổng Toàn phần Bậc Cử nhân ASEAN Undergraduate Scholarship – Đại học Công nghệ Nanyang (NTU)",
    source_name: "Đại học Công nghệ Nanyang (NTU)",
    host_country: "Singapore",
    degree_level: "Cử nhân",
    major_applied: "Kinh tế, Tài chính, Kỹ thuật & Khoa học Máy tính",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 100% học phí toàn khóa đại học tại NTU kèm trợ cấp sinh hoạt 5,800 SGD/năm và trợ cấp ổn định 1,750 SGD.",
    deadline: "2027-01-31",
    link: "https://www.ntu.edu.sg/admissions/undergraduate/scholarships",
    min_gpa: 2.85,
    min_ielts: 6.0,
    match_percent: 86.5,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.86,
      major_alignment: 0.92,
      language_score: 0.85,
      research_extracurricular: 0.78,
      vector_similarity: 0.90
    },
    gap_analysis: {
      strengths: [
        "NTU là đại học hàng đầu thế giới về kỹ thuật, công nghệ và kinh doanh.",
        "Tiêu chí IELTS 6.0 và GPA của bạn đáp ứng tốt điều kiện xét tuyển ban đầu."
      ],
      gaps: [
        "Cần chuẩn bị tốt cho vòng phỏng vấn trực tuyến với hội đồng tuyển sinh NTU."
      ],
      checklist: [
        { document: "Bảng điểm học tập", status: "Đã có" },
        { document: "Chứng chỉ IELTS 6.0+", status: "Đã có" },
        { document: "Thư giới thiệu", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Nộp hồ sơ trực tuyến qua NTU Admissions Portal trước tháng 1.",
        "Luyện tập trả lời phỏng vấn về động lực học tập và đóng góp cộng đồng."
      ]
    },
    explanation: "Đại học Công nghệ Nanyang (NTU) là phương án liên quan chất lượng cao tại Singapore, tỷ lệ xét duyệt hồ sơ tiềm năng."
  },
  {
    id: "sg-smu-merit-2026",
    title: "[Singapore] Học bổng Tài năng Lee Kong Chian – Đại học Quản lý Singapore (SMU)",
    source_name: "Đại học Quản lý Singapore (SMU)",
    host_country: "Singapore",
    degree_level: "Cử nhân",
    major_applied: "Kinh tế & Tài chính, Quản trị Kinh doanh, Phân tích Kế toán & Dữ liệu",
    funding_type: "Toàn phần 100%",
    funding_details: "Học bổng lãnh đạo xuất sắc đài thọ toàn bộ học phí 4 năm tại SMU, trợ cấp sinh hoạt 5,000 SGD/năm và tài trợ máy tính học tập.",
    deadline: "2027-03-15",
    link: "https://admissions.smu.edu.sg/scholarships",
    min_gpa: 2.80,
    min_ielts: 6.0,
    match_percent: 85.0,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.85,
      major_alignment: 0.95,
      language_score: 0.84,
      research_extracurricular: 0.76,
      vector_similarity: 0.89
    },
    gap_analysis: {
      strengths: [
        "SMU là đại học chuyên sâu số 1 về Kinh tế, Tài chính và Quản lý tại trung tâm tài chính Singapore.",
        "Môi trường học tập theo phong cách tương tác hội thảo Mỹ (seminar-style)."
      ],
      gaps: [
        "Yêu cầu khả năng phản biện và giao tiếp tự tin khi phỏng vấn nhóm."
      ],
      checklist: [
        { document: "Bảng điểm chính thức", status: "Đã có" },
        { document: "Chứng chỉ tiếng Anh", status: "Đã có" },
        { document: "Bài luận cá nhân", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Chuẩn bị bài luận nêu bật định hướng nghề nghiệp trong lĩnh vực Tài chính / Kinh tế."
      ]
    },
    explanation: "Đại học Quản lý Singapore (SMU) là trường trọng điểm phù hợp nhất với chuyên ngành Kinh tế & Tài chính của bạn."
  },
  {
    id: "fi-hanken-merit-2026",
    title: "[Phần Lan] Học bổng Tuyển sinh & Miễn 100% Học phí Hanken Premium – Trường Kinh tế Hanken (Hanken School of Economics)",
    source_name: "Trường Kinh tế Hanken (Hanken School of Economics)",
    host_country: "Phần Lan",
    degree_level: "Cử nhân",
    major_applied: "Kinh tế & Tài chính, Quản trị Kinh doanh, Phân tích Kinh tế & Kinh doanh Quốc tế",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 100% học phí toàn bộ khóa học Cử nhân / Thạc sĩ tại Hanken School of Economics (Helsinki & Vaasa), kèm trợ cấp sinh hoạt 8,000 EUR/năm cho sinh viên quốc tế xuất sắc.",
    deadline: "2027-01-20",
    link: "https://www.hanken.fi/en/apply/scholarships",
    min_gpa: 2.80,
    min_ielts: 6.0,
    match_percent: 89.5,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.89,
      major_alignment: 0.98,
      language_score: 0.88,
      research_extracurricular: 0.82,
      vector_similarity: 0.94
    },
    gap_analysis: {
      strengths: [
        "Hanken School of Economics là trường kinh tế danh tiếng đạt 3 vương miện kiểm định quốc tế (Triple Crown AACSB, AMBA, EQUIS).",
        "Hồ sơ của bạn phù hợp 98% với định hướng chuyên ngành Kinh tế & Tài chính của trường.",
        "Điểm IELTS 6.0 và GPA 2.85 đạt chuẩn xét tuyển nhận học bổng miễn học phí của Hanken."
      ],
      gaps: [
        "Cần chuẩn bị thư động lực (Motivation Letter) nêu rõ lý do chọn Phần Lan và Hanken."
      ],
      checklist: [
        { document: "Bảng điểm THPT / Đại học dịch thuật công chứng", status: "Đã có" },
        { document: "Chứng chỉ ngoại ngữ IELTS 6.0+", status: "Đã có" },
        { document: "Thư bày tỏ nguyện vọng (Motivation Letter)", status: "Cần chuẩn bị" },
        { document: "Thư giới thiệu của giảng viên", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Nộp đơn qua cổng chung Studyinfo.fi của Phần Lan trong kỳ tuyển sinh tháng 1.",
        "Tích chọn mục 'Apply for Hanken Scholarship' ngay trên mẫu đơn trực tuyến."
      ]
    },
    explanation: "Trường Kinh tế Hanken là trường mục tiêu được đối soát theo đúng lựa chọn của bạn, độ tương thích 89.5% với chính sách học bổng cởi mở cho sinh viên Việt Nam."
  },
  {
    id: "fi-finland-scholarship-2026",
    title: "[Phần Lan] Học bổng Quốc gia Finland Scholarship – Bộ Giáo dục & Văn hóa Phần Lan",
    source_name: "Bộ Giáo dục & Văn hóa Phần Lan",
    host_country: "Phần Lan",
    degree_level: "Cử nhân",
    major_applied: "Đa ngành, Kinh tế & Tài chính, Công nghệ Thông tin, Thiết kế",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 100% học phí năm thứ nhất và trợ cấp tái định cư ban đầu 5,000 EUR dành cho sinh viên quốc tế xuất sắc nhập học các trường đại học Phần Lan.",
    deadline: "2027-01-18",
    link: "https://www.studyinfinland.fi/scholarships/finland-scholarships",
    min_gpa: 2.80,
    min_ielts: 6.0,
    match_percent: 88.0,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.88,
      major_alignment: 0.94,
      language_score: 0.85,
      research_extracurricular: 0.80,
      vector_similarity: 0.93
    },
    gap_analysis: {
      strengths: [
        "Học bổng chính phủ quốc gia uy tín bậc nhất tại Phần Lan.",
        "Quy trình xét duyệt tự động kết hợp cùng kỳ nộp hồ sơ chung Studyinfo.fi."
      ],
      gaps: [
        "Chỉ tiêu có giới hạn theo từng trường đại học tiếp nhận."
      ],
      checklist: [
        { document: "Hồ sơ học tập đầy đủ", status: "Đã có" },
        { document: "Chứng chỉ ngoại ngữ", status: "Đã có" }
      ],
      action_plan: [
        "Nộp đơn trong đợt tuyển sinh chung Joint Application vào tháng 1 hàng năm."
      ]
    },
    explanation: "Học bổng Quốc gia Finland Scholarship là phương án vươn tầm tuyệt vời để học tập tại nền giáo dục số 1 thế giới tại Phần Lan."
  },
  {
    id: "fi-aalto-excellence-2026",
    title: "[Phần Lan] Học bổng Tài năng Aalto University Scholarship – Đại học Aalto",
    source_name: "Đại học Aalto",
    host_country: "Phần Lan",
    degree_level: "Cử nhân",
    major_applied: "Kinh doanh & Kinh tế, Công nghệ Thông tin & Thiết kế",
    funding_type: "Toàn phần & Bán phần",
    funding_details: "Miễn 100% hoặc 50% học phí toàn khóa cử nhân 3 năm tại Đại học Aalto (Espoo/Helsinki), hỗ trợ chi phí học tập chuyên ngành.",
    deadline: "2027-01-15",
    link: "https://www.aalto.fi/en/admission-services/scholarships-and-tuition-fees",
    min_gpa: 3.0,
    min_ielts: 6.0,
    match_percent: 85.5,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.85,
      major_alignment: 0.92,
      language_score: 0.84,
      research_extracurricular: 0.78,
      vector_similarity: 0.90
    },
    gap_analysis: {
      strengths: [
        "Đại học Aalto là trường đại học danh tiếng số 1 Phần Lan về Đổi mới sáng tạo và Kinh doanh.",
        "Môi trường khởi nghiệp sinh viên năng động bậc nhất Châu Âu (Slush Festival)."
      ],
      gaps: [
        "Tỉ lệ chọi cao ở nhóm ngành Kinh doanh quốc tế (School of Business)."
      ],
      checklist: [
        { document: "Bảng điểm học tập", status: "Đã có" },
        { document: "Chứng chỉ IELTS", status: "Đã có" }
      ],
      action_plan: [
        "Đăng ký chương trình Cử nhân Kinh tế / Kinh doanh tại cơ sở Mikkeli hoặc Otaniemi."
      ]
    },
    explanation: "Đại học Aalto là phương án mở rộng xuất sắc cùng quốc gia Phần Lan, mang lại cơ hội nghề nghiệp toàn cầu."
  },
  {
    id: "fi-helsinki-global-2026",
    title: "[Phần Lan] Học bổng Sinh viên Quốc tế Xuất sắc – Đại học Helsinki (University of Helsinki)",
    source_name: "Đại học Helsinki (University of Helsinki)",
    host_country: "Phần Lan",
    degree_level: "Cử nhân",
    major_applied: "Khoa học Xã hội, Kinh tế học, Khoa học Máy tính & Y sinh",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 100% học phí toàn khóa và trợ cấp chi phí sinh hoạt 10,000 EUR/năm cho sinh viên có thành tích học thuật ấn tượng.",
    deadline: "2027-01-18",
    link: "https://www.helsinki.fi/en/admissions-and-education/apply-helsinki/scholarships-and-tuition-fees",
    min_gpa: 3.10,
    min_ielts: 6.5,
    match_percent: 84.0,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.84,
      major_alignment: 0.90,
      language_score: 0.82,
      research_extracurricular: 0.80,
      vector_similarity: 0.88
    },
    gap_analysis: {
      strengths: [
        "Trường đại học cổ kính và quy mô nghiên cứu lớn nhất Phần Lan (thành lập năm 1640)."
      ],
      gaps: [
        "Yêu cầu ngoại ngữ nâng cao IELTS 6.5+ để đạt suất học bổng kèm sinh hoạt phí."
      ],
      checklist: [
        { document: "Bảng điểm học tập", status: "Đã có" },
        { document: "Chứng chỉ ngoại ngữ IELTS", status: "Đã có" }
      ],
      action_plan: [
        "Tham khảo kỹ các ngành đào tạo bằng tiếng Anh tại Đại học Helsinki trên cổng Studyinfo."
      ]
    },
    explanation: "Đại học Helsinki là lựa chọn hàn lâm hàng đầu tại thủ đô Phần Lan phù hợp với định hướng phát triển lâu dài."
  },
  {
    id: "fi-tampere-undergrad-2026",
    title: "[Phần Lan] Học bổng Toàn phần Tampere University Global Student Award – Đại học Tampere",
    source_name: "Đại học Tampere",
    host_country: "Phần Lan",
    degree_level: "Cử nhân",
    major_applied: "Khoa học Máy tính, Kỹ thuật & Quản trị Kinh doanh",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 100% học phí toàn khóa cử nhân 3 năm tại Đại học Tampere cho toàn bộ chương trình cử nhân tiếng Anh.",
    deadline: "2027-01-15",
    link: "https://www.tuni.fi/en/study-with-us/how-to-apply/scholarships",
    min_gpa: 2.80,
    min_ielts: 6.0,
    match_percent: 87.0,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.87,
      major_alignment: 0.93,
      language_score: 0.85,
      research_extracurricular: 0.78,
      vector_similarity: 0.91
    },
    gap_analysis: {
      strengths: [
        "Thành phố sinh viên sôi động và trung tâm công nghệ cao lớn thứ 2 Phần Lan.",
        "Hồ sơ của bạn hoàn toàn đạt ngưỡng xét duyệt của học bổng Tampere."
      ],
      gaps: [
        "Nộp hồ sơ sớm trong tuần đầu tiên của kỳ tuyển sinh chung."
      ],
      checklist: [
        { document: "Bảng điểm học tập", status: "Đã có" },
        { document: "Chứng chỉ ngoại ngữ", status: "Đã có" }
      ],
      action_plan: [
        "Hoàn tất mẫu đơn trên Studyinfo.fi trước ngày 15/01."
      ]
    },
    explanation: "Đại học Tampere là phương án an toàn và vừa sức với học lực hiện tại của bạn tại Phần Lan."
  },
  {
    id: "sg-suss-postgrad-2026",
    title: "[Singapore] Học bổng Toàn phần & Bán phần – Đại học Khoa học Xã hội Singapore (SUSS)",
    source_name: "Đại học Khoa học Xã hội Singapore (SUSS)",
    host_country: "Singapore",
    degree_level: "Thạc sĩ",
    major_applied: "Khoa học Xã hội, Kinh tế & Quản lý, AI & Khoa học Dữ liệu",
    funding_type: "Toàn phần 100%",
    funding_details: "Tài trợ 100% học phí Thạc sĩ tại Đại học Khoa học Xã hội Singapore (SUSS), kèm trợ cấp nghiên cứu và hỗ trợ sinh hoạt.",
    deadline: "2027-03-31",
    link: "https://www.suss.edu.sg/admissions/postgraduate",
    min_gpa: 3.0,
    min_ielts: 6.0,
    match_percent: 86.5,
    tier_group: "Group B (Vừa sức - Đủ điều kiện)",
    score_breakdown: {
      academic_gpa: 0.86,
      major_alignment: 0.90,
      language_score: 0.82,
      research_extracurricular: 0.78,
      vector_similarity: 0.88
    },
    gap_analysis: {
      strengths: ["Ngành học hoàn toàn phù hợp với định hướng đào tạo của SUSS", "GPA đạt ngưỡng xét tuyển"],
      gaps: ["Nên thi nâng band IELTS lên 6.5 để tăng cơ hội học bổng 100%"],
      checklist: [
        { document: "Bảng điểm đại học", status: "Đã có" },
        { document: "CV tiếng Anh", status: "Đã có" },
        { document: "Chứng chỉ ngoại ngữ", status: "Cần bổ sung" },
        { document: "Bài luận SOP", status: "Cần chuẩn bị" }
      ],
      action_plan: ["Hoàn thiện bài luận SOP nhấn mạnh mục tiêu nghiên cứu tại SUSS.", "Nộp hồ sơ sớm trong đợt tuyển sinh đầu tiên."]
    },
    explanation: "Đại học Khoa học Xã hội Singapore (SUSS) ưu tiên ứng viên có định hướng ứng dụng thực tế. Hồ sơ của bạn đạt 86.5% tiêu chuẩn xét tuyển."
  },
{
    id: "sg-singa-nus-2026",
    title: "[Singapore] Học bổng SINGA (Singapore International Graduate Award) - NUS & NTU",
    host_country: "Singapore",
    degree_level: "Tiến sĩ",
    major_applied: "Khoa học Máy tính, Kỹ thuật Y sinh, Trí tuệ Nhân tạo",
    funding_type: "Toàn phần 100%",
    funding_details: "Toàn bộ học phí 4 năm, trợ cấp sinh hoạt 2,700 - 3,200 SGD/tháng, vé máy bay và trợ cấp ổn định nơi ở 1,000 SGD.",
    deadline: "2026-12-01",
    link: "https://www.a-star.edu.sg/Scholarships/",
    match_percent: 87.5,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.88,
      major_alignment: 0.93,
      language_score: 0.86,
      research_extracurricular: 0.86,
      vector_similarity: 0.81
    },
    gap_analysis: {
      strengths: ["Tiềm năng nghiên cứu tốt", "Tiếng Anh lưu loát"],
      gaps: ["Cần chuẩn bị kỹ cho vòng phỏng vấn A*STAR"],
      checklist: [{ document: "CV học thuật", status: "Đã có" }],
      action_plan: ["Nộp đơn trực tuyến SINGA trước ngày 01/12"]
    },
    explanation: "Học bổng SINGA Singapore đạt độ phù hợp 87.5% (Group A)."
  },
  {
    id: "us-fulbright-cmu-2026",
    title: "[Hoa Kỳ] Học bổng Fulbright Master's Fellowship - Carnegie Mellon University",
    host_country: "Hoa Kỳ",
    degree_level: "Thạc sĩ",
    major_applied: "Khoa học Máy tính, Kỹ thuật Phần mềm",
    funding_type: "Toàn phần 100%",
    funding_details: "Đài thọ toàn bộ học phí, sinh hoạt phí hàng tháng, vé máy bay khứ hồi và bảo hiểm y tế toàn diện.",
    deadline: "2026-10-15",
    link: "https://vn.usembassy.gov/education-culture/fulbright-program-vietnam/",
    match_percent: 86.4,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.88,
      major_alignment: 0.92,
      language_score: 0.85,
      research_extracurricular: 0.84,
      vector_similarity: 0.82
    },
    gap_analysis: {
      strengths: ["Có thành tích hoạt động xã hội", "Định hướng nghề nghiệp rõ ràng"],
      gaps: ["Khuyến khích thi thêm GRE"],
      checklist: [{ document: "3 Thư giới thiệu", status: "Cần chuẩn bị" }],
      action_plan: ["Hoàn thiện 2 bài luận cốt lõi của Fulbright"]
    },
    explanation: "Học bổng Fulbright tại Mỹ đạt 86.4% (Group A)."
  },
  {
    id: "uk-chevening-oxford-2026",
    title: "[Vương quốc Anh] Học bổng Chính phủ Chevening - University of Oxford",
    host_country: "Vương quốc Anh",
    degree_level: "Thạc sĩ",
    major_applied: "AI, Dữ liệu lớn, Chính sách Công nghệ",
    funding_type: "Toàn phần 100%",
    funding_details: "Toàn bộ học phí khóa Thạc sĩ 1 năm, sinh hoạt phí hàng tháng, vé máy bay khứ hồi.",
    deadline: "2026-11-05",
    link: "https://www.chevening.org/",
    match_percent: 85.0,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.86,
      major_alignment: 0.90,
      language_score: 0.86,
      research_extracurricular: 0.85,
      vector_similarity: 0.78
    },
    gap_analysis: {
      strengths: ["Kinh nghiệm làm việc tốt", "Định hướng đóng góp rõ ràng"],
      gaps: ["Cần thể hiện rõ nét tố chất lãnh đạo"],
      checklist: [{ document: "4 Bài luận Chevening", status: "Cần chuẩn bị" }],
      action_plan: ["Nộp đơn xin học bổng trước 05/11"]
    },
    explanation: "Học bổng Chevening danh giá tại Anh đạt 85.0% (Group A)."
  },
  {
    id: "de-daad-tum-2026",
    title: "[Đức] Học bổng DAAD Helmut-Schmidt - Đại học Kỹ thuật Munich (TU Munich)",
    host_country: "Đức",
    degree_level: "Thạc sĩ",
    major_applied: "Khoa học Máy tính, Phân tích Dữ liệu",
    funding_type: "Toàn phần 100%",
    funding_details: "Trợ cấp sinh hoạt 934 EUR/tháng, bảo hiểm y tế, miễn 100% học phí.",
    deadline: "2026-10-31",
    link: "https://www.daad.de/en/",
    match_percent: 83.5,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.85,
      major_alignment: 0.88,
      language_score: 0.84,
      research_extracurricular: 0.80,
      vector_similarity: 0.76
    },
    gap_analysis: {
      strengths: ["Miễn 100% học phí", "Chương trình dạy bằng tiếng Anh"],
      gaps: ["Cần thẩm tra APS"],
      checklist: [{ document: "Chứng chỉ APS", status: "Cần chuẩn bị" }],
      action_plan: ["Nộp thẩm tra APS sớm"]
    },
    explanation: "Học bổng DAAD tại TU Munich đạt 83.5% (Group B)."
  },
  {
    id: "au-awards-melbourne-2026",
    title: "[Úc] Học bổng Australia Awards (AAS) - University of Melbourne",
    host_country: "Úc",
    degree_level: "Thạc sĩ",
    major_applied: "Khoa học Dữ liệu, Chuyển đổi Số",
    funding_type: "Toàn phần 100%",
    funding_details: "Toàn bộ học phí, vé máy bay khứ hồi, trợ cấp ban đầu 5,000 AUD và sinh hoạt phí định kỳ.",
    deadline: "2026-04-30",
    link: "https://www.dfat.gov.au/people-to-people/australia-awards",
    match_percent: 82.0,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.84,
      major_alignment: 0.86,
      language_score: 0.85,
      research_extracurricular: 0.78,
      vector_similarity: 0.74
    },
    gap_analysis: {
      strengths: ["IELTS chuẩn tối thiểu", "Mục tiêu phát triển rõ ràng"],
      gaps: ["Cần nêu bật đóng góp phát triển cho Việt Nam"],
      checklist: [{ document: "Kế hoạch phát triển", status: "Cần chuẩn bị" }],
      action_plan: ["Nghiên cứu các lĩnh vực ưu tiên của AAS"]
    },
    explanation: "Học bổng AAS tại Đại học Melbourne đạt 82.0% (Group B)."
  },
    {
    id: "tw-cgu-postgrad-2026",
    title: "[Đài Loan] Học bổng Toàn phần Thạc sĩ & Tiến sĩ – Đại học Trường Canh (CGU)",
    source_name: "Đại học Trường Canh (CGU)",
    host_country: "Đài Loan",
    degree_level: "Thạc sĩ",
    major_applied: "Kỹ thuật, Trí tuệ Nhân tạo, Y sinh & Quản trị Kinh doanh",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 100% học phí và ký túc xá, cấp sinh hoạt phí hàng tháng (10.000 - 15.000 NTD/tháng) từ Quỹ Nghiên cứu Đại học Trường Canh (CGU).",
    deadline: "2027-04-15",
    link: "https://oia.cgu.edu.tw",
    min_gpa: 3.0,
    min_ielts: 5.5,
    match_percent: 88.0,
    tier_group: "Group B (Vừa sức - Đủ điều kiện)",
    score_breakdown: {
      academic_gpa: 0.88,
      major_alignment: 0.92,
      language_score: 0.85,
      research_extracurricular: 0.80,
      vector_similarity: 0.90
    },
    gap_analysis: {
      strengths: ["Đáp ứng trọn vẹn yêu cầu IELTS và GPA của Đại học Trường Canh", "Đồ án kỹ thuật và AI phù hợp với thế mạnh nghiên cứu của trường"],
      gaps: ["Cần hoàn thiện bản đề cương nghiên cứu (Study Plan) song ngữ"],
      checklist: [
        { document: "Bảng điểm đại học hợp pháp hóa", status: "Đã có" },
        { document: "Chứng chỉ ngoại ngữ", status: "Đã có" },
        { document: "Đề cương Study Plan", status: "Cần chuẩn bị" },
        { document: "Thư giới thiệu từ giảng viên", status: "Cần chuẩn bị" }
      ],
      action_plan: ["Liên hệ giáo sư phụ trách phòng lab tại CGU để xin thư chấp nhận hướng dẫn.", "Nộp hồ sơ trực tuyến qua cổng OIA CGU."]
    },
    explanation: "Đại học Trường Canh (CGU) là trường nghiên cứu tư thục hàng đầu Đài Loan. Hồ sơ của bạn rất mạnh và nằm trong diện ưu tiên cấp học bổng toàn phần."
  },
{
    id: "tw-moe-ntu-2026",
    title: "[Đài Loan] Học bổng Bộ Giáo dục Đài Loan (MOE) - Đại học Quốc gia Đài Loan (NTU)",
    host_country: "Đài Loan",
    degree_level: "Thạc sĩ",
    major_applied: "Kỹ thuật Điện tử, Khoa học Máy tính, Bán dẫn",
    funding_type: "Toàn phần 100%",
    funding_details: "Học phí lên đến 40,000 NTD/kỳ, trợ cấp sinh hoạt 20,000 NTD/tháng.",
    deadline: "2026-03-31",
    link: "https://www.ntu.edu.tw/english/",
    match_percent: 79.5,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.82,
      major_alignment: 0.85,
      language_score: 0.80,
      research_extracurricular: 0.75,
      vector_similarity: 0.74
    },
    gap_analysis: {
      strengths: ["Ngành bán dẫn và máy tính hàng đầu"],
      gaps: ["Nên học thêm tiếng Hoa cơ bản"],
      checklist: [{ document: "Kế hoạch học tập", status: "Cần chuẩn bị" }],
      action_plan: ["Nộp đơn xin học bổng qua TECO"]
    },
    explanation: "Học bổng MOE Đài Loan đạt 79.5% (Group B)."
  },
  {
    id: "fr-eiffel-sorbonne-2026",
    title: "[Pháp] Học bổng Xuất sắc Eiffel (Eiffel Excellence) - Đại học Sorbonne",
    host_country: "Pháp",
    degree_level: "Thạc sĩ",
    major_applied: "Khoa học Máy tính, Toán Ứng dụng",
    funding_type: "Trợ cấp sinh hoạt phí",
    funding_details: "Trợ cấp hàng tháng 1,181 EUR, vé máy bay khứ hồi, bảo hiểm y tế.",
    deadline: "2026-01-10",
    link: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence",
    match_percent: 78.2,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.80,
      major_alignment: 0.84,
      language_score: 0.82,
      research_extracurricular: 0.74,
      vector_similarity: 0.71
    },
    gap_analysis: {
      strengths: ["Chương trình dạy tiếng Anh tại Sorbonne"],
      gaps: ["Cần được trường tại Pháp tiến cử"],
      checklist: [{ document: "Thư đề cử của trường", status: "Cần chuẩn bị" }],
      action_plan: ["Liên hệ điều phối viên Sorbonne xin đề cử"]
    },
    explanation: "Học bổng Eiffel Pháp đạt 78.2% (Group B)."
  },
  {
    id: "ch-eth-excellence-2026",
    title: "[Thụy Sĩ] Học bổng Xuất sắc ETH Zurich Excellence (ESOP) - ETH Zurich",
    host_country: "Thụy Sĩ",
    degree_level: "Thạc sĩ",
    major_applied: "Khoa học Máy tính, Hệ thống Tự động",
    funding_type: "Toàn phần 100%",
    funding_details: "Trợ cấp sinh hoạt 12,000 CHF/học kỳ, miễn 100% học phí.",
    deadline: "2026-12-15",
    link: "https://ethz.ch/en/",
    match_percent: 68.4,
    tier_group: "Group C (Thử thách - Khoảng cách tiêu chí lớn)",
    score_breakdown: {
      academic_gpa: 0.72,
      major_alignment: 0.85,
      language_score: 0.75,
      research_extracurricular: 0.60,
      vector_similarity: 0.58
    },
    gap_analysis: {
      strengths: ["Khớp hoàn toàn chuyên ngành"],
      gaps: ["Yêu cầu GPA ≥ 3.8/4.0 và điểm GRE Quantitative 165+"],
      checklist: [{ document: "Chứng chỉ GRE", status: "Cần chuẩn bị" }],
      action_plan: ["Ôn thi GRE để bù đắp điểm GPA"]
    },
    explanation: "ETH Zurich là đại học hàng đầu châu Âu. Độ tương thích 68.4% (Group C - Thử thách)."
  },
  {
    id: "ca-vanier-cgs-2026",
    title: "[Canada] Học bổng Chính phủ Vanier Canada Graduate Scholarship (Vanier CGS)",
    host_country: "Canada",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Khoa học Tự nhiên, Kỹ thuật & Khoa học Máy tính",
    funding_type: "Toàn phần 100%",
    funding_details: "Trợ cấp sinh hoạt 50,000 CAD/năm trong 3 năm, tài trợ nghiên cứu toàn diện.",
    deadline: "2026-11-01",
    link: "https://vanier.gc.ca/en/home-accueil.html",
    match_percent: 82.5,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.80,
      major_alignment: 0.92,
      language_score: 0.85,
      research_extracurricular: 0.80,
      vector_similarity: 0.90
    },
    gap_analysis: {
      strengths: ["Phù hợp chuyên ngành nghiên cứu ứng dụng"],
      gaps: ["Cần thư giới thiệu của giáo sư Canada và đề cương nghiên cứu chi tiết"],
      checklist: [{ document: "Đề cương nghiên cứu (Research Proposal)", status: "Cần chuẩn bị" }],
      action_plan: ["Liên hệ giáo sư hướng dẫn tại các trường đại học Canada (UofT, UBC, McGill)"]
    },
    explanation: "Học bổng danh giá bậc nhất Canada dành cho nghiên cứu sinh quốc tế xuất sắc."
  },
  {
    id: "ca-uoft-fellowship-2026",
    title: "[Canada] Học bổng Sau Đại học Đại học Toronto (University of Toronto Fellowship)",
    host_country: "Canada",
    degree_level: "Thạc sĩ",
    major_applied: "Khoa học Máy tính, Trí tuệ Nhân tạo",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn toàn bộ học phí và trợ cấp sinh hoạt 25,000 CAD/năm.",
    deadline: "2026-12-15",
    link: "https://www.utoronto.ca/",
    match_percent: 76.8,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.75,
      major_alignment: 0.95,
      language_score: 0.78,
      research_extracurricular: 0.70,
      vector_similarity: 0.88
    },
    gap_analysis: {
      strengths: ["Chuyên ngành AI phù hợp cao với phòng Lab tại Toronto"],
      gaps: ["Điểm GPA cần tối thiểu 3.3/4.0 hoặc tương đương B+"],
      checklist: [{ document: "Bảng điểm và bài luận SOP", status: "Cần chuẩn bị" }],
      action_plan: ["Nâng cao điểm IELTS lên 7.0 và hoàn thiện bài luận cá nhân"]
    },
    explanation: "Đại học Toronto là trung tâm nghiên cứu AI hàng đầu thế giới với học bổng hấp dẫn."
  },
  {
    id: "kr-hanyang-hiea-2026",
    title: "[Hàn Quốc] Học bổng Hanyang International Excellence Award (HIEA) - Đại học Hanyang",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ / Cử nhân",
    major_applied: "Khoa học Máy tính, Trí tuệ Nhân tạo, Kỹ thuật Kiến trúc & Robot",
    funding_type: "Toàn phần & Bán phần",
    funding_details: "Miễn 50% - 100% học phí toàn khóa học cho sinh viên quốc tế xuất sắc.",
    deadline: "2026-11-20",
    link: "https://oia.hanyang.ac.kr/",
    match_percent: 85.0,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.85,
      major_alignment: 0.94,
      language_score: 0.82,
      research_extracurricular: 0.80,
      vector_similarity: 0.90
    },
    gap_analysis: {
      strengths: [
        "Đại học Hanyang là trường đại học kỹ thuật công nghệ và đổi mới sáng tạo hàng đầu Seoul.",
        "Chính sách học bổng đa dạng từ 50% đến 100% học phí kỳ đầu và kỳ tiếp theo dựa trên GPA."
      ],
      gaps: [
        "Cần duy trì GPA từ 3.20/4.0 để đạt mức miễn 100% học phí cao nhất.",
        "Khuyến khích có chứng chỉ ngoại ngữ IELTS 6.0 trở lên hoặc TOPIK 3+."
      ],
      checklist: [
        { document: "Bảng điểm đại học", status: "Đã có" },
        { document: "Kế hoạch học tập SOP", status: "Cần chuẩn bị" },
        { document: "Thư giới thiệu của giảng viên", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Nộp hồ sơ trực tuyến qua cổng tuyển sinh quốc tế của Hanyang University (OIA).",
        "Tập trung bài luận thể hiện thế mạnh kỹ thuật và tiềm năng nghiên cứu công nghệ."
      ]
    },
    explanation: "Đại học Hanyang có thế mạnh vượt trội về Kỹ thuật & Khoa học Máy tính, độ tương thích 85% phù hợp cho lộ trình du học chất lượng cao tại Seoul."
  },
  {
    id: "kr-kyunghee-global-2026",
    title: "[Hàn Quốc] Học bổng Sinh viên Quốc tế Xuất sắc - Đại học Kyung Hee (Kyung Hee University)",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ / Cử nhân",
    major_applied: "Trí tuệ Nhân tạo, Công nghệ Thông tin, Quản trị Quốc tế",
    funding_type: "Bán phần đến Toàn phần",
    funding_details: "Miễn 50% - 100% học phí kỳ đầu tiên, học bổng duy trì xét theo kết quả học tập từng học kỳ.",
    deadline: "2026-12-10",
    link: "https://www.khu.ac.kr/eng/",
    match_percent: 82.5,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.82,
      major_alignment: 0.90,
      language_score: 0.80,
      research_extracurricular: 0.78,
      vector_similarity: 0.88
    },
    gap_analysis: {
      strengths: [
        "Đại học Kyung Hee là trường đại học quốc tế hóa hàng đầu Seoul với môi trường học tập đa văn hóa.",
        "Điều kiện xét tuyển thân thiện cho sinh viên quốc tế ngành Khoa học Kỹ thuật."
      ],
      gaps: [
        "IELTS tối thiểu 5.5 (đạt chuẩn xét tuyển cơ sở, khuyến khích 6.0 để ưu tiên học bổng toàn phần)."
      ],
      checklist: [
        { document: "Bảng điểm và bằng tốt nghiệp", status: "Đã có" },
        { document: "Chứng chỉ ngoại ngữ", status: "Đã có" },
        { document: "Bài luận cá nhân", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Đăng ký nộp hồ sơ qua hệ thống tuyển sinh sinh viên quốc tế Kyung Hee University."
      ]
    },
    explanation: "Đại học Kyung Hee là lựa chọn vừa sức với tỉ lệ cấp học bổng cao, rất phù hợp với năng lực hiện tại của bạn."
  },
  {
    id: "kr-skku-ggs-2026",
    title: "[Hàn Quốc] Học bổng Nghiên cứu Sinh Quốc tế SKKU Global Graduate Scholarship (GGS) - Đại học Sungkyunkwan",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Khoa học Máy tính, Trí tuệ Nhân tạo, Công nghệ Bán dẫn",
    funding_type: "Toàn phần 100%",
    funding_details: "Đài thọ 100% học phí toàn khóa + trợ cấp sinh hoạt 600,000 - 1,000,000 KRW/tháng được tập đoàn Samsung đồng tài trợ.",
    deadline: "2026-11-15",
    link: "https://www.skku.edu/eng/",
    match_percent: 86.8,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.87,
      major_alignment: 0.96,
      language_score: 0.84,
      research_extracurricular: 0.85,
      vector_similarity: 0.92
    },
    gap_analysis: {
      strengths: [
        "SKKU được tài trợ bởi Samsung, là trung tâm công nghệ bán dẫn & AI số 1 Hàn Quốc.",
        "Học bổng GGS đài thọ trọn gói học phí và chi phí sinh hoạt."
      ],
      gaps: [
        "Yêu cầu GPA từ 3.20/4.0 trở lên và có định hướng nghiên cứu rõ ràng."
      ],
      checklist: [
        { document: "Bảng điểm đại học", status: "Đã có" },
        { document: "Đề cương nghiên cứu (Research Proposal)", status: "Cần chuẩn bị" }
      ],
      action_plan: [
        "Liên hệ trước với Giáo sư phòng Lab AI/Bán dẫn tại SKKU để nhận thư bảo trợ."
      ]
    },
    explanation: "Học bổng SKKU GGS là cơ hội vươn tầm tuyệt vời với sự bảo trợ của Samsung."
  },
  {
    id: "kr-sogang-graduate-2026",
    title: "[Hàn Quốc] Học bổng Sau Đại học Toàn phần & Bán phần - Đại học Sogang (Sogang University)",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ",
    major_applied: "Khoa học Máy tính, Trí tuệ Nhân tạo, Quản trị Công nghệ",
    funding_type: "Bán phần đến Toàn phần",
    funding_details: "Miễn 50% - 100% học phí toàn khóa, ưu tiên cho sinh viên ngành STEM và Khoa học Tự nhiên.",
    deadline: "2026-11-25",
    link: "https://wwwe.sogang.ac.kr/",
    match_percent: 81.2,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.81,
      major_alignment: 0.91,
      language_score: 0.80,
      research_extracurricular: 0.76,
      vector_similarity: 0.87
    },
    gap_analysis: {
      strengths: ["Đại học Sogang là trường đại học danh tiếng tại Seoul với chất lượng đào tạo hàng đầu."],
      gaps: ["Cần nâng điểm GPA hoặc bổ sung bài luận để cạnh tranh suất học bổng 100%."],
      checklist: [{ document: "Bảng điểm và CV", status: "Đã có" }],
      action_plan: ["Nộp hồ sơ trực tuyến qua cổng Sogang Graduate Admissions."]
    },
    explanation: "Đại học Sogang có chính sách học bổng linh hoạt và vị trí trung tâm Seoul thuận lợi."
  },
  {
    id: "kr-ewha-egpp-2026",
    title: "[Hàn Quốc] Học bổng Toàn phần Ewha Global Partnership Program (EGPP) - Đại học Nữ sinh Ewha",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ",
    major_applied: "Trí tuệ Nhân tạo, Khoa học Máy tính, Kỹ thuật Hệ thống Thông tin",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 100% học phí, đài thọ ký túc xá và sinh hoạt phí hàng tháng cho nữ sinh tài năng quốc tế.",
    deadline: "2026-10-30",
    link: "https://www.ewha.ac.kr/ewhaen/",
    match_percent: 83.5,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.83,
      major_alignment: 0.92,
      language_score: 0.82,
      research_extracurricular: 0.80,
      vector_similarity: 0.89
    },
    gap_analysis: {
      strengths: ["Đại học nữ danh giá số 1 châu Á với quỹ học bổng quốc tế EGPP danh tiếng."],
      gaps: ["Cần bài luận chứng minh tiềm năng lãnh đạo của phụ nữ trong ngành STEM."],
      checklist: [{ document: "Bài luận lãnh đạo", status: "Cần chuẩn bị" }],
      action_plan: ["Chuẩn bị hồ sơ EGPP nộp trực tiếp cho văn phòng sinh viên quốc tế Ewha."]
    },
    explanation: "Học bổng toàn phần EGPP tại Ewha là cơ hội danh giá cho nữ ứng viên ngành công nghệ."
  },
  {
    id: "kr-cau-global-2026",
    title: "[Hàn Quốc] Học bổng Sinh viên Quốc tế CAU - Đại học Chung-Ang (Chung-Ang University)",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ / Cử nhân",
    major_applied: "Khoa học Máy tính, AI & Khoa học Dữ liệu",
    funding_type: "Bán phần đến Toàn phần",
    funding_details: "Miễn 50% - 100% học phí kỳ đầu tiên cho sinh viên quốc tế có hồ sơ xuất sắc.",
    deadline: "2026-12-01",
    link: "https://neweng.cau.ac.kr/",
    match_percent: 81.8,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.82,
      major_alignment: 0.90,
      language_score: 0.80,
      research_extracurricular: 0.77,
      vector_similarity: 0.88
    },
    gap_analysis: {
      strengths: ["Đại học Chung-Ang có môi trường quốc tế năng động và vị trí đắc địa tại Seoul."],
      gaps: ["Cần hoàn thiện hồ sơ học bổng sớm trước hạn chót."],
      checklist: [{ document: "Bảng điểm và chứng chỉ ngoại ngữ", status: "Đã có" }],
      action_plan: ["Nộp hồ sơ trực tuyến qua cổng CAU Admissions."]
    },
    explanation: "Lựa chọn thực tế và phù hợp với hồ sơ ứng viên tại Hàn Quốc."
  },
  {
    id: "kr-inha-jungseok-2026",
    title: "[Hàn Quốc] Học bổng Toàn phần Jungseok International - Đại học Inha (Inha University)",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ",
    major_applied: "Trí tuệ Nhân tạo, Kỹ thuật Hàng không, Khoa học Máy tính",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 100% học phí toàn khóa học + trợ cấp sinh hoạt từ các dự án nghiên cứu của phòng Lab.",
    deadline: "2026-11-28",
    link: "https://eng.inha.ac.kr/",
    match_percent: 84.5,
    tier_group: "Group B (Tiềm năng - Cần cải thiện nhẹ)",
    score_breakdown: {
      academic_gpa: 0.84,
      major_alignment: 0.93,
      language_score: 0.81,
      research_extracurricular: 0.82,
      vector_similarity: 0.89
    },
    gap_analysis: {
      strengths: ["Thế mạnh hàng đầu về kỹ thuật và công nghệ tại vùng thủ đô Incheon."],
      gaps: ["Cần liên hệ giáo sư hướng dẫn Lab để được bảo lãnh học bổng Jungseok."],
      checklist: [{ document: "CV nghiên cứu và SOP", status: "Cần chuẩn bị" }],
      action_plan: ["Gửi email kèm CV cho các Giáo sư phụ trách Lab AI/CS tại Inha."]
    },
    explanation: "Đại học Inha có nguồn học bổng dồi dào cho sinh viên kỹ thuật và IT quốc tế."
  },
  {
    id: "kr-sejong-ai-2026",
    title: "[Hàn Quốc] Học bổng Tài năng AI & Kỹ thuật - Đại học Sejong (Sejong University)",
    host_country: "Hàn Quốc",
    degree_level: "Thạc sĩ",
    major_applied: "Trí tuệ Nhân tạo, Khoa học Dữ liệu, Kỹ thuật Phần mềm",
    funding_type: "Toàn phần & Bán phần",
    funding_details: "Miễn 70% - 100% học phí kỳ đầu và hỗ trợ nghiên cứu sinh hoạt phí hàng tháng.",
    deadline: "2026-12-05",
    link: "https://en.sejong.ac.kr/",
    match_percent: 86.0,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.86,
      major_alignment: 0.95,
      language_score: 0.83,
      research_extracurricular: 0.82,
      vector_similarity: 0.90
    },
    gap_analysis: {
      strengths: ["Đại học Sejong xếp hạng top đầu Hàn Quốc về Trí tuệ Nhân tạo và Khoa học Máy tính."],
      gaps: ["Cần hoàn thiện kế hoạch học tập chi tiết về mô hình AI."],
      checklist: [{ document: "Bảng điểm và chứng chỉ IELTS", status: "Đã có" }],
      action_plan: ["Đăng ký trực tiếp trên cổng tuyển sinh quốc tế Sejong University."]
    },
    explanation: "Đại học Sejong là điểm đến lý tưởng cho chuyên ngành Trí tuệ Nhân tạo."
  },
  {
    id: "us-harvard-fellowship-2026",
    title: "[Hoa Kỳ] Học bổng Sau Đại học Harvard University Fellowship - Đại học Harvard",
    host_country: "Hoa Kỳ",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Khoa học Máy tính, Trí tuệ Nhân tạo, Khoa học Dữ liệu",
    funding_type: "Toàn phần 100%",
    funding_details: "Tài trợ toàn bộ học phí, bảo hiểm y tế và trợ cấp sinh hoạt $45,000/năm.",
    deadline: "2026-12-15",
    link: "https://www.harvard.edu/",
    match_percent: 78.5,
    tier_group: "Group A (Vươn tầm - Cần bổ sung tiêu chí)",
    score_breakdown: {
      academic_gpa: 0.80,
      major_alignment: 0.95,
      language_score: 0.80,
      research_extracurricular: 0.85,
      vector_similarity: 0.90
    },
    gap_analysis: {
      strengths: ["Môi trường học thuật đỉnh cao Ivy League, quỹ tài trợ nghiên cứu hàng đầu thế giới."],
      gaps: [
        "Yêu cầu GPA xuất sắc (3.6+/4.0) và IELTS 7.5+ hoặc TOEFL iBT 100+.",
        "Cần có bài báo khoa học công bố quốc tế hoặc đóng góp mã nguồn mở nổi bật."
      ],
      checklist: [
        { document: "Bảng điểm và bằng cử nhân", status: "Đã có" },
        { document: "3 Thư giới thiệu của GS đầu ngành", status: "Cần chuẩn bị" },
        { document: "Bài luận cá nhân SOP xuất sắc", status: "Cần chuẩn bị" }
      ],
      action_plan: ["Nâng cao điểm ngoại ngữ lên 7.5+ và xuất bản 1-2 công trình nghiên cứu."]
    },
    explanation: "Mục tiêu vươn tầm đỉnh cao tại trường đại học số 1 nước Mỹ."
  },
  {
    id: "us-stanford-knight-hennessy-2026",
    title: "[Hoa Kỳ] Học bổng Toàn phần Knight-Hennessy Scholars - Đại học Stanford",
    host_country: "Hoa Kỳ",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Trí tuệ Nhân tạo, Khoa học Máy tính, Kỹ thuật Hệ thống",
    funding_type: "Toàn phần 100%",
    funding_details: "Đài thọ trọn gói học phí, sinh hoạt phí, chi phí học tập và vé máy bay khứ hồi hàng năm.",
    deadline: "2026-10-15",
    link: "https://knight-hennessy.stanford.edu/",
    match_percent: 77.0,
    tier_group: "Group A (Vươn tầm - Cần bổ sung tiêu chí)",
    score_breakdown: {
      academic_gpa: 0.79,
      major_alignment: 0.96,
      language_score: 0.80,
      research_extracurricular: 0.84,
      vector_similarity: 0.91
    },
    gap_analysis: {
      strengths: ["Trung tâm của Thung lũng Silicon và là cái nôi của AI hiện đại."],
      gaps: ["Cạnh tranh toàn cầu cực kỳ khốc liệt, đòi hỏi năng lực lãnh đạo và tư duy đột phá."],
      checklist: [{ document: "Hồ sơ Knight-Hennessy độc lập", status: "Cần chuẩn bị" }],
      action_plan: ["Chuẩn bị hồ sơ ứng tuyển song song cho Stanford và chương trình Knight-Hennessy."]
    },
    explanation: "Học bổng danh giá bậc nhất thế giới dành cho các nhà lãnh đạo công nghệ tương lai."
  },
  {
    id: "us-mit-fellowship-2026",
    title: "[Hoa Kỳ] Học bổng Trợ lý Nghiên cứu & Giảng dạy Sau Đại học (RA/TA) - Viện Công nghệ Massachusetts (MIT)",
    host_country: "Hoa Kỳ",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Trí tuệ Nhân tạo, Robot & Khoa học Máy tính (EECS)",
    funding_type: "Toàn phần 100%",
    funding_details: "Miễn 100% học phí toàn khóa và nhận lương trợ lý nghiên cứu $3,800/tháng.",
    deadline: "2026-12-15",
    link: "https://www.mit.edu/",
    match_percent: 79.0,
    tier_group: "Group A (Vươn tầm - Cần bổ sung tiêu chí)",
    score_breakdown: {
      academic_gpa: 0.82,
      major_alignment: 0.98,
      language_score: 0.80,
      research_extracurricular: 0.86,
      vector_similarity: 0.93
    },
    gap_analysis: {
      strengths: ["Viện nghiên cứu Kỹ thuật và AI số 1 thế giới."],
      gaps: ["Cần kinh nghiệm nghiên cứu thực chiến và bài báo khoa học xuất sắc."],
      checklist: [{ document: "Portfolio dự án AI và mã nguồn GitHub", status: "Đã có" }],
      action_plan: ["Liên hệ các giáo sư Lab CSAIL tại MIT để trao đổi về hướng đề tài."]
    },
    explanation: "Đỉnh cao nghiên cứu công nghệ thông tin và trí tuệ nhân tạo toàn cầu."
  },
  {
    id: "uk-cambridge-gates-2026",
    title: "[Vương quốc Anh] Học bổng Toàn phần Gates Cambridge Scholarship - Đại học Cambridge",
    host_country: "Vương quốc Anh",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Khoa học Máy tính, Trí tuệ Nhân tạo, Kỹ thuật Thông tin",
    funding_type: "Toàn phần 100%",
    funding_details: "Đài thọ toàn bộ học phí Cambridge, sinh hoạt phí £20,000/năm và vé máy bay khứ hồi.",
    deadline: "2026-12-05",
    link: "https://www.gatescambridge.org/",
    match_percent: 79.5,
    tier_group: "Group A (Vươn tầm - Cần bổ sung tiêu chí)",
    score_breakdown: {
      academic_gpa: 0.82,
      major_alignment: 0.95,
      language_score: 0.82,
      research_extracurricular: 0.84,
      vector_similarity: 0.90
    },
    gap_analysis: {
      strengths: ["Một trong những đại học nghiên cứu lâu đời và danh giá nhất lịch sử nhân loại."],
      gaps: ["Yêu cầu IELTS 7.5 (không kỹ năng nào dưới 7.0) và thành tích học tập xuất sắc."],
      checklist: [{ document: "Chứng chỉ IELTS 7.5+", status: "Cần chuẩn bị" }],
      action_plan: ["Luyện thi nâng band IELTS lên tối thiểu 7.5 trước kỳ nộp hồ sơ."]
    },
    explanation: "Học bổng Gates Cambridge do Bill & Melinda Gates Foundation tài trợ trọn gói."
  },
  {
    id: "jp-kyoto-mext-2026",
    title: "[Nhật Bản] Học bổng Sau Đại học & Chính phủ MEXT - Đại học Kyoto (Kyoto University)",
    host_country: "Nhật Bản",
    degree_level: "Thạc sĩ / Tiến sĩ",
    major_applied: "Trí tuệ Nhân tạo, Tin học Thông tin, Kỹ thuật",
    funding_type: "Toàn phần 100%",
    funding_details: "Đài thọ 100% học phí, sinh hoạt phí 147,000 JPY/tháng và vé máy bay khứ hồi.",
    deadline: "2026-11-10",
    link: "https://www.kyoto-u.ac.jp/en",
    match_percent: 85.5,
    tier_group: "Group A (Đủ điều kiện xét tuyển)",
    score_breakdown: {
      academic_gpa: 0.85,
      major_alignment: 0.94,
      language_score: 0.83,
      research_extracurricular: 0.83,
      vector_similarity: 0.91
    },
    gap_analysis: {
      strengths: ["Đại học Kyoto là cái nôi khoa học của nhiều giải Nobel nhất châu Á."],
      gaps: ["Cần chuẩn bị Đề cương nghiên cứu (Research Proposal) kỹ lưỡng."],
      checklist: [{ document: "Đề cương nghiên cứu bằng tiếng Anh", status: "Cần chuẩn bị" }],
      action_plan: ["Tìm giáo sư hướng dẫn tại Kyoto University và xin thư đồng ý tiếp nhận."]
    },
    explanation: "Học bổng MEXT tại Kyoto University là lựa chọn danh giá hàng đầu châu Á."
  }
];
