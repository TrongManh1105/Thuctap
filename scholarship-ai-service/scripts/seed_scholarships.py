"""
Script nạp toàn bộ dữ liệu học bổng từ file CSV chuẩn hóa vào cơ sở dữ liệu PostgreSQL.
Chạy: python -m scripts.seed_scholarships
"""

import asyncio
import csv
import os
import re
import sys
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from src.infrastructure.db.postgres import AsyncSessionLocal


def parse_min_gpa(gpa_str: str) -> Optional[float]:
    if not gpa_str:
        return None
    match_4 = re.search(r"(\d+\.\d+)\s*/\s*4\.0", gpa_str)
    if match_4:
        return float(match_4.group(1))
    match_10 = re.search(r"(\d+\.?\d*)\s*/\s*10", gpa_str)
    if match_10:
        val = float(match_10.group(1))
        return round((val / 10.0) * 4.0, 2)
    match_num = re.search(r"(\d+\.\d+)", gpa_str)
    if match_num:
        val = float(match_num.group(1))
        return val if val <= 4.0 else round((val / 10.0) * 4.0, 2)
    return None


def parse_min_ielts(ielts_str: str) -> Optional[float]:
    if not ielts_str:
        return None
    match = re.search(r"(\d+\.\d+|\d+)", ielts_str)
    if match:
        val = float(match.group(1))
        if 4.0 <= val <= 9.0:
            return val
    return None


async def seed_data(csv_path: str):
    if not os.path.exists(csv_path):
        print(f"[-] Không tìm thấy file CSV tại: {csv_path}")
        return

    print(f"[+] Bắt đầu đọc file: {csv_path}")
    items_to_insert: List[Dict[str, Any]] = []

    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get("Tên học bổng") or row.get("title") or ""
            if not title:
                continue

            source_name = row.get("Nguồn") or row.get("source_name") or "Khác"
            host_country = row.get("Quốc gia") or row.get("host_country") or "Tất cả"
            degree_level = row.get("Bậc học") or row.get("degree_level") or "Thạc sĩ"
            major_applied = row.get("Chuyên ngành áp dụng") or row.get("major_applied") or "Mọi ngành"
            funding_type = row.get("Mức tài trợ") or row.get("funding_type") or "Toàn phần"
            funding_details = row.get("Chi tiết quyền lợi (Học phí, Sinh hoạt phí, Vé máy bay)") or row.get("funding_details") or ""
            raw_gpa = row.get("GPA tối thiểu") or ""
            raw_ielts = row.get("Yêu cầu ngoại ngữ (IELTS/TOEFL/TOPIK)") or ""
            deadline = row.get("Hạn nộp & Chu kỳ tuyển sinh") or row.get("deadline") or "Xem chi tiết"
            link = row.get("Link chi tiết") or row.get("link") or ""
            checklist = row.get("Hồ sơ cần chuẩn bị (Checklist)") or ""
            commitment = row.get("Ràng buộc & Cam kết") or ""

            min_gpa = parse_min_gpa(raw_gpa)
            min_ielts = parse_min_ielts(raw_ielts)

            raw_content = f"{title}. Quốc gia: {host_country}. Bậc học: {degree_level}. Ngành: {major_applied}. Quyền lợi: {funding_details}"

            items_to_insert.append({
                "title": title[:500],
                "source_name": source_name[:150],
                "host_country": host_country[:150],
                "degree_level": degree_level[:100],
                "major_applied": major_applied,
                "funding_type": funding_type[:100],
                "funding_details": funding_details,
                "min_gpa": min_gpa,
                "min_ielts": min_ielts,
                "deadline": deadline[:250],
                "link": link,
                "checklist": checklist,
                "commitment": commitment,
                "raw_content": raw_content,
            })

    print(f"[+] Đã xử lý {len(items_to_insert)} học bổng từ file CSV.")

    insert_sql = text("""
        INSERT INTO scholarships (
            title, source_name, host_country, degree_level, major_applied,
            funding_type, funding_details, min_gpa, min_ielts, deadline,
            link, checklist, commitment, raw_content
        ) VALUES (
            :title, :source_name, :host_country, :degree_level, :major_applied,
            :funding_type, :funding_details, :min_gpa, :min_ielts, :deadline,
            :link, :checklist, :commitment, :raw_content
        )
    """)

    async with AsyncSessionLocal() as session:
        try:
            for item in items_to_insert:
                await session.execute(insert_sql, item)
            await session.commit()
            print(f"[✅] Đã nạp thành công {len(items_to_insert)} học bổng vào cơ sở dữ liệu PostgreSQL!")
        except Exception as exc:
            await session.rollback()
            print(f"[-] Lỗi khi nạp dữ liệu vào DB: {exc}")


if __name__ == "__main__":
    # Đường dẫn file CSV mặc định
    default_csv = r"d:\Audio & Speech\scholarship_system\data\all_scholarships_combined.csv"
    if len(sys.argv) > 1:
        default_csv = sys.argv[1]
    asyncio.run(seed_data(default_csv))
