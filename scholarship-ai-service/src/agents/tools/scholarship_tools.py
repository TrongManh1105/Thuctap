import logging
from typing import Optional
from langchain_core.tools import tool
from sqlalchemy import text
from src.infrastructure.db.postgres import AsyncSessionLocal

logger = logging.getLogger(__name__)


@tool
async def search_scholarships_tool(
    country: Optional[str] = None,
    degree_level: Optional[str] = None,
    major: Optional[str] = None,
    keyword: Optional[str] = None,
) -> str:
    """
    Tra cứu danh sách học bổng du học thực tế từ cơ sở dữ liệu dựa trên tiêu chí:
    - country: Quốc gia du học (ví dụ: Hàn Quốc, Anh, Úc, Mỹ, Đức...)
    - degree_level: Bậc học (Cử nhân, Thạc sĩ, Tiến sĩ)
    - major: Chuyên ngành (AI, Khoa học máy tính, Kinh tế...)
    - keyword: Từ khóa tìm kiếm tự do
    """
    conditions = ["1=1"]
    params = {}

    if country:
        conditions.append("host_country ILIKE :country")
        params["country"] = f"%{country.strip()}%"
    if degree_level:
        conditions.append("degree_level ILIKE :deg")
        params["deg"] = f"%{degree_level.strip()}%"
    if major:
        conditions.append("(major_applied ILIKE :major OR major_applied ILIKE '%Mọi ngành%')")
        params["major"] = f"%{major.strip()}%"
    if keyword:
        conditions.append("(title ILIKE :kw OR funding_details ILIKE :kw)")
        params["kw"] = f"%{keyword.strip()}%"

    where_sql = " AND ".join(conditions)
    sql = f"""
        SELECT title, host_country, degree_level, funding_type, funding_details,
               min_gpa, min_ielts, deadline, link
        FROM scholarships
        WHERE {where_sql}
        ORDER BY created_at DESC
        LIMIT 5
    """

    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text(sql), params)
            rows = result.mappings().all()
            if not rows:
                return "Không tìm thấy học bổng nào khớp với tiêu chí của bạn trong hệ thống."

            output = ["KẾT QUẢ TÌM THẤY:"]
            for idx, r in enumerate(rows, 1):
                output.append(
                    f"{idx}. {r['title']} - Quốc gia: {r['host_country']} ({r['degree_level']})\n"
                    f"   - Mức tài trợ: {r['funding_type']} | Hạn nộp: {r['deadline']}\n"
                    f"   - Yêu cầu: GPA sàn {r['min_gpa'] or 'Không bắt buộc'} | IELTS {r['min_ielts'] or 'Không bắt buộc'}\n"
                    f"   - Link chính thức: {r['link']}\n"
                )
            return "\n".join(output)
    except Exception as exc:
        logger.error(f"[Tool] Lỗi khi tìm học bổng: {exc}")
        return f"Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu: {exc}"
