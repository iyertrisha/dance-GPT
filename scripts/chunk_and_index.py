#!/usr/bin/env python3
"""
Chunking and indexing script for DanceGPT.
Reads OCR text, chunks it, embeds with BGE-M3, and writes to LanceDB.

Usage:
    python scripts/chunk_and_index.py
"""

import sys
import os
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any
import psycopg2
from dotenv import load_dotenv

# Add parent directory to path to import ai modules
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from ai.embeddings import EmbeddingService
from ai.lancedb_client import LanceDBClient

# Load environment variables
load_dotenv(project_root / ".env")
load_dotenv(project_root / "ai" / ".env")


def get_db_connection():
    """Get PostgreSQL connection from environment variables."""
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        database=os.getenv("POSTGRES_DB", "dancegpt"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "postgres")
    )


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Split text into overlapping chunks.
    
    Args:
        text: Input text to chunk
        chunk_size: Target size of each chunk in characters
        overlap: Number of overlapping characters between chunks
        
    Returns:
        List of text chunks
    """
    if not text or len(text.strip()) == 0:
        return []
    
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = start + chunk_size
        
        # If this is not the last chunk and we're not at the end,
        # try to break at a sentence or word boundary
        if end < text_len:
            # Look for sentence boundary (., !, ?)
            for i in range(min(end, text_len) - 1, max(start, end - 100), -1):
                if text[i] in '.!?\n':
                    end = i + 1
                    break
            else:
                # No sentence boundary found, look for word boundary
                for i in range(min(end, text_len) - 1, max(start, end - 50), -1):
                    if text[i].isspace():
                        end = i + 1
                        break
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        # Move start position with overlap
        start = end - overlap
        
        # Avoid infinite loop if chunk is too small
        if start <= end - chunk_size + overlap:
            start = end
    
    return chunks


def process_document(doc: Dict[str, Any], embedding_service: EmbeddingService, 
                     lancedb_client: LanceDBClient, conn) -> int:
    """
    Process a single document: chunk, embed, and index.
    
    Args:
        doc: Document record from Postgres
        embedding_service: Embedding service instance
        lancedb_client: LanceDB client instance
        conn: PostgreSQL connection
        
    Returns:
        Number of chunks created
    """
    doc_id = doc['id']
    ocr_text_path = doc['ocr_text_path']
    level = doc['level']
    topic = doc['topic']
    
    print(f"\nProcessing document: {doc['file_name']}")
    print(f"  Level: {level}, Topic: {topic}")
    
    # Read OCR JSON
    try:
        with open(ocr_text_path, 'r', encoding='utf-8') as f:
            ocr_data = json.load(f)
    except Exception as e:
        print(f"  Error reading OCR file: {e}")
        return 0
    
    # Extract full text from all pages
    full_text = ""
    for page in ocr_data.get('pages', []):
        full_text += page.get('text', '') + "\n"
    
    if not full_text.strip():
        print(f"  Warning: No text found in OCR output")
        return 0
    
    print(f"  Extracted {len(full_text)} characters of text")
    
    # Chunk the text
    chunks_text = chunk_text(full_text)
    print(f"  Created {len(chunks_text)} chunks")
    
    if not chunks_text:
        print(f"  Warning: No chunks created")
        return 0
    
    # Embed all chunks
    print(f"  Embedding {len(chunks_text)} chunks...")
    try:
        embeddings = embedding_service.embed_batch(chunks_text)
        print(f"  ✓ Embedded {len(embeddings)} chunks")
    except Exception as e:
        print(f"  Error embedding chunks: {e}")
        return 0
    
    # Create chunk records for LanceDB
    chunk_records = []
    for i, (chunk_text, embedding) in enumerate(zip(chunks_text, embeddings)):
        chunk_records.append({
            'id': f"{doc_id}_{i}",
            'doc_id': doc_id,
            'page_num': 1,  # Simplified for v1; multi-page support can be added later
            'text': chunk_text,
            'vector': embedding,
            'level': level,
            'topic': topic
        })
    
    # Insert into LanceDB
    try:
        lancedb_client.upsert_chunks(chunk_records)
        print(f"  ✓ Inserted {len(chunk_records)} chunks into LanceDB")
    except Exception as e:
        print(f"  Error inserting into LanceDB: {e}")
        return 0
    
    # Update document status in Postgres
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE documents 
            SET status = 'indexed'
            WHERE id = %s
        """, (doc_id,))
        conn.commit()
        print(f"  ✓ Updated document status to 'indexed'")
    except Exception as e:
        conn.rollback()
        print(f"  Error updating document status: {e}")
        return 0
    finally:
        cur.close()
    
    return len(chunk_records)


def main():
    print("=" * 60)
    print("DanceGPT Chunking and Indexing Pipeline")
    print("=" * 60)
    
    # Initialize services
    print("\n1. Initializing services...")
    try:
        embedding_service = EmbeddingService()
        lancedb_client = LanceDBClient()
        conn = get_db_connection()
        print("✓ All services initialized")
    except Exception as e:
        print(f"Error initializing services: {e}")
        sys.exit(1)
    
    # Query for documents with status='ocr_done'
    print("\n2. Querying for documents with status='ocr_done'...")
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, file_name, file_path, ocr_text_path, level, topic
            FROM documents
            WHERE status = 'ocr_done'
            ORDER BY uploaded_at
        """)
        rows = cur.fetchall()
        
        documents = []
        for row in rows:
            documents.append({
                'id': str(row[0]),
                'file_name': row[1],
                'file_path': row[2],
                'ocr_text_path': row[3],
                'level': row[4],
                'topic': row[5]
            })
        
        print(f"Found {len(documents)} document(s) ready for indexing")
    except Exception as e:
        print(f"Error querying database: {e}")
        sys.exit(1)
    finally:
        cur.close()
    
    if not documents:
        print("\nNo documents to process. Run ocr_ingest.py first.")
        conn.close()
        return
    
    # Process each document
    print("\n3. Processing documents...")
    total_chunks = 0
    for doc in documents:
        chunks_created = process_document(doc, embedding_service, lancedb_client, conn)
        total_chunks += chunks_created
    
    conn.close()
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Documents processed: {len(documents)}")
    print(f"Total chunks created: {total_chunks}")
    print(f"Total chunks in LanceDB: {lancedb_client.count()}")
    print("\n✓ Indexing complete!")


if __name__ == "__main__":
    main()
