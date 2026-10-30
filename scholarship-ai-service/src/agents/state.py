from typing import Any, Dict, List, TypedDict
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    messages: List[BaseMessage]
    candidate_context: Dict[str, Any]
