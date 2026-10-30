from typing import Any
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from src.agents.state import AgentState
from src.agents.tools.scholarship_tools import search_scholarships_tool
from src.core.llm_manager import get_llm
from src.core.prompts import SCHOLARSHIP_COUNSELOR_SYSTEM

tools = [search_scholarships_tool]


async def call_model(state: AgentState):
    """Gọi LLM sinh câu trả lời và quyết định gọi tool."""
    llm = get_llm(tools=tools)
    messages = state["messages"]

    # Đảm bảo System Message luôn đứng đầu
    if not messages or getattr(messages[0], "type", "") != "system":
        from langchain_core.messages import SystemMessage
        messages = [SystemMessage(content=SCHOLARSHIP_COUNSELOR_SYSTEM)] + list(messages)

    response = await llm.ainvoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState):
    """Router: Kiểm tra xem LLM có yêu cầu gọi Tool không."""
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
    return END


def create_scholarship_agent_graph(checkpointer: Any = None):
    """Khởi tạo State Machine LangGraph cho Chatbot Tư vấn Du học."""
    workflow = StateGraph(AgentState)

    workflow.add_node("agent", call_model)
    workflow.add_node("tools", ToolNode(tools))

    workflow.set_entry_point("agent")

    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            END: END,
        },
    )

    workflow.add_edge("tools", "agent")
    return workflow.compile(checkpointer=checkpointer)
