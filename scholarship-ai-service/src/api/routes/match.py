import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from src.api.schemas import MatchRequest, MatchResponse, CatalogResponse, ScholarshipCatalogItem
from src.core.security import verify_api_key
from src.infrastructure.db.postgres import get_db
from src.retrieval.pipeline import run_scholarship_pipeline

router = APIRouter(tags=["Scholarship Matching & Catalog"])
logger = logging.getLogger(__name__)


@router.get(
    "/api/v1/scholarships/catalog",
    response_model=CatalogResponse,
    summary="Kho Học Bổng Toàn Cầu (7,940+ học bổng, Phân trang, Tìm kiếm, Lọc)",
)
async def get_scholarship_catalog(
    page: int = Query(1, ge=1, description="Số trang hiện tại (bắt đầu từ 1)"),
    limit: int = Query(24, ge=1, le=100, description="Số lượng học bổng mỗi trang"),
    search: Optional[str] = Query(None, description="Từ khóa tìm kiếm tiêu đề, trường, ngành, quốc gia"),
    country: Optional[str] = Query(None, description="Bộ lọc quốc gia"),
    funding: Optional[str] = Query(None, description="Bộ lọc mức tài trợ: full, partial, tuition"),
    tier: Optional[str] = Query(None, description="Phân khúc học bổng: a, b, c"),
    sort_by: Optional[str] = Query("recent", description="Sắp xếp: recent, gpa_desc, gpa_asc, deadline"),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    where_clauses = ["1=1"]
    params: Dict[str, Any] = {"limit": limit, "offset": offset}

    # Tìm kiếm theo từ khóa
    if search and search.strip():
        term = f"%{search.strip()}%"
        where_clauses.append("(title ILIKE :search OR host_country ILIKE :search OR source_name ILIKE :search OR major_applied ILIKE :search)")
        params["search"] = term

    # Bộ lọc quốc gia
    if country and country.strip() and country.strip().lower() != "all":
        c_clean = country.strip().lower()
        if c_clean in ["korea", "hàn quốc"]:
            where_clauses.append("(host_country ILIKE '%Hàn Quốc%' OR host_country ILIKE '%Korea%')")
        elif c_clean in ["japan", "nhật bản"]:
            where_clauses.append("(host_country ILIKE '%Nhật Bản%' OR host_country ILIKE '%Japan%')")
        elif c_clean in ["china", "trung quốc"]:
            where_clauses.append("(host_country ILIKE '%Trung Quốc%' OR host_country ILIKE '%China%')")
        elif c_clean in ["usa", "hoa kỳ", "mỹ"]:
            where_clauses.append("(host_country ILIKE '%Hoa Kỳ%' OR host_country ILIKE '%Mỹ%' OR host_country ILIKE '%USA%' OR host_country ILIKE '%United States%')")
        elif c_clean in ["uk", "anh", "vương quốc anh"]:
            where_clauses.append("(host_country ILIKE '%Anh%' OR host_country ILIKE '%UK%' OR host_country ILIKE '%United Kingdom%')")
        elif c_clean in ["germany", "đức"]:
            where_clauses.append("(host_country ILIKE '%Đức%' OR host_country ILIKE '%Germany%')")
        elif c_clean in ["australia", "úc"]:
            where_clauses.append("(host_country ILIKE '%Úc%' OR host_country ILIKE '%Australia%')")
        elif c_clean in ["canada"]:
            where_clauses.append("(host_country ILIKE '%Canada%')")
        elif c_clean in ["france", "pháp"]:
            where_clauses.append("(host_country ILIKE '%Pháp%' OR host_country ILIKE '%France%')")
        elif c_clean in ["netherlands", "hà lan"]:
            where_clauses.append("(host_country ILIKE '%Hà Lan%' OR host_country ILIKE '%Netherlands%')")
        elif c_clean in ["singapore"]:
            where_clauses.append("(host_country ILIKE '%Singapore%')")
        elif c_clean in ["sweden", "thụy điển"]:
            where_clauses.append("(host_country ILIKE '%Thụy Điển%' OR host_country ILIKE '%Sweden%')")
        elif c_clean in ["switzerland", "thụy sĩ"]:
            where_clauses.append("(host_country ILIKE '%Thụy Sĩ%' OR host_country ILIKE '%Switzerland%')")
        elif c_clean in ["asia", "châu á"]:
            where_clauses.append("(host_country ILIKE ANY(ARRAY['%Hàn Quốc%', '%Nhật Bản%', '%Trung Quốc%', '%Singapore%', '%Đài Loan%', '%Thái Lan%']))")
        elif c_clean in ["eu_us", "châu âu & mỹ", "châu âu", "mỹ"]:
            where_clauses.append("(host_country ILIKE ANY(ARRAY['%Hoa Kỳ%', '%Mỹ%', '%Anh%', '%Đức%', '%Pháp%', '%Hà Lan%', '%Thụy Điển%', '%Thụy Sĩ%', '%Canada%', '%Úc%']))")
        else:
            where_clauses.append("host_country ILIKE :country_param")
            params["country_param"] = f"%{country.strip()}%"

    # Bộ lọc tài trợ
    if funding and funding.strip() and funding.strip().lower() != "all":
        f_clean = funding.strip().lower()
        if f_clean == "full":
            where_clauses.append("(funding_type ILIKE '%Toàn phần%' OR funding_type ILIKE '%100%')")
        elif f_clean == "partial":
            where_clauses.append("(funding_type ILIKE '%Bán phần%' OR funding_type ILIKE '%50%')")
        elif f_clean == "tuition":
            where_clauses.append("(funding_type ILIKE '%Học phí%' OR funding_type ILIKE '%Tuition%')")

    # Bộ lọc phân khúc (Tier)
    if tier and tier.strip() and tier.strip().lower() != "all":
        t_clean = tier.strip().lower()
        if t_clean == "a":
            where_clauses.append("(min_gpa >= 3.2 OR funding_type ILIKE '%Toàn phần%')")
        elif t_clean == "b":
            where_clauses.append("(min_gpa >= 2.8 AND min_gpa < 3.2)")
        elif t_clean == "c":
            where_clauses.append("(min_gpa < 2.8 OR min_gpa IS NULL)")

    where_sql = " AND ".join(where_clauses)

    # Sắp xếp
    if sort_by == "gpa_desc":
        order_sql = "min_gpa DESC NULLS LAST, created_at DESC"
    elif sort_by == "gpa_asc":
        order_sql = "min_gpa ASC NULLS LAST, created_at DESC"
    elif sort_by == "deadline":
        order_sql = "deadline ASC NULLS LAST, created_at DESC"
    else:
        order_sql = "created_at DESC NULLS LAST"

    try:
        # Truy vấn tổng số lượng bản ghi thỏa mãn điều kiện
        count_query = f"SELECT count(*) FROM scholarships WHERE {where_sql}"
        count_res = await db.execute(text(count_query), params)
        total_count = count_res.scalar() or 0

        # Truy vấn danh sách học bổng phân trang
        items_query = f"""
            SELECT id, title, source_name, host_country, degree_level,
                   major_applied, funding_type, funding_details,
                   min_gpa, min_ielts, min_work_exp_years,
                   deadline, apply_method, link, checklist, commitment
            FROM scholarships
            WHERE {where_sql}
            ORDER BY {order_sql}
            LIMIT :limit OFFSET :offset
        """
        items_res = await db.execute(text(items_query), params)
        raw_items = items_res.mappings().all()

        items = []
        for r in raw_items:
            gpa = float(r["min_gpa"]) if r["min_gpa"] is not None else None
            ielts = float(r["min_ielts"]) if r["min_ielts"] is not None else None
            f_type = r["funding_type"] or ""
            
            # Phân loại tier
            if (gpa and gpa >= 3.2) or "Toàn phần" in f_type or "100%" in f_type:
                t_group = "GROUP A"
            elif gpa and gpa >= 2.8:
                t_group = "GROUP B"
            else:
                t_group = "GROUP C"

            items.append(
                ScholarshipCatalogItem(
                    id=str(r["id"]),
                    title=r["title"] or "Học bổng du học",
                    source_name=r["source_name"],
                    host_country=r["host_country"],
                    degree_level=r["degree_level"],
                    major_applied=r["major_applied"],
                    funding_type=r["funding_type"],
                    funding_details=r["funding_details"],
                    min_gpa=gpa,
                    min_ielts=ielts,
                    min_work_exp_years=float(r["min_work_exp_years"]) if r["min_work_exp_years"] is not None else None,
                    deadline=str(r["deadline"]) if r["deadline"] else None,
                    apply_method=r["apply_method"],
                    link=r["link"],
                    checklist=r["checklist"],
                    commitment=r["commitment"],
                    tier_group=t_group,
                )
            )

        return CatalogResponse(
            total=total_count,
            page=page,
            limit=limit,
            items=items,
        )

    except Exception as exc:
        logger.error(f"[Catalog] Lỗi truy vấn kho học bổng: {exc}", exc_info=True)
        return CatalogResponse(
            total=0,
            page=page,
            limit=limit,
            items=[],
        )


@router.post(
    "/api/v1/scholarships/match",
    response_model=MatchResponse,
    dependencies=[Depends(verify_api_key)],
    summary="Bộ máy Khớp nối Học bổng Du học Đa tầng",
    description="Chạy qua Recall pgvector -> Rerank 5 yếu tố học thuật -> Gap Analysis -> Grounded LLM Explanation",
)
async def match_scholarships(
    request: MatchRequest,
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"[Match] Bắt đầu tìm kiếm học bổng cho ứng viên: {request.candidate_profile.full_name} ({request.candidate_profile.major})")
    
    results = await run_scholarship_pipeline(
        session=db,
        candidate_profile=request.candidate_profile.model_dump(),
        filters=request.filters,
        top_k=request.top_k,
        final_limit=request.final_limit,
        explain=request.explain,
        explain_top_n=request.explain_top_n,
    )

    return MatchResponse(
        total_found=len(results),
        scholarships=results,
    )
