#!/usr/bin/env python3
"""
Chunking and indexing script.
Reads OCR JSON for pending documents, chunks text, embeds with BGE-M3,
and writes to LanceDB.

Usage:
    python scripts/chunk_and_index.py
"""

import json
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Allow imports from ai/ package
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ai"))

from contextual import enrich_chunks_for_indexing
from embeddings import EmbeddingService
from lancedb_client import LanceDBClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
LANCEDB_PATH = os.getenv("LANCEDB_PATH", str(PROJECT_ROOT / "data" / "lancedb"))


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping character-based chunks."""
    if not text.strip():
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return [c for c in chunks if c.strip()]


def get_pending_documents():
    """Fetch documents with status='ocr_done' from Postgres."""
    import psycopg2

    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    cur.execute(
        "SELECT id, file_name, ocr_text_path, level, topic FROM documents WHERE status = 'ocr_done'"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def update_document_status(doc_id: str, status: str):
    """Update the document status in Postgres."""
    import psycopg2

    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE documents SET status = %s WHERE id = %s",
            (status, doc_id),
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()


def main():
    docs = get_pending_documents()

    if not docs:
        print("No documents with status='ocr_done' to index.")
        return

    print(f"Found {len(docs)} document(s) to index.")
    print("Loading BGE-M3 embedding model (may download ~2GB on first run)...")
    embedder = EmbeddingService()
    print(f"  Model loaded. Vector dimension: {embedder.dimension}")

    lancedb = LanceDBClient(path=LANCEDB_PATH)
    print(f"  LanceDB connected at {LANCEDB_PATH}")

    for doc_id, file_name, ocr_text_path, level, topic in docs:
        print(f"\nProcessing '{file_name}' (doc_id={doc_id})...")

        # Read OCR JSON
        ocr_path = Path(ocr_text_path)
        if not ocr_path.exists():
            print(f"  ERROR: OCR file not found: {ocr_path}")
            update_document_status(doc_id, "failed")
            continue

        with open(ocr_path, "r", encoding="utf-8") as f:
            ocr_data = json.load(f)

        # Combine text from all pages
        full_text = "\n\n".join(page["text"] for page in ocr_data.get("pages", []))

        if not full_text.strip():
            print("  WARNING: No text extracted. Skipping.")
            update_document_status(doc_id, "failed")
            continue

        # Chunk (optional CONTEXTUAL_CHUNKING=1 prepends doc summary via Groq — see ai/contextual.py)
        text_chunks = chunk_text(full_text)
        text_chunks = enrich_chunks_for_indexing(full_text, text_chunks)
        print(f"  Created {len(text_chunks)} chunks")

        # Embed
        print("  Embedding chunks...")
        vectors = embedder.embed_batch(text_chunks)
        print(f"  Embedded {len(vectors)} chunks")

        # Build records for LanceDB
        lance_records = []
        page_nums = {p["page_num"] for p in ocr_data.get("pages", [])}
        for chunk_text_val, vector in zip(text_chunks, vectors):
            lance_records.append({
                "id": str(uuid.uuid4()),
                "doc_id": doc_id,
                "page_num": min(page_nums) if page_nums else 1,
                "text": chunk_text_val,
                "vector": vector,
                "level": level or "",
                "topic": topic or "",
            })

        # Write to LanceDB
        lancedb.upsert_chunks(lance_records)
        print(f"  Inserted {len(lance_records)} chunks into LanceDB")

        # Update status
        update_document_status(doc_id, "indexed")
        print(f"  Status updated to 'indexed'")

    total_chunks = lancedb.count()
    print(f"\nDone! Total chunks in LanceDB: {total_chunks}")


if __name__ == "__main__":
    main()
