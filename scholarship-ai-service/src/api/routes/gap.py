from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.schemas import CandidateProfileInput
from src.core.security import verify_api_key
from src.infrastructure.db.postgres import get_db
from src.retrieval.gap_analysis import perform_gap_analysis

router = APIRouter(tags=["Gap Analysis"])


class GapAnalysisRequest(BaseModel):
    scholarship_id: str
    candidate_profile: CandidateProfileInput


@router.post(
    "/api/v1/scholarships/gap-analysis",
    dependencies=[Depends(verify_api_key)],
    summary="Phân tích Khoảng cách Tiêu chuẩn Chi tiết (Strengths vs Gaps)",
)
async def get_scholarship_gap(
    request: GapAnalysisRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    # Truy vấn học bổng từ DB
    query = text("""
        SELECT id, title, host_country, degree_level, major_applied,
               funding_type, funding_details, min_gpa, min_ielts, min_work_exp_years,
               deadline, checklist, commitment, link
        FROM scholarships
        WHERE id::text = :sid OR id::varchar = :sid
        LIMIT 1
    """)
    result = await db.execute(query, {"sid": request.scholarship_id})
    row = result.mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Không tìm thấy học bổng với ID đã cho.")

    analysis = perform_gap_analysis(dict(row), request.candidate_profile.model_dump())
    return analysis
