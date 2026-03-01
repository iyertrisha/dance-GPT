#!/usr/bin/env python3
"""
OCR ingestion script for DanceGPT.
Runs Google Cloud Vision OCR on a PDF and saves results to database.

Usage:
    python scripts/ocr_ingest.py <pdf_filename> [level] [topic]

Example:
    python scripts/ocr_ingest.py sample.pdf Preliminary Tala
"""

import sys
import os
import json
import uuid
from pathlib import Path
from google.cloud import vision
import psycopg2
from dotenv import load_dotenv

# Load environment variables
project_root = Path(__file__).parent.parent
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


def run_ocr(pdf_path: str) -> str:
    """
    Run Google Cloud Vision OCR on a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Extracted text from the PDF
    """
    # Initialize Vision API client
    # Expects GOOGLE_APPLICATION_CREDENTIALS env var or service-account.json in project root
    client = vision.ImageAnnotatorClient()
    
    # Read the PDF file
    with open(pdf_path, 'rb') as f:
        content = f.read()
    
    # Create Vision API request
    input_config = vision.InputConfig(
        content=content,
        mime_type='application/pdf'
    )
    
    feature = vision.Feature(type_=vision.Feature.Type.DOCUMENT_TEXT_DETECTION)
    
    request = vision.AnnotateFileRequest(
        input_config=input_config,
        features=[feature]
    )
    
    print(f"Sending PDF to Google Cloud Vision API...")
    response = client.batch_annotate_files(requests=[request])
    
    # Extract text from response
    full_text = ""
    pages = []
    
    for file_response in response.responses:
        for page_num, page_response in enumerate(file_response.responses, start=1):
            if page_response.full_text_annotation:
                page_text = page_response.full_text_annotation.text
                full_text += page_text + "\n"
                pages.append({
                    "page_num": page_num,
                    "text": page_text
                })
    
    return full_text, pages


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/ocr_ingest.py <pdf_filename> [level] [topic]")
        print("Example: python scripts/ocr_ingest.py sample.pdf Preliminary Tala")
        sys.exit(1)
    
    pdf_filename = sys.argv[1]
    level = sys.argv[2] if len(sys.argv) > 2 else "Preliminary"
    topic = sys.argv[3] if len(sys.argv) > 3 else "General"
    
    # Build paths
    uploads_dir = project_root / "data" / "uploads"
    ocr_dir = project_root / "data" / "ocr"
    pdf_path = uploads_dir / pdf_filename
    
    # Ensure directories exist
    ocr_dir.mkdir(parents=True, exist_ok=True)
    
    # Validate PDF exists
    if not pdf_path.exists():
        print(f"Error: PDF file not found: {pdf_path}")
        sys.exit(1)
    
    print(f"Processing PDF: {pdf_filename}")
    print(f"Level: {level}, Topic: {topic}")
    
    # Generate document ID
    doc_id = str(uuid.uuid4())
    
    # Run OCR
    try:
        full_text, pages = run_ocr(str(pdf_path))
        print(f"OCR completed. Extracted {len(pages)} page(s)")
    except Exception as e:
        print(f"Error during OCR: {e}")
        sys.exit(1)
    
    # Save OCR output as JSON
    ocr_json_path = ocr_dir / f"{doc_id}.json"
    ocr_data = {
        "doc_id": doc_id,
        "pages": pages
    }
    
    with open(ocr_json_path, 'w', encoding='utf-8') as f:
        json.dump(ocr_data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved OCR output to: {ocr_json_path}")
    
    # Insert into Postgres documents table
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            INSERT INTO documents (id, file_name, file_path, ocr_text_path, level, topic, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            doc_id,
            pdf_filename,
            str(pdf_path),
            str(ocr_json_path),
            level,
            topic,
            'ocr_done'
        ))
        conn.commit()
        print(f"Inserted document into database with status='ocr_done'")
        print(f"Document ID: {doc_id}")
    except Exception as e:
        conn.rollback()
        print(f"Error inserting into database: {e}")
        sys.exit(1)
    finally:
        cur.close()
        conn.close()
    
    print(f"\n✓ OCR ingestion complete!")
    print(f"  Document ID: {doc_id}")
    print(f"  OCR file: {ocr_json_path}")
    print(f"  Status: ocr_done")


if __name__ == "__main__":
    main()
