# DanceGPT — System Design

## Overview

DanceGPT is an AI-powered study tool for dance students. Users upload PDF sheet music / notation, and the system performs OCR, embeds content into a vector store, and provides RAG-based Q&A, flashcard generation, and note-taking.

---

## Architecture

```
flowchart LR
  subgraph local [Local Machine]
    frontend["Next.js :3000"]
    api["Node API :3001"]
    ai["Python AI :8000"]
    pg["Postgres :5432"]
  end
  frontend -->|REST + cookie| api
  api -->|SQL| pg
  api -->|Internal HTTP| ai
  ai -->|SQL| pg
```

---

## Services

| Service | Stack | Port |
|---------|-------|------|
| Frontend | Next.js 14 (App Router, TypeScript, Tailwind) | 3000 |
| API | Node.js / Express | 3001 |
| AI | Python / FastAPI | 8000 |
| Database | Postgres 16 | 5432 |
| Vector Store | LanceDB (file-based) | — |

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | gen_random_uuid() |
| email | TEXT UNIQUE | |
| password_hash | TEXT | bcrypt |
| display_name | TEXT | |
| created_at / updated_at | TIMESTAMPTZ | |

### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| token | TEXT UNIQUE | |
| expires_at | TIMESTAMPTZ | |

### `documents`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| title | TEXT | |
| file_path | TEXT | path under data/uploads/ |
| ocr_path | TEXT | path under data/ocr/ |
| status | TEXT | pending \| processing \| ready \| error |

### `notes`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| document_id | UUID FK → documents | nullable |
| title | TEXT | |
| content | TEXT | |

### `flashcards`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| document_id | UUID FK → documents | |
| front | TEXT | |
| back | TEXT | |

### `user_saved_flashcards`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| flashcard_id | UUID FK → flashcards | |
| UNIQUE (user_id, flashcard_id) | | |

### `chat_sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| document_id | UUID FK → documents | nullable |
| title | TEXT | |

### `chat_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| chat_session_id | UUID FK → chat_sessions | |
| role | TEXT | user \| assistant \| system |
| content | TEXT | |

---

## Data Flow

### Upload & Ingestion
1. User uploads PDF via frontend → `POST /api/documents`
2. API saves file to `data/uploads/`, creates DB record with `status=pending`
3. API calls AI service `POST /ingest` with document_id
4. AI service runs Google Cloud Vision OCR → saves JSON to `data/ocr/`
5. AI chunks text, embeds with BGE-M3, upserts into LanceDB
6. AI updates document `status=ready`

### RAG Q&A
1. User sends message in chat → `POST /api/chat`
2. API forwards to AI service `POST /query`
3. AI embeds query, retrieves top-k chunks from LanceDB
4. AI builds prompt with retrieved context, calls DeepSeek API
5. Response streamed back through API to frontend

### Flashcard Generation
1. `POST /api/flashcards/generate` with document_id
2. AI summarises document chunks → generates Q/A pairs
3. Cards stored in `flashcards` table, returned to user
