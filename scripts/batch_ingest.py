#!/usr/bin/env python3
"""
Batch ingestion: scan data/uploads for PDF/DOCX, OCR or extract text, chunk,
embed with BGE-M3, write LanceDB, insert Postgres with status=indexed.

Usage (from repo root, with ai venv and .env loaded):
    python scripts/batch_ingest.py
"""

from __future__ import annotations

import importlib.util
import json
import os
import re
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
UPLOADS_DIR = PROJECT_ROOT / "data" / "uploads"
OCR_DIR = PROJECT_ROOT / "data" / "ocr"
OCR_DIR.mkdir(parents=True, exist_ok=True)

# Reuse OCR helpers from ocr_ingest.py
_ocr_spec = importlib.util.spec_from_file_location(
    "ocr_ingest", PROJECT_ROOT / "scripts" / "ocr_ingest.py"
)
_ocr = importlib.util.module_from_spec(_ocr_spec)
_ocr_spec.loader.exec_module(_ocr)

pdf_pages_to_images = _ocr.pdf_pages_to_images
ocr_images = _ocr.ocr_images

# If GOOGLE_APPLICATION_CREDENTIALS points to a missing file, unset for ADC
_creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
if _creds and not Path(_creds).expanduser().resolve().exists():
    del os.environ["GOOGLE_APPLICATION_CREDENTIALS"]

sys.path.insert(0, str(PROJECT_ROOT / "ai"))

from contextual import enrich_chunks_for_indexing  # noqa: E402
from embeddings import EmbeddingService  # noqa: E402
from lancedb_client import LanceDBClient  # noqa: E402
from syllabus_topics import TOPIC_RULES  # noqa: E402

LANCEDB_PATH = os.getenv("LANCEDB_PATH", str(PROJECT_ROOT / "data" / "lancedb"))

# Question paper filenames inside a folder named qp (see plan)
QP_PDF_RE = re.compile(
    r"^.+-\d+(?:st|nd|rd|th)?(?:-paper)?-?\d*\.pdf$",
    re.IGNORECASE,
)

def is_qp_folder_path(path: Path) -> bool:
    return any(part.lower() == "qp" for part in path.parts)


def is_question_paper(path: Path) -> bool:
    if not is_qp_folder_path(path):
        return False
    return bool(QP_PDF_RE.match(path.name))


def infer_level(path: Path) -> str:
    s = str(path).lower()
    if "prarambhika" in s:
        return "Preliminary"
    if "junior" in s or "praveshika" in s:
        return "Junior"
    if "madhyama" in s:
        return "Intermediate"
    if "visharad" in s:
        return "Senior"
    if "first year" in s or "second year" in s or "third year" in s:
        return "Junior"
    return "General"


def infer_topic(path: Path) -> str:
    if is_question_paper(path):
        return "QuestionPaper"
    s = str(path).lower()
    for kw, topic in TOPIC_RULES:
        if kw in s:
            return topic
    return "General"


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    if not text.strip():
        return []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return [c for c in chunks if c.strip()]


def docx_to_pages(docx_path: Path) -> list[dict]:
    from docx import Document

    doc = Document(str(docx_path))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    if not paragraphs:
        return []
    pages: list[dict] = []
    current: list[str] = []
    current_len = 0
    page_num = 1
    max_chunk = 4000
    for para in paragraphs:
        add_len = len(para) + (2 if current else 0)
        if current_len + add_len > max_chunk and current:
            pages.append({"page_num": page_num, "text": "\n\n".join(current)})
            page_num += 1
            current = [para]
            current_len = len(para)
        else:
            current.append(para)
            current_len += add_len
    if current:
        pages.append({"page_num": page_num, "text": "\n\n".join(current)})
    return pages


def save_ocr_json(doc_id: str, pages: list[dict]) -> Path:
    ocr_path = OCR_DIR / f"{doc_id}.json"
    payload = {"doc_id": doc_id, "pages": pages}
    ocr_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return ocr_path


def fetch_indexed_file_names() -> set[str]:
    import psycopg2

    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set")
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    try:
        cur.execute("SELECT file_name FROM documents")
        return {row[0] for row in cur.fetchall()}
    finally:
        cur.close()
        conn.close()


