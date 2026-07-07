#!/usr/bin/env python3
"""
OCR ingestion script.
Sends scanned PDFs to Google Cloud Vision and saves the extracted text.

Usage:
    python scripts/ocr_ingest.py <pdf_filename> [level] [topic]

Example:
    python scripts/ocr_ingest.py preliminary_tala.pdf Preliminary Tala
"""

import io
import json
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv
from google.cloud import vision
from PIL import Image
from pypdf import PdfReader

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# If GOOGLE_APPLICATION_CREDENTIALS points to a missing file, unset it so
# Google auth falls back to Application Default Credentials (gcloud ADC).
_creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
if _creds and not Path(_creds).expanduser().resolve().exists():
    del os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
UPLOADS_DIR = PROJECT_ROOT / "data" / "uploads"
OCR_DIR = PROJECT_ROOT / "data" / "ocr"
OCR_DIR.mkdir(parents=True, exist_ok=True)


def pdf_pages_to_images_raster(pdf_path: Path, zoom: float = 2.0) -> list[bytes]:
    """
    Rasterize each PDF page to PNG bytes (Vision-compatible).
    Works for scanned PDFs, vector PDFs, and PDFs without embedded images.
    """
    import fitz  # PyMuPDF

    doc = fitz.open(str(pdf_path))
    mat = fitz.Matrix(zoom, zoom)
    images: list[bytes] = []
    try:
        for i in range(len(doc)):
            page = doc.load_page(i)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            images.append(pix.tobytes("png"))
    finally:
        doc.close()
    return images


def pdf_pages_to_images_embedded(pdf_path: Path) -> list[bytes]:
    """Extract embedded bitmaps per page via pypdf (fallback only)."""
    reader = PdfReader(str(pdf_path))
    images: list[bytes] = []

    for page in reader.pages:
        for image_obj in page.images:
            buf = io.BytesIO()
            img = Image.open(io.BytesIO(image_obj.data))
            if img.mode not in ("RGB", "L", "RGBA"):
                img = img.convert("RGB")
            elif img.mode == "RGBA":
                bg = Image.new("RGB", img.size, (255, 255, 255))
                bg.paste(img, mask=img.split()[3])
                img = bg
            img.save(buf, format="PNG")
            images.append(buf.getvalue())

    return images


def pdf_pages_to_images(pdf_path: Path) -> list[bytes]:
    """Produce PNG bytes per page for Cloud Vision (never send raw PDF)."""
    try:
        images = pdf_pages_to_images_raster(pdf_path)
        if images:
            return images
    except ImportError:
        print(
            "  Warning: pymupdf not installed; pip install pymupdf "
            "(see ai/requirements.txt). Falling back to embedded images only.",
            file=sys.stderr,
        )
    except Exception as e:
        print(f"  Rasterize failed ({e}); trying embedded images...", file=sys.stderr)

    images = pdf_pages_to_images_embedded(pdf_path)
    if not images:
        raise RuntimeError(
            "Could not produce images from PDF. Install pymupdf (`pip install pymupdf`) "
            "to rasterize pages, or ensure the PDF contains extractable embedded images."
        )
    return images


def ocr_images(image_bytes_list: list[bytes]) -> list[dict]:
    """Run document_text_detection on each image via Cloud Vision."""
    client = vision.ImageAnnotatorClient()
    pages = []

    for idx, img_bytes in enumerate(image_bytes_list, start=1):
        image = vision.Image(content=img_bytes)
        response = client.document_text_detection(image=image)

        if response.error.message:
            raise RuntimeError(
                f"Vision API error on page {idx}: {response.error.message}"
            )

        text = ""
        if response.full_text_annotation:
            text = response.full_text_annotation.text

        pages.append({"page_num": idx, "text": text})
        print(f"  Page {idx}: {len(text)} chars extracted")

    return pages


def save_ocr_json(doc_id: str, pages: list[dict]) -> Path:
    """Write OCR results to data/ocr/{doc_id}.json."""
    ocr_path = OCR_DIR / f"{doc_id}.json"
    payload = {"doc_id": doc_id, "pages": pages}
    ocr_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return ocr_path


def insert_document(doc_id: str, pdf_path: Path, ocr_path: Path, level: str, topic: str):
    """Insert a row into the Postgres documents table."""
    import psycopg2

    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO documents (id, file_name, file_path, ocr_text_path, level, topic, status)
               VALUES (%s, %s, %s, %s, %s, %s, 'ocr_done')""",
            (doc_id, pdf_path.name, str(pdf_path), str(ocr_path), level, topic),
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/ocr_ingest.py <pdf_filename> [level] [topic]")
        sys.exit(1)

    pdf_file = sys.argv[1]
    level = sys.argv[2] if len(sys.argv) > 2 else "Preliminary"
    topic = sys.argv[3] if len(sys.argv) > 3 else "General"

    pdf_path = UPLOADS_DIR / pdf_file
    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}")
        sys.exit(1)

    doc_id = str(uuid.uuid4())
    print(f"Processing '{pdf_file}' (doc_id={doc_id})...")

    # Extract page images from PDF
    print("  Extracting pages from PDF...")
    image_bytes_list = pdf_pages_to_images(pdf_path)
    print(f"  Found {len(image_bytes_list)} page(s)")

    # Run OCR
    print("  Running Google Cloud Vision OCR...")
    pages = ocr_images(image_bytes_list)

    # Save JSON
    ocr_path = save_ocr_json(doc_id, pages)
    print(f"  OCR saved: {ocr_path}")

    # Insert into Postgres
    insert_document(doc_id, pdf_path, ocr_path, level, topic)
    print(f"  Document inserted (status=ocr_done)")

    total_chars = sum(len(p["text"]) for p in pages)
    print(f"\nDone! doc_id={doc_id}, {len(pages)} page(s), {total_chars} total chars")


if __name__ == "__main__":
    main()
