from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

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
    Stub chat endpoint that echoes back the question.
    Real RAG implementation will come in Phase 2.
    """
    return ChatResponse(
        answer=f"RAG not yet implemented. You asked: {request.question}"
    )
