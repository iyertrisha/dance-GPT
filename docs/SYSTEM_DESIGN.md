# Final System Design: Bharatanatyam Gandharva Study Helper

---

## Confirmed tech stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Frontend** | Next.js (React) | Full web app, SSR, easy API routing |
| **Node.js API** | Express or Fastify | Auth, sessions, notes, flashcards, proxy to Python |
| **Python AI service** | FastAPI | RAG, embeddings, flashcard generation |
| **LLM** | DeepSeek API (`deepseek-chat`) | Cheap, multilingual, OpenAI-compatible SDK |
| **Embeddings** | BAAI BGE-M3 (local, `sentence-transformers`) | Free, no API key, supports Devanagari + English |
| **Vector store** | LanceDB (local files) | Embedded, no separate server, Python-native |
| **Database** | Postgres | Auth, sessions, notes, flashcards, chat history |
| **OCR** | Google Cloud Vision API | Handles handwriting + mixed Devanagari/English |
| **PDF ingestion** | Local CLI Python script (you run it) | No admin web UI needed |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│              BROWSER (Next.js)                   │
│   /login  /chat  /notes  /flashcards             │
└────────────────────┬─────────────────────────────┘
                     │ HTTPS / REST + cookies
                     ▼
┌──────────────────────────────────────────────────┐
│           NODE.JS API  (Express/Fastify)         │
│                                                  │
│  auth │ sessions │ notes │ flashcards (serve +   │
│  save) │ chat history │ proxy to Python          │
└───────────────┬──────────────────────────────────┘
                │                │
        SQL     │                │ Internal HTTP
                ▼                ▼
        ┌───────────┐    ┌───────────────────────┐
        │ POSTGRES  │    │  PYTHON AI SERVICE    │
        │           │    │  (FastAPI)            │
        │ users     │    │                       │
        │ sessions  │◄───│  RAG query            │
        │ notes     │    │  Flashcard generation │
        │ flashcards│    │  Embedding + indexing │
        │ chat_msgs │    └──────────┬────────────┘
        └───────────┘               │
                              ┌─────▼──────┐
                              │  LANCEDB   │
                              │ (./data/   │
                              │  lancedb/) │
                              └────────────┘

══════════ OFFLINE (you run this once before go-live) ══════════

Your PDFs → ocr_ingest.py → Google Cloud Vision API
         → text + page metadata per PDF
         → chunk_and_index.py → BGE-M3 (local) → LanceDB
         → document record → Postgres
```

---

## Postgres schema

```sql
-- Auth
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  level         TEXT NOT NULL,   -- e.g. 'Preliminary', 'Junior', 'Senior'
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents (managed by you via CLI)
CREATE TABLE documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name      TEXT NOT NULL,
  file_path      TEXT NOT NULL,        -- path to PDF on disk
  ocr_text_path  TEXT,                 -- path to OCR output JSON
  level          TEXT,                 -- which exam level this belongs to
  topic          TEXT,                 -- e.g. 'Theory', 'Tala', 'Raga', 'Abhinaya'
  status         TEXT DEFAULT 'pending',  -- pending | ocr_done | indexed | failed
  uploaded_at    TIMESTAMPTZ DEFAULT now()
);

-- Personal notes (per user, typed in app)
CREATE TABLE notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Flashcards (global pool, generated from documents)
CREATE TABLE flashcards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id       UUID REFERENCES documents(id),
  level        TEXT NOT NULL,
  topic        TEXT,
  front        TEXT NOT NULL,
  back         TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- User-saved flashcards (personal saved collection)
CREATE TABLE user_saved_flashcards (
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  saved_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, flashcard_id)
);

-- Chat
CREATE TABLE chat_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,                     -- optional, auto-named or user-named
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,       -- 'user' | 'assistant'
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## Data flows

### Offline ingestion (CLI — you run before go-live)

- **Step 1: ocr_ingest.py** — For each PDF in `./data/uploads/`, send each page to Google Cloud Vision API; save `./data/ocr/{doc_id}.json`; insert `documents` row with `status = 'ocr_done'`.
- **Step 2: chunk_and_index.py** — For each document with `status = 'ocr_done'`, read OCR text, chunk (~500 chars, 50 overlap), attach metadata (doc_id, page, level, topic), embed with BGE-M3, upsert into LanceDB, set `documents.status = 'indexed'`.

### User signup / login

