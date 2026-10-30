/**
 * ScholarMatch AI - Demo Dataset & Reference Data
 * Rich catalog of international scholarships across Asia, Europe, North America, and Oceania.
 * Includes complete 5-Factor White-box scores and detailed Gap Analysis.
 */

export const DEMO_PROFILE = {
  full_name: "Nguyễn Trọng Mạnh Tiến",
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
  }
];
