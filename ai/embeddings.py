from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np


class EmbeddingService:
    """
    Wrapper for BGE-M3 embedding model.
    BGE-M3 is multilingual and supports Devanagari script.
    Outputs 1024-dimensional vectors.
    """
    
    def __init__(self, model_name: str = "BAAI/bge-m3"):
        """
        Initialize the BGE-M3 model.
        First run will download ~2GB model to ~/.cache/torch
        """
        print(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        print(f"Model loaded successfully. Output dimension: {self.model.get_sentence_embedding_dimension()}")
    
    def embed(self, text: str) -> List[float]:
        """
        Embed a single text string.
        
        Args:
            text: Input text to embed
            
        Returns:
            1024-dimensional embedding vector as a list of floats
        """
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Embed a batch of text strings.
        More efficient than calling embed() multiple times.
        
        Args:
            texts: List of input texts to embed
            
        Returns:
            List of 1024-dimensional embedding vectors
        """
        embeddings = self.model.encode(texts, convert_to_numpy=True, batch_size=32)
        return embeddings.tolist()