- `POST /auth/signup` { email, password, level } → bcrypt hash, insert into users, return 201.
- `POST /auth/login` { email, password } → verify, create session (7-day expiry), set HTTP-only cookie `session_id`, return user info.
- All subsequent requests: middleware reads cookie, looks up sessions, attaches user to request.

### RAG chat

- `POST /chat/message` { session_id, content } → Node: auth, save user message, call Python `/ai/chat` { question, level, history } → Python: embed question, query LanceDB, build prompt, call DeepSeek, return answer → Node: save assistant message, return to frontend.

### Flashcard generation and viewing

- `GET /flashcards?topic=...` → cards for user's level + topic, plus saved IDs.
- `POST /flashcards/generate` { topic } → Python generates from LanceDB chunks via DeepSeek; Node saves to `flashcards`, returns cards.
- `POST /flashcards/:id/save`, `DELETE /flashcards/:id/save`, `GET /flashcards/saved` for user's saved collection.

### Notes

- `GET /notes`, `POST /notes`, `GET /notes/:id`, `PUT /notes/:id`, `DELETE /notes/:id` — all scoped by user_id.

---

## Full API surface

### Node.js API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/signup` | Public | Register |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/logout` | Session | Clear session |
| GET | `/auth/me` | Session | Get current user |
| GET | `/notes` | Session | List user's notes |
| POST | `/notes` | Session | Create note |
| GET | `/notes/:id` | Session | Get note |
| PUT | `/notes/:id` | Session | Update note |
| DELETE | `/notes/:id` | Session | Delete note |
| GET | `/chat/sessions` | Session | List chat sessions |
| POST | `/chat/sessions` | Session | Start new chat session |
| GET | `/chat/sessions/:id/messages` | Session | Get messages |
| POST | `/chat/message` | Session | Send message (proxies to Python) |
| GET | `/flashcards` | Session | Get cards for user's level + topic |
| POST | `/flashcards/generate` | Session | Trigger generation (proxies to Python) |
| GET | `/flashcards/saved` | Session | Get user's saved cards |
| POST | `/flashcards/:id/save` | Session | Save a card |
| DELETE | `/flashcards/:id/save` | Session | Unsave a card |

### Python AI service (internal only)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/ai/chat` | RAG query → DeepSeek answer |
| POST | `/ai/flashcards/generate` | Generate flashcards from LanceDB + DeepSeek |

### CLI scripts (you run locally)

| Script | Purpose |
|--------|---------|
| `ocr_ingest.py` | PDFs → Google Cloud Vision → OCR text JSON |
| `chunk_and_index.py` | OCR text → BGE-M3 → LanceDB + Postgres |

---

## Folder structure

```
danceGpt/
├── frontend/                  ← Next.js
│   └── app/                   (or src/app/)
│       ├── (auth)/login/
│       ├── (auth)/signup/
│       ├── (app)/chat/
│       ├── notes/
│       └── flashcards/
│   └── lib/                   ← API client
├── api/                       ← Node.js (Express)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── notes.js
│   │   ├── chat.js
│   │   └── flashcards.js
│   ├── middleware/session.js
│   └── db/
│       ├── client.js
│       └── migrations/
├── ai/                        ← Python (FastAPI)
│   ├── main.py
│   ├── rag.py
│   ├── flashcards.py
│   ├── embeddings.py
│   ├── lancedb_client.py
│   └── routers/chat.py
├── scripts/
│   ├── ocr_ingest.py
│   └── chunk_and_index.py
├── data/
│   ├── uploads/
│   ├── ocr/
│   └── lancedb/
├── .env
├── docker-compose.yml
└── docs/SYSTEM_DESIGN.md
```

---

## Implementation order

| Phase | What | Output |
|-------|------|--------|
| 1 | Repo + env + Docker Compose for Postgres | App boots, connects to DB |
| 2 | DB migrations (all tables above) | Schema exists |
| 3 | Node.js auth (signup, login, session middleware) | Users can log in |
| 4 | OCR + indexing CLI scripts | PDFs are OCR'd and in LanceDB |
| 5 | Python AI service: embeddings + RAG query | Chat backend works |
| 6 | Node.js chat routes + proxy to Python | Chat endpoint returns answers |
| 7 | Chat UI (Next.js) | Users can chat |
| 8 | Notes routes (Node.js) + Notes UI | Users can take notes |
| 9 | Flashcard generation + serve + save routes | Flashcards work end-to-end |
| 10 | Flashcard UI (flip deck, save button) | Full flashcard feature done |
| 11 | Polish | Production-ready locally |
