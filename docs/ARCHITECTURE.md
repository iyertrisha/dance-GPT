# DanceGPT — Architecture Reference

This document is the canonical architecture reference for DanceGPT (Bharatanatyam Gandharva exam tutor). It includes the comparison table and flowcharts from the project diagrams, supplementary Mermaid figures for systems not drawn in those assets, and implementation-aligned notes from the current codebase.

---

## Table of contents

1. [Architecture evolution](#1-architecture-evolution)
2. [Baseline systems](#2-baseline-systems)
   - [Lewis et al. 2020 (RAG)](#21-lewis-et-al-2020-rag)
   - [Yan et al. 2024 (CRAG)](#22-yan-et-al-2024-crag)
   - [Chen et al. 2024 (BGE-M3 embedding)](#23-chen-et-al-2024-bge-m3-embedding)
3. [DanceGPT pipelines](#3-dancegpt-pipelines)
   - [Dataset ingestion](#31-dataset-ingestion)
   - [Inference (7 stages)](#32-inference-7-stages)
4. [Data model](#4-data-model)
5. [Pipeline stage coverage](#5-pipeline-stage-coverage)
6. [How DanceGPT perceives the dataset](#6-how-dancegpt-perceives-the-dataset)
7. [Dataset caveats](#7-dataset-caveats)
8. [Side-by-side differentiators](#8-side-by-side-differentiators)
9. [DanceGPT differentiators (mindmap)](#9-dancegpt-differentiators-mindmap)

---

## 1. Architecture evolution

RAG research progressed from **retrieve-then-generate** on open Wikipedia (Lewis 2020), through **corrective retrieval** with graded fallbacks (CRAG 2024), to **hybrid dense–lexical retrieval with cross-encoder reranking and LLM judges** on a closed domain corpus (DanceGPT).

```mermaid
flowchart LR
    L["Lewis 2020<br/>DPR + FAISS + BART<br/>Open Wikipedia"]
    C["CRAG 2024<br/>DPR + T5 evaluator<br/>Web fallback branches"]
    B["BGE-M3 2024<br/>Dense + sparse + multi-vec<br/>Hybrid embedding fusion"]
    D["DanceGPT<br/>BGE-M3 dense + LanceDB<br/>BM25+RRF + reranker<br/>Llama judge + closed syllabus"]

    L --> C
    C --> B
    B --> D

    style D fill:#2d5016,color:#fff
```

DanceGPT **adopts ideas** from each predecessor but **does not replicate** full stacks: it uses BGE-M3’s **dense head only**, CRAG’s **three-way judge** without web search, and Lewis-style **static corpus ANN** without joint BART training.

---

## 2. Baseline systems

### 2.1 Lewis et al. 2020 (RAG)

Original retrieval-augmented generation: offline passage indexing with DPR, MIPS search at query time, and a seq2seq generator conditioned on retrieved passages.

```mermaid
flowchart TB
    subgraph OFFLINE["Offline corpus indexing lane"]
        W["Wikipedia passages<br/>~100-word splits"]
        DPRd["DPR document encoder<br/>BERT bi-encoder"]
        FAISS["FAISS MIPS index<br/>~21M passages"]
        W --> DPRd --> FAISS
    end

    subgraph ONLINE["Query-time inference"]
        Q["User query"]
        DPRq["DPR query encoder"]
        MIPS["FAISS MIPS top-k"]
        CTX["Concatenate retrieved passages"]
        BART["BART generator<br/>jointly trained with retriever"]
        OUT["Generated answer"]
        Q --> DPRq --> MIPS
        FAISS -.->|ANN lookup| MIPS
        MIPS --> CTX --> BART --> OUT
    end
```

| Aspect | Lewis 2020 |
|--------|------------|
| Retriever | BERT DPR bi-encoder |
| Index | FAISS MIPS |
| Corpus | Open Wikipedia (~21M) |
| Generator | BART (end-to-end RAG training) |
| Grader / fallback | None |

---

### 2.2 Yan et al. 2024 (CRAG)

Corrective RAG adds a **retrieval evaluator** and three corrective actions before generation.

![CRAG 2024 architecture — DPR, T5-large evaluator, three branches, LLM generator](architecture/diagrams/crag-architecture.png)

```mermaid
flowchart TD
    Q["Query"] --> DPR["DPR retriever<br/>top-k from static corpus"]
    DPR --> EV["T5-large retrieval evaluator<br/>confidence per document"]
    EV -->|Correct| DR["Decompose-recompose<br/>filter key knowledge strips"]
    EV -->|Ambiguous| MIX["Corpus + web search<br/>combine refined + web docs"]
    EV -->|Incorrect| WEB["Web search fallback<br/>discard corpus docs"]
    DR --> GEN["LLM generator<br/>RAG or Self-RAG"]
    MIX --> GEN
    WEB --> GEN
    GEN --> A["Final answer"]
```

| Branch | Action |
|--------|--------|
| **Correct** | Decompose-recompose retrieved strips |
| **Ambiguous** | Corpus retrieval + web search |
| **Incorrect** | Discard corpus; web search only |

---

### 2.3 Chen et al. 2024 (BGE-M3 embedding)

BGE-M3 is a **unified embedding model** with three retrieval heads on a shared XLM-RoBERTa backbone. DanceGPT uses **only the dense head** in production.

![BGE M3-Embedding — XLM-RoBERTa backbone, three heads, hybrid fusion; DanceGPT uses dense only](architecture/diagrams/bge-m3-embedding.png)

```mermaid
flowchart TB
    IN["Text input<br/>up to 8192 tokens · 100+ languages"]
    BB["XLM-RoBERTa backbone<br/>RetroMAE · shared encoder"]
    D["Dense head<br/>CLS → 1024-d · cosine"]
    S["Sparse head<br/>vocab-size ReLU weights"]
    M["Multi-vector head<br/>ColBERT per-token"]
    F["Hybrid fusion<br/>dense + sparse + multi-vec"]
    IN --> BB
    BB --> D
    BB --> S
    BB --> M
    D --> F
    S --> F
    M --> F

    NOTE["DanceGPT: dense head only → LanceDB cosine ANN"]
    D -.-> NOTE
```

---

## 3. DanceGPT pipelines

### 3.1 Dataset ingestion

Syllabus PDFs become searchable chunks through an offline CLI pipeline. PostgreSQL tracks document workflow; LanceDB holds vectors.

```mermaid
sequenceDiagram
    participant PDF as Syllabus PDFs
    participant OCR as ocr_ingest.py
    participant GCV as Google Cloud Vision
    participant PG as PostgreSQL (documents)
    participant IDX as chunk_and_index.py
    participant CTX as contextual.py (optional)
    participant GQ as Groq Llama 3.3 70B (optional)
    participant E as BAAI/bge-m3
    participant L as LanceDB (chunks)

    PDF->>OCR: Rasterize pages → PNG
    OCR->>GCV: document_text_detection
    GCV-->>OCR: full_text_annotation per page
    OCR->>PG: INSERT documents · status=ocr_done

    IDX->>PG: SELECT status=ocr_done
    IDX->>IDX: chunk_text(500 chars, overlap 50)
    alt CONTEXTUAL_CHUNKING=1
        IDX->>CTX: Document excerpt
        CTX->>GQ: 1–2 sentence syllabus header
        GQ-->>CTX: Header text
        CTX-->>IDX: Prepend header to each chunk
    end
    IDX->>E: embed_batch(chunks)
    E-->>IDX: 1024-d L2-normalized vectors
    IDX->>L: upsert_chunks(id, doc_id, page_num, text, vector, level, topic)
    IDX->>PG: UPDATE status=indexed
```

**Chunking (implemented):** 500 characters, 50 overlap, sliding windows over OCR text joined with `\n\n` — not token-aware.

**Scripts:** `scripts/ocr_ingest.py`, `scripts/chunk_and_index.py`, optional `scripts/batch_ingest.py`.

---

### 3.2 Inference (7 stages)

Full query-time pipeline for chat (`POST /ai/chat` → `rag.query_rag()`).

![DanceGPT full inference pipeline — 7 stages with ambiguous re-retrieval loop](architecture/diagrams/dancegpt-inference.png)

```mermaid
flowchart TD
    S1["① Input<br/>query + exam level ℓ + last 6 chat turns"]
    S1o{"Optional MQE / HyDE<br/>Llama 3.3 → extra queries"}
    S2["② BAAI/bge-m3 bi-encoder<br/>1024-d L2-normalized · cosine"]
    S3["③ LanceDB ANN k=24<br/>strict level filter → soft fallback"]
    S4["④ Hybrid BM25 + RRF<br/>k1=1.5, b=0.75 · RRF k=60 on pool"]
    S5["⑤ BAAI/bge-reranker-v2-m3<br/>cross-encoder → top 5"]
    S6["⑥ LLM relevance judge CRAG-style<br/>Llama 3.3 · temp=0.0"]
    S7["⑦ Llama 3.3 70B generator<br/>temp=0.7 · syllabus context"]
    OUT["Tutoring answer<br/>Bharatanatyam-specific"]
    REF["Refuse: no material"]
    CORP["Syllabus corpus<br/>LanceDB chunks"]

    S1 --> S1o
    S1o --> S2
    S1 --> S2
    S2 --> S3
    CORP -.-> S3
    S3 --> S4 --> S5 --> S6
    S6 -->|relevant| S7 --> OUT
    S6 -->|irrelevant| REF
    S6 -->|ambiguous| BROAD["Broad re-retrieve<br/>soft level · K×2 · re-rerank · re-grade"]
    BROAD --> CORP
    BROAD --> S5
```

**Level penalty (soft mode):** After dense retrieval, cosine distance is rescaled:

\[
d' = d \times \bigl(1 + \lambda \cdot \mathrm{level\_distance}(\ell_{\mathrm{user}}, \ell_{\mathrm{chunk}})\bigr)
\]

- \(\lambda\) = `RAG_LEVEL_PENALTY` (default **0.15**)
- Ladder: `Preliminary → Junior → Intermediate → Senior`; `General` is neutral
- **Strict filter:** SQL `level = user_level OR level = 'General'`
- **Auto mode:** strict first; if fewer than `RAG_TWO_STAGE_MIN_ROWS` (3), **soft** fallback with penalty rescoring

**Ambiguous branch:** Re-embed original question only, `level_mode=soft`, `retrieve_k` up to `min(2×K, 48)`, rerank, second CRAG grade; still **no web search** (corpus-only corrective retrieval).

---

## 4. Data model

### 4.1 LanceDB schema (ER diagram)

LanceDB stores **chunks**; PostgreSQL stores **documents** and workflow state. Join key: `chunks.doc_id` → `documents.id`.

```mermaid
erDiagram
    DOCUMENTS ||--o{ CHUNKS : "produces"

    DOCUMENTS {
        uuid id PK
        text file_name
        text file_path
        text ocr_text_path
        text level
        text topic
        text status
        timestamptz uploaded_at
    }

    CHUNKS {
        utf8 id PK
        utf8 doc_id FK
        int32 page_num
        utf8 text
        float32_list vector "1024-d BGE-M3"
        utf8 level
        utf8 topic
    }
```

| `chunks` column | PyArrow type | Role |
|-----------------|--------------|------|
| `id` | UTF-8 | Chunk UUID |
| `doc_id` | UTF-8 | FK to Postgres `documents.id` |
| `page_num` | int32 | Coarse page attribution from OCR JSON |
| `text` | UTF-8 | Chunk body (optional contextual header prefix) |
| `vector` | `list<float32>` × 1024 | L2-normalized BGE-M3 dense embedding |
| `level` | UTF-8 | Exam level facet (`Preliminary` … `Senior`, `General`) |
| `topic` | UTF-8 | Topic metadata (e.g. Theory, Tala) |

**Storage path:** `data/lancedb/` (override with `LANCEDB_PATH`). Implementation: `ai/lancedb_client.py`.

### 4.2 Dataset ingestion flow (summary)

```mermaid
flowchart LR
    A["PDF syllabus uploads"] --> B["PyMuPDF / Pillow rasterize"]
    B --> C["Google Cloud Vision OCR"]
    C --> D["OCR JSON + Postgres row<br/>status=ocr_done"]
    D --> E["Character chunks 500/50"]
    E --> F{"CONTEXTUAL_CHUNKING?"}
    F -->|yes| G["Groq doc header per PDF"]
    F -->|no| H["Raw chunk text"]
    G --> I["BGE-M3 embed_batch"]
    H --> I
    I --> J["LanceDB upsert"]
    J --> K["Postgres status=indexed"]
```

---

## 5. Pipeline stage coverage

Side-by-side count of **distinct inference-time stages** (offline indexing counted separately where it defines the system).

| System | Offline indexing | Query-time stages | Total (typical path) |
|--------|------------------|-------------------|----------------------|
| **Lewis 2020** | Passage split → DPR doc encode → FAISS build (**2**) | Query encode → MIPS retrieve → BART generate (**3**) | **5** |
| **CRAG 2024** | Static corpus + DPR index (**1**) | DPR retrieve → T5 evaluator → branch action → LLM generate (**4**) | **5** |
| **BGE-M3 2024** | Model pretrain (not app-specific) | Shared encode → 3 heads → hybrid fusion (**3** as retriever) | **3** (embedding stack) |
| **DanceGPT** | OCR → chunk → optional contextualize → embed → LanceDB (**4–5**) | Input → encode → ANN+level → BM25+RRF → rerank → LLM judge → generate (**7**) | **11–12** end-to-end |

**DanceGPT’s seven inference stages (numbered in diagram):**

| # | Stage | Component |
|---|--------|-----------|
| 1 | Input conditioning | Query + level ℓ + history (6 turns); optional MQE/HyDE |
| 2 | Dense encoding | `BAAI/bge-m3` |
| 3 | Vector retrieval | LanceDB cosine ANN, `k=24`, strict→soft level |
| 4 | Hybrid fusion | BM25 on candidate pool + RRF (`k=60`) |
| 5 | Reranking | `BAAI/bge-reranker-v2-m3` → top 5 |
| 6 | Relevance judge | Llama 3.3 70B, temp=0.0 (relevant / ambiguous / irrelevant) |
| 7 | Generation | Llama 3.3 70B on Groq, temp=0.7 |

---

## 6. How DanceGPT perceives the dataset

The system never “reads” PDFs at query time. It perceives the syllabus only through **embedded chunk records** in a 1024-dimensional cosine space, with metadata gates.

```mermaid
flowchart TB
    subgraph PERCEPTION["Query-time perception"]
        Q["Natural-language question"]
        V["Single dense vector in ℝ¹⁰²⁴"]
        ANN["Nearest neighbors in LanceDB"]
        META["Metadata facets: level, topic, page_num"]
        UNIT["~500-char text windows"]
        Q --> V --> ANN
        ANN --> UNIT
        ANN --> META
    end

    subgraph GATING["Level-aware gating"]
        STRICT["Strict SQL filter<br/>user level ∪ General"]
        SOFT["Soft rescoring<br/>d' = d × (1 + 0.15 × level_distance)"]
        STRICT --> SOFT
    end

    ANN --> GATING
    GATING --> POOL["Candidate pool ≤ 24"]
    POOL --> LEX["BM25 lexical view<br/>same pool only"]
    POOL --> CE["Cross-encoder<br/>query × chunk pairs"]
```

| Perception dimension | What the model “sees” | Implication |
|---------------------|------------------------|-------------|
| **Embedding space** | Semantic similarity of chunk text (dense BGE-M3 only) | Paraphrases match; rare spellings may need BM25+RRF |
| **Granularity** | Fixed ~500-character windows with 50-char overlap | Long explanations split; overlap partially heals boundaries |
| **Level** | User profile level vs chunk `level` + penalty ladder | Wrong metadata or distant level chunks rank lower or are filtered |
| **Topic** | Stored facet, not a hard filter in default RAG | Useful for ingestion organization; retrieval is primarily vector+lexical |
| **Provenance** | `doc_id`, `page_num` in rows | Citations are coarse; not sentence-level anchors |
| **Corpus boundary** | Only LanceDB rows from ingested PDFs | No knowledge outside indexed syllabus |

---

## 6.1 Flashcard generation and template decks

Flashcards use the same retrieval substrate as chat but add explicit safety checks before templates/decks are created.

```mermaid
flowchart TD
    topicReq["Topic + level request"] --> retrieve["retrieve_syllabus_context(top_n=10)"]
    retrieve --> gate{"Pre-check relevance"}
    gate -->|"irrelevant / ambiguous"| stop["Return warning (no cards)"]
    gate -->|"relevant"| gen["LLM generates JSON cards"]
    gen --> verify["Grounding verifier checks each card against excerpts"]
    verify --> filter["Drop unsupported cards; enforce minimum grounded count"]
    filter --> save["Persist deck/cards"]
```

- **Sanity check env toggles**: `RAG_ENABLE_CARD_SANITY=1`, `RAG_CARD_MIN_GROUNDED=3`.
- **Template strategy**: `scripts/generate_syllabus_decks.py` now seeds **per-topic** templates for both **Junior** and **Senior** from the canonical taxonomy, rather than one deck per level.
- **Frontend effect**: pre-made templates are grouped by level and topic, with optional level filtering.

---

## 7. Dataset caveats

Eight known limitations of the current syllabus dataset and indexing design, and how they propagate to retrieval quality.

```mermaid
flowchart TD
    ROOT["Syllabus dataset in LanceDB"]
    ROOT --> C1["① Character chunking<br/>500/50 · not token/sentence aware"]
    ROOT --> C2["② OCR fidelity<br/>GCV on rasterized pages"]
    ROOT --> C3["③ Closed corpus<br/>no web fallback"]
    ROOT --> C4["④ Coarse page_num<br/>min-page heuristic per chunk"]
    ROOT --> C5["⑤ Manual level/topic tags<br/>CLI/DB assignment errors"]
    ROOT --> C6["⑥ Dense-only index<br/>BGE sparse/multi-vec unused"]
    ROOT --> C7["⑦ Pool-limited BM25<br/>not full-corpus inverted index"]
    ROOT --> C8["⑧ Bi-encoder chunk view<br/>no cross-chunk reasoning at index time"]

    C1 --> R1["Terms/tables may split across chunks"]
    C2 --> R2["Devanagari, layout, handwriting gaps"]
    C3 --> R3["Missing syllabus → refuse path only"]
    C4 --> R4["Weak citation granularity"]
    C5 --> R5["Level filter / penalty skew"]
    C6 --> R6["Rare transliterations may rank poorly"]
    C7 --> R7["Lexical recall bounded by dense top-k"]
    C8 --> R8["Multi-hop facts need lucky co-retrieval"]
```

| # | Caveat | Mitigation in DanceGPT |
|---|--------|------------------------|
| 1 | Character windows | 50-char overlap; optional contextual header |
| 2 | OCR errors | Manual QA on ingest; re-run OCR on bad PDFs |
| 3 | Closed domain | CRAG judge returns fixed “no material” string |
| 4 | Page attribution | Accept coarse refs; improve ingest metadata later |
| 5 | Metadata quality | Consistent `level`/`topic` at `documents` insert |
| 6 | Dense-only | BM25+RRF on dense pool; cross-encoder rerank |
| 7 | BM25 scope | Raise `RAG_RETRIEVE_K`; ambiguous pass widens pool |
| 8 | Chunk independence | MQE/HyDE (optional); broader ambiguous retrieval |

---

## 8. Side-by-side differentiators

Comparison of Lewis 2020, CRAG 2024, BGE-M3 2024, and DanceGPT across the dimensions used in the project comparison table.

![Side-by-side: what makes DanceGPT different](architecture/diagrams/comparison-table.png)

| Dimension | Lewis 2020 | CRAG 2024 | BGE-M3 2024 | DanceGPT |
|-----------|------------|-----------|-------------|----------|
| **Embeddings / retriever** | BERT DPR bi-encoder; FAISS MIPS; 21M Wikipedia | DPR bi-encoder; static corpus | XLM-RoBERTa M3: dense + sparse + multi-vec | **BGE-M3 dense only, 1024-d cosine, LanceDB** |
| **Hybrid retrieval** | None | None | Dense + sparse + multi-vec | **Dense + BM25 + RRF** |
| **Reranker** | None | None | BGE reranker (optional) | **BGE reranker-v2-m3** |
| **Relevance grader** | None | Fine-tuned T5-large, entity-aligned | None | **Llama 3.3 70B zero-shot, temp=0.0** |
| **Fallback on low quality** | None | Web search (Google API) | N/A | **Broader corpus search (soft level)** |
| **Chunking** | 100-word passage splits | Sentence-level | Variable / benchmark | **500-char, 50 overlap** |
| **Metadata / level filter** | None | None | None | **Exam level Prelim → Senior** |
| **Domain** | Open Wikipedia | Open Wikipedia + web | Multilingual open (100+) | **Closed: Bharatanatyam syllabus** |
| **Generator** | BART (jointly trained) | Any LLM | Not specified | **Llama 3.3 70B, temp=0.7** |

**Legend (DanceGPT column in diagram):** green = deliberate improvement; orange = trade-off; red/orange = generator choice (hosted LLM, non-zero temperature for answers).

---

## 9. DanceGPT differentiators (mindmap)

Everything novel relative to the three reference architectures, as implemented in this repository.

```mermaid
mindmap
  root((DanceGPT))
    Domain
      Closed Bharatanatyam Gandharva syllabus
      Exam level ladder Prelim to Senior
      General level neutral chunks
    Retrieval
      LanceDB cosine ANN k=24
      Strict then soft level policy
      Level distance penalty lambda=0.15
      BM25 on dense pool k1=1.5 b=0.75
      RRF k=60
      bge-reranker-v2-m3 top 5
    Corrective RAG
      Llama 3.3 zero-shot judge
      relevant ambiguous irrelevant
      Ambiguous broad re-retrieve no web
      Irrelevant fixed refuse string
    Ingestion
      GCV document_text_detection
      500 char chunks overlap 50
      Optional Groq contextual headers
      Postgres document workflow
    Generation
      Groq Llama 3.3 70B versatile
      Last 6 turns history
      Optional MQE and HyDE
      Flashcards from same retrieve stack
    Embeddings
      BGE-M3 dense head only
      1024-d schema coupled to LanceDB
```

---

## Related documentation

| Document | Contents |
|----------|----------|
| [README.md](../README.md) | Model IDs, env toggles, trade-offs, file map |
| [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) | Product-level system design and Postgres API |
| `ai/rag.py`, `ai/lancedb_client.py` | Authoritative inference and retrieval code |

---

*Diagram assets live under `docs/architecture/diagrams/`. Update this file when model IDs, schema, or pipeline stages change.*
