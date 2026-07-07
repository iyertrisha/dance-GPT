import math
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import lancedb
import pyarrow as pa

# Repo root (parent of ai/). Ingestion writes to data/lancedb here; the AI process
# must use the same path regardless of shell cwd (uvicorn is often started from ai/).
_REPO_ROOT = Path(__file__).resolve().parent.parent


def _default_lancedb_path() -> str:
    return str(_REPO_ROOT / "data" / "lancedb")


def _resolve_lancedb_path(path: Optional[str]) -> str:
    if not path:
        return _default_lancedb_path()
    p = Path(path).expanduser()
    if p.is_absolute():
        resolved = p
    else:
        resolved = (_REPO_ROOT / p).resolve()
    return str(resolved)


# Schema for the chunks table.
# BGE-M3 produces 1024-dim vectors.
VECTOR_DIM = 1024

CHUNKS_SCHEMA = pa.schema([
    pa.field("id", pa.utf8()),
    pa.field("doc_id", pa.utf8()),
    pa.field("page_num", pa.int32()),
    pa.field("text", pa.utf8()),
    pa.field("vector", pa.list_(pa.float32(), VECTOR_DIM)),
    pa.field("level", pa.utf8()),
    pa.field("topic", pa.utf8()),
])

# Exam ladder for soft level scoring (General is neutral).
LEVEL_ORDER: List[str] = ["Preliminary", "Junior", "Intermediate", "Senior"]


def level_distance(user_level: str, chunk_level: str) -> int:
    if not chunk_level or chunk_level.strip() == "" or chunk_level == "General":
        return 0
    if not user_level or user_level.strip() == "" or user_level == "General":
        return 0
    try:
        ui = LEVEL_ORDER.index(user_level)
        ci = LEVEL_ORDER.index(chunk_level)
    except ValueError:
        return 1
    return abs(ui - ci)


def _strict_level_predicate(level: str) -> str:
    safe_level = level.replace("'", "''")
    return f"(level = '{safe_level}' OR level = 'General')"


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[^\W_]+", text.lower(), flags=re.UNICODE)


def _bm25_scores(query: str, documents: List[str]) -> List[float]:
    """BM25 scores for a query against a small corpus (candidate pool only)."""
    k1, b = 1.5, 0.75
    tokenized_corpus = [_tokenize(d) for d in documents]
    if not any(tokenized_corpus):
        return [0.0] * len(documents)
    doc_lens = [len(t) for t in tokenized_corpus]
    avgdl = sum(doc_lens) / len(doc_lens) if doc_lens else 0.0
    df: Dict[str, int] = {}
    for tokens in tokenized_corpus:
        seen = set(tokens)
        for t in seen:
            df[t] = df.get(t, 0) + 1
    n_docs = len(documents)
    idf = {
        t: math.log((n_docs - df[t] + 0.5) / (df[t] + 0.5) + 1.0)
        for t in df
    }
    q_tokens = _tokenize(query)
    scores: List[float] = []
    for tokens, dl in zip(tokenized_corpus, doc_lens):
        if not tokens or avgdl == 0:
            scores.append(0.0)
            continue
        tf: Dict[str, int] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        s = 0.0
        for qt in q_tokens:
            if qt not in tf:
                continue
            f = tf[qt]
            denom = f + k1 * (1 - b + b * dl / avgdl)
            s += idf.get(qt, 0.0) * (f * (k1 + 1)) / denom
        scores.append(s)
    return scores


def reciprocal_rank_fusion(
    ranked_id_lists: List[List[str]],
    k: int = 60,
    top_n: Optional[int] = None,
) -> List[str]:
    scores: Dict[str, float] = {}
    for ids in ranked_id_lists:
        for rank, cid in enumerate(ids):
            scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank + 1)
    ordered = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
    if top_n is not None:
        return ordered[:top_n]
    return ordered


