import asyncio
import os
import sys

# Đảm bảo UTF-8 trên Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, root_dir)

from src.infrastructure.db.postgres import check_db_connection, AsyncSessionLocal
from sqlalchemy import text

async def main():
    print("=" * 60)
    print("KIEM TRA KET NOI SUPABASE TU SCHOLARSHIP AI SERVICE")
    print("=" * 60)
    success = await check_db_connection()
    if not success:
        print("[-] Ket noi that bai!")
        return

    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT id, title, host_country, degree_level, funding_type, min_gpa, min_ielts FROM scholarships LIMIT 3"))
        rows = result.mappings().all()
        print("\n[+] Doc thu 3 hoc bong dau tien tu Supabase:")
        for idx, r in enumerate(rows, 1):
            print(f" {idx}. {r['title']}")
            print(f"    Quoc gia: {r['host_country']} | Bac hoc: {r['degree_level']} | Muc tai tro: {r['funding_type']}")
            print(f"    GPA san: {r['min_gpa']} | IELTS san: {r['min_ielts']}")

    print("\n[OK] HOAN TAT: Backend moi da ket noi va doc du lieu Supabase 100% thanh cong!")

if __name__ == "__main__":
    asyncio.run(main())
