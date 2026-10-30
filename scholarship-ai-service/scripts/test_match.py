import asyncio
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, root_dir)

from src.infrastructure.db.postgres import AsyncSessionLocal
from src.retrieval.pipeline import run_scholarship_pipeline


async def main():
    candidate_profile = {
        "full_name": "Nguyễn Trọng Mạnh Tiến",
        "target_degree": "Thạc sĩ",
        "major": "Trí tuệ Nhân tạo / Khoa học Máy tính",
        "gpa": 3.4,
        "ielts": 6.5,
        "topik_level": 3,
        "preferred_countries": ["Hoa Kỳ", "Anh", "Hàn Quốc"],
        "work_experience_years": 1.5,
        "research_experience_years": 1.0,
        "publications_count": 1,
        "awards_count": 2,
    }

    print("=" * 80)
    print(f"BẮT ĐẦU CHẠY THỬ NGHIỆM MATCHING CHO: {candidate_profile['full_name']}")
    print(f"Tiêu chuẩn: GPA {candidate_profile['gpa']}/4.0 | IELTS {candidate_profile['ielts']} | TOPIK {candidate_profile['topik_level']}")
    print("=" * 80)

    async with AsyncSessionLocal() as session:
        results = await run_scholarship_pipeline(
            session=session,
            candidate_profile=candidate_profile,
            top_k=20,
            final_limit=3,
            explain=False,
        )

        if not results:
            print("Chưa có kết quả.")
            return

        for idx, item in enumerate(results, 1):
            print(f"\n[{idx}] {item['title']}")
            print(f"     * ĐỘ TƯƠNG THÍCH: {item['match_percent']}% | {item['tier_group']}")
            print(f"     * Quốc gia: {item['host_country']} | Bậc: {item['degree_level']} | Mức: {item['funding_type']}")
            print(f"     * Điểm thành phần: {item['score_breakdown']}")
            print(f"     * Lời giải thích: {item.get('explanation')}")
            
            gap = item.get("gap_analysis")
            if gap:
                print(f"     * Điểm mạnh (Strengths):")
                for s in gap.get("strengths", []):
                    print(f"       + {s}")
                print(f"     * Cần bổ sung (Gaps):")
                for g in gap.get("gaps", []):
                    print(f"       ! {g}")
                print(f"     * Kế hoạch hành động (Action Plan):")
                for a in gap.get("action_plan", []):
                    print(f"       -> {a}")


if __name__ == "__main__":
    asyncio.run(main())
