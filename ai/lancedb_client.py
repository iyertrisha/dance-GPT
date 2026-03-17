import os
from pathlib import Path
from typing import List

import lancedb
import pyarrow as pa


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


class LanceDBClient:
    def __init__(self, path: str = None):
        if path is None:
            path = os.getenv("LANCEDB_PATH", "./data/lancedb")
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
