import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from rag import generate_study_cards

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/study", tags=["study"])


class CardItem(BaseModel):
    front: str
    back: str


class GenerateCardsRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    level: str = Field(..., min_length=1)


class GenerateCardsResponse(BaseModel):
    cards: List[CardItem]
    warning: Optional[str] = None


@router.post("/generate-cards", response_model=GenerateCardsResponse)
async def generate_cards(request: GenerateCardsRequest):
    """
    Syllabus-grounded flashcards: LanceDB retrieval for topic/level, then Groq JSON cards.
    """
    try:
        raw_cards, warning = generate_study_cards(
            request.topic.strip(),
            request.level.strip(),
            num_cards=10,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        logger.exception("Flashcard generation failed")
        raise HTTPException(
            status_code=502,
            detail=f"Flashcard generation failed: {str(e)}",
        ) from e

    cards = [CardItem(front=c["front"], back=c["back"]) for c in raw_cards]
    return GenerateCardsResponse(cards=cards, warning=warning)
