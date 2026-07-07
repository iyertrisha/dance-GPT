from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from rag import query_rag

router = APIRouter(prefix="/ai", tags=["chat"])


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    level: str
    history: Optional[List[Message]] = None


class ChatResponse(BaseModel):
    answer: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    RAG chat: hybrid retrieval, cross-encoder rerank, optional MQE/HyDE/CRAG, Groq generation.
    """
    history = (
        [{"role": m.role, "content": m.content} for m in request.history]
        if request.history
        else None
    )
    answer = query_rag(
        question=request.question,
        level=request.level,
        history=history,
    )
    return ChatResponse(answer=answer)