def insert_document_row(
    doc_id: str,
    file_name: str,
    file_path: str,
    ocr_path: Path,
    level: str,
    topic: str,
    status: str = "indexed",
) -> None:
    import psycopg2

    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO documents (id, file_name, file_path, ocr_text_path, level, topic, status)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (doc_id, file_name, file_path, str(ocr_path), level, topic, status),
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()


def iter_candidate_files() -> list[Path]:
    out: list[Path] = []
    if not UPLOADS_DIR.is_dir():
        return out
    for p in UPLOADS_DIR.rglob("*"):
        if not p.is_file():
            continue
        suf = p.suffix.lower()
        if suf in (".pdf", ".docx"):
            out.append(p)
    return sorted(out, key=lambda x: str(x).lower())


def process_one_file(
    path: Path,
    rel_name: str,
    embedder: EmbeddingService,
    lancedb: LanceDBClient,
) -> bool:
    doc_id = str(uuid.uuid4())
    level = infer_level(path)
    topic = infer_topic(path)

    print(f"\n--- {rel_name} (doc_id={doc_id}) level={level} topic={topic} ---")

    try:
        if path.suffix.lower() == ".pdf":
            print("  Extracting PDF pages / images...")
            image_bytes_list = pdf_pages_to_images(path)
            print(f"  Running OCR ({len(image_bytes_list)} unit(s))...")
            pages = ocr_images(image_bytes_list)
        else:
            print("  Extracting DOCX text...")
            pages = docx_to_pages(path)
            if not pages:
                print("  WARNING: No text in DOCX. Skipping.")
                return False
    except Exception as e:
        print(f"  ERROR: extract/OCR failed: {e}")
        return False

    ocr_path = save_ocr_json(doc_id, pages)
    print(f"  Saved {ocr_path.name}")

    full_text = "\n\n".join(page["text"] for page in pages)
    if not full_text.strip():
        print("  WARNING: No text content. Skipping.")
        return False

    text_chunks = chunk_text(full_text)
    text_chunks = enrich_chunks_for_indexing(full_text, text_chunks)
    print(f"  Chunking: {len(text_chunks)} chunks")
    print("  Embedding...")
    vectors = embedder.embed_batch(text_chunks)

    page_nums = {p["page_num"] for p in pages}
    min_page = min(page_nums) if page_nums else 1

    lance_records = []
    for chunk_val, vector in zip(text_chunks, vectors):
        lance_records.append({
            "id": str(uuid.uuid4()),
            "doc_id": doc_id,
            "page_num": min_page,
            "text": chunk_val,
            "vector": vector,
            "level": level or "",
            "topic": topic or "",
        })

    lancedb.upsert_chunks(lance_records)
    print(f"  LanceDB: inserted {len(lance_records)} vectors")

    abs_path = str(path.resolve())
    insert_document_row(doc_id, rel_name, abs_path, ocr_path, level, topic, "indexed")
    print("  Postgres: inserted (status=indexed)")
    return True


def main() -> None:
    if not os.getenv("DATABASE_URL"):
        print("ERROR: DATABASE_URL is not set.")
        sys.exit(1)

    existing = fetch_indexed_file_names()
    print(f"Already in database: {len(existing)} file name(s)")

    files = iter_candidate_files()
    to_run: list[tuple[Path, str]] = []
    for path in files:
        rel = path.relative_to(UPLOADS_DIR).as_posix()
        if rel in existing:
            print(f"Skip (already indexed): {rel}")
            continue
        to_run.append((path, rel))

    if not to_run:
        print("No new files to ingest.")
        return

    print(f"\nFiles to process: {len(to_run)}")
    print("Loading BGE-M3 (first run may download ~2GB)...")
    embedder = EmbeddingService()
    print(f"  Vector dim: {embedder.dimension}")

    lancedb = LanceDBClient(path=LANCEDB_PATH)
    print(f"  LanceDB: {LANCEDB_PATH}")

    ok = 0
    failed = 0
    for path, rel in to_run:
        try:
            if process_one_file(path, rel, embedder, lancedb):
                ok += 1
            else:
                failed += 1
        except Exception as e:
            print(f"  FATAL: {e}")
            failed += 1

    total = lancedb.count()
    print(f"\n=== Done === success={ok} failed={failed} total LanceDB rows={total}")


if __name__ == "__main__":
    main()
