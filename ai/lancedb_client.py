import lancedb
from typing import List, Dict, Any
import os


class LanceDBClient:
    """
    Manages LanceDB connection and the 'chunks' table.
    Stores document chunks with embeddings for vector similarity search.
    """
    
    def __init__(self, db_path: str = "data/lancedb"):
        """
        Initialize connection to LanceDB.
        
        Args:
            db_path: Path to LanceDB directory (relative to project root)
        """
        # Convert to absolute path if needed
        if not os.path.isabs(db_path):
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_path = os.path.join(project_root, db_path)
        
        # Ensure directory exists
        os.makedirs(db_path, exist_ok=True)
        
        self.db = lancedb.connect(db_path)
        self.table_name = "chunks"
        print(f"Connected to LanceDB at {db_path}")
        
        # Initialize table if it doesn't exist
        self._init_table()
    
    def _init_table(self):
        """
        Initialize the chunks table if it doesn't exist.
        Schema:
            - id (str): unique chunk ID
            - doc_id (str): references documents table
            - page_num (int): page number in original PDF
            - text (str): the chunk text
            - vector (list[float]): BGE-M3 embedding (1024 dims)
            - level (str): exam level (e.g. "Preliminary")
            - topic (str): topic (e.g. "Tala", "Raga")
        """
        # Check if table exists
        table_names = self.db.table_names()
        if self.table_name not in table_names:
            # Create table with initial empty data matching schema
            # LanceDB will infer schema from the first batch of data
            print(f"Table '{self.table_name}' will be created on first upsert")
        else:
            print(f"Table '{self.table_name}' already exists")
    
    def upsert_chunks(self, chunks: List[Dict[str, Any]]):
        """
        Insert or update chunks in the table.
        
        Args:
            chunks: List of chunk dictionaries with keys:
                - id (str)
                - doc_id (str)
                - page_num (int)
                - text (str)
                - vector (list[float])
                - level (str)
                - topic (str)
        """
        if not chunks:
            print("No chunks to upsert")
            return
        
        # Validate chunk schema
        required_fields = {'id', 'doc_id', 'page_num', 'text', 'vector', 'level', 'topic'}
        for chunk in chunks:
            missing = required_fields - set(chunk.keys())
            if missing:
                raise ValueError(f"Chunk missing required fields: {missing}")
        
        # Create or get table
        table_names = self.db.table_names()
        if self.table_name not in table_names:
            # Create new table
            self.table = self.db.create_table(self.table_name, data=chunks, mode="overwrite")
            print(f"Created table '{self.table_name}' with {len(chunks)} chunks")
        else:
            # Add to existing table
            self.table = self.db.open_table(self.table_name)
            self.table.add(chunks)
            print(f"Added {len(chunks)} chunks to table '{self.table_name}'")
    
    def count(self) -> int:
        """
        Return the total number of chunks in the table.
        
        Returns:
            Total count of chunks
        """
        table_names = self.db.table_names()
        if self.table_name not in table_names:
            return 0
        
        table = self.db.open_table(self.table_name)
        return table.count_rows()
