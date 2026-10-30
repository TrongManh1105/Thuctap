import json
import logging
import asyncio
from fastapi import APIRouter, Depends
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from sse_starlette.sse import EventSourceResponse
from src.api.schemas import ChatStreamRequest
from src.core.security import verify_api_key
from src.agents.graph import create_scholarship_agent_graph
from src.core.prompts import SCHOLARSHIP_COUNSELOR_SYSTEM
from src.core.pii import redact_pii

router = APIRouter(tags=["Scholarship Counselor Chatbot"])
logger = logging.getLogger(__name__)


def _sse(payload: dict) -> dict:
    return {"event": "message", "data": json.dumps(payload, ensure_ascii=False)}


@router.post(
    "/api/v1/scholarships/chat/stream",
    dependencies=[Depends(verify_api_key)],
    summary="Chatbot Tư vấn Du học Streaming (SSE)",
)
async def chat_stream(request: ChatStreamRequest):
    graph = create_scholarship_agent_graph()

    # Xây dựng danh sách tin nhắn
    context_str = ""
    if request.candidate_profile:
        p = request.candidate_profile
        context_str = (
            f"\nNGỮ CẢNH ỨNG VIÊN: Ngành: {p.major}, Bậc học: {p.target_degree}, "
            f"GPA: {p.gpa}/4.0, IELTS: {p.ielts}, TOPIK: {p.topik_level}, "
            f"Quốc gia mong muốn: {', '.join(p.preferred_countries or []) or 'Chưa xác định'}"
        )

    system_prompt = SCHOLARSHIP_COUNSELOR_SYSTEM + context_str
    messages = [SystemMessage(content=system_prompt)]

    for msg in request.history or []:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            messages.append(AIMessage(content=msg.content))

    sanitized_user_msg = redact_pii(request.message)
    messages.append(HumanMessage(content=sanitized_user_msg))

    initial_state = {
        "messages": messages,
        "candidate_context": request.candidate_profile.model_dump() if request.candidate_profile else {},
    }

    async def event_generator():
        yield _sse({"type": "thinking", "content": "Đang tra cứu cơ sở dữ liệu học bổng..."})
        try:
            # LangGraph astream
            async for chunk, metadata in graph.astream(initial_state, stream_mode="messages"):
                # Chỉ stream token từ node agent (bỏ qua tool output thô)
                if isinstance(metadata, dict) and metadata.get("langgraph_node") == "agent":
                    if getattr(chunk, "content", None):
                        yield _sse({"type": "token", "content": str(chunk.content)})
            yield _sse({"type": "done"})
        except Exception as exc:
            logger.error(f"[ChatStream] Lỗi xử lý: {exc}")
            yield _sse({"type": "error", "content": f"Đã có lỗi xảy ra: {str(exc)}"})

    return EventSourceResponse(event_generator())
