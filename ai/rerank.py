"""Cross-encoder reranking for RAG (BGE reranker v2 m3)."""

import os
from typing import List

from sentence_transformers import CrossEncoder


class RerankerService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if RerankerService._model is None:
            name = os.environ.get(
                "RAG_RERANKER_MODEL",
                "BAAI/bge-reranker-v2-m3",
            )
            RerankerService._model = CrossEncoder(name)

    def rerank(
        self,
        query: str,
        candidates: List[dict],
        top_n: int,
    ) -> List[dict]:
        if not candidates:
            return []
        texts = [c.get("text", "") for c in candidates]
        pairs = [(query, t) for t in texts]
        scores = self._model.predict(pairs)
        ranked = sorted(
            zip(scores, candidates),
            key=lambda x: x[0],
            reverse=True,
        )
        return [c for _, c in ranked[:top_n]]
