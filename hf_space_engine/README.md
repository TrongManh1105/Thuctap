---
title: Scholarship AI Engine
emoji: 🎓
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Scholarship AI Engine (BGE-M3 & Cross-Encoder)
Backend AI chuyên trách cho Hệ thống Gợi ý Học bổng Du học (ScholarMatch AI).
Cung cấp:
- `/embed`: Sinh vector BGE-M3 (1024 chiều)
- `/rerank`: Chấm điểm Cross-Encoder (bge-reranker-v2-m3)
