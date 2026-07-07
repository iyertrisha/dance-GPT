#!/usr/bin/env python3
"""
Generate pre-made Junior and Senior syllabus flashcard decks (templates).
Creates rows with user_id=NULL, is_template=true. Requires migration 003 applied.

Prerequisites:
  - Postgres running; DATABASE_URL in repo-root `.env` (see docker-compose host port 5433).
  - GROQ_API_KEY set (Groq generates cards from retrieved syllabus chunks).
  - LanceDB indexed syllabus chunks. Use the same Python env as ai/: pip install -r ai/requirements.txt

Reranking:
  By default this script sets RAG_ENABLE_RERANK=0 if unset, so it does not download the ~2GB
  cross-encoder (BAAI/bge-reranker-v2-m3). Retrieval still uses dense search + hybrid RRF.
  To force reranking, set RAG_ENABLE_RERANK=1 in `.env` before running.

Usage:
  python scripts/generate_syllabus_decks.py
  python scripts/generate_syllabus_decks.py --force

From api/: npm run seed:template-decks
"""

from __future__ import annotations

import argparse
import os
import sys
import uuid
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

from dotenv import load_dotenv

load_dotenv(REPO_ROOT / ".env")
load_dotenv(REPO_ROOT / "ai" / ".env")

sys.path.insert(0, str(REPO_ROOT / "ai"))

import psycopg2
from syllabus_topics import SYLLABUS_TOPICS, TEMPLATE_LEVELS


def _fail(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    sys.exit(code)


def _ensure_preflight(conn) -> None:
    if not os.environ.get("GROQ_API_KEY"):
        _fail("GROQ_API_KEY is not set. Add it to .env so flashcards can be generated.")

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'flashcard_decks'
              AND column_name = 'is_template'
            """
        )
        if cur.fetchone() is None:
            _fail(
                "Column flashcard_decks.is_template is missing. Apply api/db/migrations/003_template_decks.sql."
            )


def template_exists(conn, level: str, topic: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """SELECT 1 FROM flashcard_decks
               WHERE is_template = true AND level = %s AND topic = %s
               LIMIT 1""",
            (level, topic),
        )
        return cur.fetchone() is not None


def delete_template(conn, level: str, topic: str) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """DELETE FROM flashcard_decks
               WHERE is_template = true AND level = %s AND topic = %s""",
            (level, topic),
        )
        deleted = cur.rowcount
    conn.commit()
    return deleted


def insert_template_deck(conn, title: str, level: str, topic: str, cards: list) -> str:
    deck_id = str(uuid.uuid4())
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
               VALUES (%s, NULL, %s, %s, %s, true, NOW(), NOW())""",
            (deck_id, title, level, topic),
        )
        for card in cards:
            card_id = str(uuid.uuid4())
            cur.execute(
                """INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at)
                   VALUES (%s, %s, %s, %s, 0, NOW())""",
                (card_id, deck_id, card["front"], card["back"]),
            )
    conn.commit()
    print(f"✓ Created template deck '{title}' (id={deck_id}) with {len(cards)} cards")
    return deck_id


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed Junior/Senior per-topic syllabus template flashcard decks."
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Delete existing template decks with these titles and regenerate.",
    )
    args = parser.parse_args()

    db_url = os.environ.get("DATABASE_URL")
    if not db_url or not str(db_url).strip():
        _fail("DATABASE_URL is not set.")

    try:
        conn = psycopg2.connect(db_url)
    except Exception as e:
        _fail(f"Cannot connect to Postgres with DATABASE_URL: {e}")

    try:
        _ensure_preflight(conn)

        # Batch seeding should not pull the multi-GB reranker unless explicitly requested.
        os.environ.setdefault("RAG_ENABLE_RERANK", "0")

        # Import after env is loaded (heavy: sentence-transformers / lancedb path).
        from rag import generate_study_cards

        print("Generating pre-made syllabus decks by level/topic...\n")

        any_failure = False
        created = 0
        skipped_existing = 0
        skipped_no_cards = 0
        failed = 0

        for level in TEMPLATE_LEVELS:
            for topic in SYLLABUS_TOPICS:
                title = f"{level}: {topic}"
                print(f"Processing {title}...")
                if not args.force and template_exists(conn, level, topic):
                    print(f"  Skipped (template already exists): {title}")
                    skipped_existing += 1
                    continue

                if args.force:
                    removed = delete_template(conn, level, topic)
                    if removed:
                        print(f"  Removed existing template row(s): {removed}")

                try:
                    cards, warning = generate_study_cards(topic=topic, level=level, num_cards=10)
                except Exception as e:
                    print(f"  ✗ Error generating {title}: {e}")
                    failed += 1
                    any_failure = True
                    continue

                if warning:
                    print(f"  Warning: {warning}")
                if not cards:
                    print(
                        f"  Skipped (no usable cards): {title}. "
                        "Ensure indexed chunks exist for this level/topic."
                    )
                    skipped_no_cards += 1
                    continue

                print(
                    f"  Creating template with {len(cards)} cards for {title}"
                )
                try:
                    insert_template_deck(conn, title, level, topic, cards)
                    created += 1
                except Exception as e:
                    conn.rollback()
                    print(f"  ✗ Database error saving {title}: {e}")
                    failed += 1
                    any_failure = True

        print("\nSummary:")
        print(f"  Created: {created}")
        print(f"  Skipped existing: {skipped_existing}")
        print(f"  Skipped no usable cards: {skipped_no_cards}")
        print(f"  Failed: {failed}")

        if any_failure:
            _fail("\nFinished with errors (exit 1). Fix prerequisites above and re-run.", code=1)

        print("\nDone.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
