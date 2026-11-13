import asyncio
import logging
logging.basicConfig(level=logging.INFO)

from src.infrastructure.db.postgres import AsyncSessionLocal
from src.retrieval.pipeline import run_scholarship_pipeline

candidate_profile = {
    "id": "test-candidate-1",
    "full_name": "Nguyễn Minh Trang",
    "degree_level": "Thạc sĩ",
    "target_degree": "Thạc sĩ",
    "major": "Kinh tế & Tài chính",
    "gpa": 3.6,
    "gpa_scale": 4.0,
    "english_test": "IELTS",
    "english_score": 8.0,
    "preferred_countries": ["Singapore", "Phần Lan"],
    "target_universities": ["Đại học Quốc gia Singapore (NUS)", "Đại học Aalto (Phần Lan)"]
}
filters = {"limit": 20}

async def main():
    async with AsyncSessionLocal() as db:
        res, target_status, target_gaps = await run_scholarship_pipeline(
            session=db,
            candidate_profile=candidate_profile,
            filters=filters,
            final_limit=20
        )
        print("Status:", target_status)
        print("Total items:", len(res))
        for i, s in enumerate(res, 1):
            print(f"{i}. [{s.get('host_country')}] {s.get('title')} ({s.get('source_name')}) - Tier: {s.get('tier_group')}")

if __name__ == "__main__":
    asyncio.run(main())
