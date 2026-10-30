import asyncio
import sys
from sqlalchemy import text

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from src.infrastructure.db.postgres import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as session:
        res = await session.execute(text('SELECT host_country, count(*) as cnt FROM scholarships GROUP BY host_country ORDER BY cnt DESC LIMIT 30'))
        for r in res:
            print(f'{r.host_country}: {r.cnt}')

asyncio.run(check())
