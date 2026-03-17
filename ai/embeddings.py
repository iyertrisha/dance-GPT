from typing import List
from sentence_transformers import SentenceTransformer


class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if EmbeddingService._model is None:
            EmbeddingService._model = SentenceTransformer("BAAI/bge-m3")

    @property
    def dimension(self) -> int:
        return self._model.get_sentence_embedding_dimension()

    def embed(self, text: str) -> List[float]:
        return self._model.encode(text, normalize_embeddings=True).tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [
            vec.tolist()
            for vec in self._model.encode(texts, normalize_embeddings=True)
        ]
