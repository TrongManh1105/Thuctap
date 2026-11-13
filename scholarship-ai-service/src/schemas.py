import re
import json
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, model_validator


class ExtractedCandidateProfile(BaseModel):
    full_name: Optional[str] = Field(None, description="Họ và tên ứng viên")
    major: Optional[str] = Field(None, description="Chuyên ngành")
    gpa_scale_4: Optional[float] = Field(None, description="Điểm GPA quy đổi về thang 4.0")
    gpa_raw: Optional[str] = Field(None, description="Điểm GPA nguyên bản trong CV")
    ielts_score: Optional[float] = Field(None, description="Điểm IELTS nếu có")
    topik_level: Optional[int] = Field(None, description="Cấp độ TOPIK nếu có")
    research_papers_count: int = Field(0, description="Số bài báo nghiên cứu")
    awards_count: int = Field(0, description="Số giải thưởng học thuật/cuộc thi")
    target_countries: List[str] = Field(default_factory=list, description="Quốc gia mong muốn")
    raw_summary: Optional[str] = Field(None, description="Tóm tắt điểm mạnh hồ sơ")

    # Trường tương thích ngược & mở rộng cho Frontend UI
    gpa: Optional[float] = Field(None, description="Điểm GPA hệ 4.0 (alias)")
    has_gpa: Optional[bool] = Field(None, description="Có điểm GPA hay không")
    ielts: Optional[float] = Field(None, description="Điểm IELTS (alias)")
    has_english: Optional[bool] = Field(None, description="Có chứng chỉ ngoại ngữ hay không")
    english_score: Optional[str] = Field(None, description="Mô tả chứng chỉ tiếng Anh")
    publications_count: Optional[int] = Field(0, description="Số bài báo xuất bản (alias)")
    narrative: Optional[str] = Field(None, description="Tóm tắt hồ sơ (alias)")
    skills: List[str] = Field(default_factory=list, description="Danh sách kỹ năng")
    featured_projects: List[str] = Field(default_factory=list, description="Dự án nổi bật")
    coursework: List[str] = Field(default_factory=list, description="Môn học tiêu biểu")
    university: Optional[str] = Field(None, description="Cơ sở đào tạo / Trường đại học")
    target_degree: Optional[str] = Field("Thạc sĩ/Cử nhân", description="Bậc học mục tiêu")
    extraction_engine: Optional[str] = Field("Gemini AI + PyMuPDF", description="Engine bóc tách")

    @field_validator('gpa_scale_4', mode='before')
    @classmethod
    def parse_and_normalize_gpa(cls, v):
        if v is None or v == "" or v == "null":
            return None
        if isinstance(v, (int, float)):
            val = float(v)
            if 4.0 < val <= 10.0:
                return round((val / 10.0) * 4.0, 2)
            return min(val, 4.0)
        if isinstance(v, str):
            match = re.search(r"(\d+(\.\d+)?)", v)
            if match:
                val = float(match.group(1))
                if 4.0 < val <= 10.0:
                    return round((val / 10.0) * 4.0, 2)
                return min(val, 4.0)
        return None

    @model_validator(mode='after')
    def sync_compatibility_fields(self):
        # Đồng bộ gpa và gpa_scale_4
        if self.gpa is None and self.gpa_scale_4 is not None:
            self.gpa = self.gpa_scale_4
        elif self.gpa_scale_4 is None and self.gpa is not None:
            self.gpa_scale_4 = self.gpa
        self.has_gpa = bool(self.gpa_scale_4 is not None and self.gpa_scale_4 > 0)

        # Đồng bộ ielts và ielts_score
        if self.ielts is None and self.ielts_score is not None:
            self.ielts = self.ielts_score
        elif self.ielts_score is None and self.ielts is not None:
            self.ielts_score = self.ielts
        if self.ielts_score is not None and self.ielts_score > 0:
            self.has_english = True
            if not self.english_score:
                self.english_score = f"IELTS {self.ielts_score}"

        # Đồng bộ publications_count và research_papers_count
        if (self.publications_count is None or self.publications_count == 0) and self.research_papers_count > 0:
            self.publications_count = self.research_papers_count
        elif (self.research_papers_count == 0) and self.publications_count and self.publications_count > 0:
            self.research_papers_count = self.publications_count

        # Đồng bộ narrative và raw_summary
        if not self.narrative and self.raw_summary:
            self.narrative = self.raw_summary
        elif not self.raw_summary and self.narrative:
            self.raw_summary = self.narrative

        return self


def clean_llm_json_response(raw_response: str) -> dict:
    text = raw_response.strip()
    # Loại bỏ thẻ suy nghĩ <think>...</think> nếu dùng DeepSeek R1 / Gemini Thinking
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        text = json_match.group(0)
    return json.loads(text)

