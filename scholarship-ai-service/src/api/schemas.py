from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CandidateProfileInput(BaseModel):
    full_name: str = Field(default="Ứng viên", description="Họ và tên")
    target_degree: str = Field(default="Thạc sĩ", description="Bậc học mong muốn: Cử nhân, Thạc sĩ, Tiến sĩ")
    major: str = Field(description="Chuyên ngành học thuật")
    gpa: float = Field(ge=0.0, le=4.0, description="Điểm trung bình tích lũy thang 4.0")
    ielts: Optional[float] = Field(default=0.0, ge=0.0, le=9.0, description="Điểm IELTS")
    topik_level: Optional[int] = Field(default=0, ge=0, le=6, description="Cấp độ tiếng Hàn TOPIK (0-6)")
    preferred_countries: Optional[List[str]] = Field(default_factory=list, description="Danh sách quốc gia mong muốn")
    work_experience_years: Optional[float] = Field(default=0.0, ge=0.0)
    research_experience_years: Optional[float] = Field(default=0.0, ge=0.0)
    publications_count: Optional[int] = Field(default=0, ge=0)
    awards_count: Optional[int] = Field(default=0, ge=0)
    statement_of_purpose: Optional[str] = Field(default="", description="Mục tiêu hoặc bài luận ngắn")
    profile_vector: Optional[List[float]] = Field(default=None, description="Vector 1024-dim nếu đã tính trước")


class MatchRequest(BaseModel):
    candidate_profile: CandidateProfileInput
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    top_k: int = Field(default=50, ge=1, le=200)
    final_limit: int = Field(default=10, ge=1, le=50)
    explain: bool = Field(default=True, description="Sinh văn bản giải thích bằng LLM cho top N")
    explain_top_n: int = Field(default=3, ge=1, le=10)


class ScholarshipResult(BaseModel):
    id: Any
    title: str
    host_country: Optional[str] = None
    degree_level: Optional[str] = None
    major_applied: Optional[str] = None
    funding_type: Optional[str] = None
    funding_details: Optional[str] = None
    deadline: Optional[str] = None
    link: Optional[str] = None
    match_percent: float
    tier_group: str
    score_breakdown: Dict[str, float]
    gap_analysis: Optional[Dict[str, Any]] = None
    explanation: Optional[str] = None


class MatchResponse(BaseModel):
    total_found: int
    scholarships: List[ScholarshipResult]


class ScholarshipCatalogItem(BaseModel):
    id: Any
    title: str
    source_name: Optional[str] = None
    host_country: Optional[str] = None
    degree_level: Optional[str] = None
    major_applied: Optional[str] = None
    funding_type: Optional[str] = None
    funding_details: Optional[str] = None
    min_gpa: Optional[float] = None
    min_ielts: Optional[float] = None
    min_work_exp_years: Optional[float] = None
    deadline: Optional[str] = None
    apply_method: Optional[str] = None
    link: Optional[str] = None
    checklist: Optional[Any] = None
    commitment: Optional[str] = None
    tier_group: Optional[str] = "GROUP A"


class CatalogResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[ScholarshipCatalogItem]


class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str


class ChatStreamRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = Field(default_factory=list)
    candidate_profile: Optional[CandidateProfileInput] = None