class LanceDBClient:
    def __init__(self, path: str = None):
        path = _resolve_lancedb_path(path or os.getenv("LANCEDB_PATH"))
        Path(path).mkdir(parents=True, exist_ok=True)
        self.db = lancedb.connect(path)
        self._ensure_table()

    def _ensure_table(self):
        if "chunks" not in self.db.table_names():
            self.table = self.db.create_table("chunks", schema=CHUNKS_SCHEMA)
        else:
            self.table = self.db.open_table("chunks")

    def upsert_chunks(self, chunks: List[dict]):
        if not chunks:
            return
        self.table.add(chunks)

    def count(self) -> int:
        return self.table.count_rows()

    def _row_to_dict(self, r: dict) -> dict:
        dist = r.get("_distance")
        if dist is None:
            dist = r.get("distance")
        return {
            "id": r.get("id", ""),
            "text": r.get("text", ""),
            "doc_id": r.get("doc_id", ""),
            "page_num": int(r.get("page_num", 0) or 0),
            "level": r.get("level", "") or "",
            "topic": r.get("topic", "") or "",
            "_distance": float(dist) if dist is not None else None,
        }

    def _dense_search(
        self,
        vector: List[float],
        level: Optional[str],
        limit: int,
        use_strict_level_filter: bool,
    ) -> List[dict]:
        search = (
            self.table.search(vector)
            .distance_type("cosine")
            .limit(limit)
        )
        if use_strict_level_filter and level and level.strip():
            search = search.where(_strict_level_predicate(level))
        results = search.to_list()
        return [self._row_to_dict(r) for r in results]

    def _apply_soft_level_rescore(
        self,
        rows: List[dict],
        user_level: str,
        penalty_per_step: float,
        take: int,
    ) -> List[dict]:
        if not rows:
            return []

        def adjusted_distance(r: dict) -> float:
            base = r.get("_distance")
            if base is None:
                base = 1.0
            ld = level_distance(user_level, r.get("level", ""))
            return base * (1.0 + penalty_per_step * ld)

        scored = sorted(rows, key=adjusted_distance)
        return scored[:take]

    def query(
        self,
        vector: List[float],
        level: Optional[str] = None,
        retrieve_k: int = 20,
        level_mode: str = "strict",
        level_penalty: float = 0.15,
        hybrid_rrf: bool = True,
        rrf_k: int = 60,
        question_text: Optional[str] = None,
    ) -> List[dict]:
        """
        Vector search with optional strict/soft level policy and hybrid RRF (dense + BM25 on pool).

        Returns up to retrieve_k rows with: id, text, doc_id, page_num, level, topic, _distance
        for downstream cross-encoder reranking.
        """
        user_level = (level or "").strip() or None
        mode = (level_mode or "strict").lower().strip()
        use_strict = mode == "strict"

        if not use_strict and user_level:
            pool_limit = max(retrieve_k * 2, retrieve_k)
        else:
            pool_limit = retrieve_k

        rows = self._dense_search(vector, user_level, pool_limit, use_strict)

        if not use_strict and user_level and rows:
            rows = self._apply_soft_level_rescore(
                rows, user_level, level_penalty, retrieve_k
            )

        if (
            hybrid_rrf
            and question_text
            and question_text.strip()
            and len(rows) >= 2
        ):
            id_order_dense = [r["id"] for r in rows if r.get("id")]
            texts = [r["text"] for r in rows]
            bm25 = _bm25_scores(question_text, texts)
            bm25_order = [
                rows[i]["id"]
                for i in sorted(range(len(rows)), key=lambda i: bm25[i], reverse=True)
                if rows[i].get("id")
            ]
            fused_ids = reciprocal_rank_fusion(
                [id_order_dense, bm25_order],
                k=rrf_k,
                top_n=retrieve_k,
            )
            id_to_row = {r["id"]: r for r in rows if r.get("id")}
            rows = [id_to_row[i] for i in fused_ids if i in id_to_row]

        return rows[:retrieve_k]

    def query_two_stage(
        self,
        vector: List[float],
        level: Optional[str],
        retrieve_k: int,
        hybrid_rrf: bool,
        rrf_k: int,
        question_text: Optional[str],
        level_penalty: float,
        min_rows: int = 3,
    ) -> Tuple[List[dict], bool]:
        """
        Strict first; if too few results, retry soft (no SQL level filter) once.
        Returns (chunks, used_fallback).
        """
        primary = self.query(
            vector=vector,
            level=level,
            retrieve_k=retrieve_k,
            level_mode="strict",
            level_penalty=level_penalty,
            hybrid_rrf=hybrid_rrf,
            rrf_k=rrf_k,
            question_text=question_text,
        )
        if len(primary) >= max(1, min(min_rows, retrieve_k)):
            return primary, False

        fallback = self.query(
            vector=vector,
            level=level,
            retrieve_k=retrieve_k,
            level_mode="soft",
            level_penalty=level_penalty,
            hybrid_rrf=hybrid_rrf,
            rrf_k=rrf_k,
            question_text=question_text,
        )
        return fallback, True
