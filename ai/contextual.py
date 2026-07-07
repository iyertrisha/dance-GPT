"""
Optional contextual enrichment at index time: one short document summary prepended to every chunk.

Requires GROQ_API_KEY when enabled (set CONTEXTUAL_CHUNKING=1). Re-run chunk_and_index.py or
batch_ingest.py after enabling to rebuild LanceDB rows; existing vectors remain unchanged until reindexed.
"""

import os
from typing import List

from openai import OpenAI

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
_DEFAULT_MODEL = "llama-3.3-70b-versatile"


def _truthy(name: str, default: str = "0") -> bool:
    return os.environ.get(name, default).lower() in ("1", "true", "yes", "on")


def _client() -> OpenAI:
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise RuntimeError("GROQ_API_KEY is required for contextual chunking")
    model = os.environ.get("GROQ_MODEL", _DEFAULT_MODEL)
    return OpenAI(api_key=key, base_url=GROQ_BASE_URL), model


def document_context_header(full_text: str, max_doc_chars: int = 8000) -> str:
    """
    One LLM call per document: 1–2 sentences placing the syllabus material in context.
    """
    if not _truthy("CONTEXTUAL_CHUNKING", "0"):
        return ""
    excerpt = (full_text or "").strip()[:max_doc_chars]
    if len(excerpt) < 80:
        return ""

    client, model = _client()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": (
                    "You are indexing Bharatanatyam Gandharva exam study materials.\n\n"
                    f"Document excerpt:\n{excerpt}\n\n"
                    "Write exactly 1–2 short sentences summarizing what this document covers "
                    "(topics, level, purpose). Output only those sentences, no labels."
                ),
            }
        ],
        temperature=0.2,
        max_tokens=120,
    )
    header = (resp.choices[0].message.content or "").strip()
    return header


def enrich_chunks_for_indexing(full_text: str, raw_chunks: List[str]) -> List[str]:
    """
    If CONTEXTUAL_CHUNKING=1, prepend the same document header to each chunk; otherwise return raw_chunks.
    """
    if not raw_chunks:
        return raw_chunks
    if not _truthy("CONTEXTUAL_CHUNKING", "0"):
        return raw_chunks
    header = document_context_header(full_text)
    if not header:
        return raw_chunks
    return [f"{header}\n\n{c}" for c in raw_chunks]
