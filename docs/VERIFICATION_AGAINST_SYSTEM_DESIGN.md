# Verification: Implementation vs Final System Design

This document summarizes how the current codebase aligns with the **Final System Design** and what was fixed or is still pending.

---

## 1. Tech stack

| Layer | Design | Current | Status |
|-------|--------|---------|--------|
| Frontend | Next.js (React) | Next.js 16, App Router, TypeScript, Tailwind | OK |
| Node API | Express or Fastify | Express | OK |
| Python AI | FastAPI | FastAPI | OK |
| LLM | DeepSeek API | Not integrated yet (stub only) | Phase 5 |
| Embeddings | BGE-M3 local | Not integrated yet | Phase 4–5 |
| Vector store | LanceDB | Not integrated yet | Phase 4–5 |
| Database | Postgres | Postgres, docker-compose | OK |
| OCR | Google Cloud Vision | Not integrated yet | Phase 4 |
| PDF ingestion | Local CLI | `scripts/` present, no scripts yet | Phase 4 |

---

## 2. Postgres schema

**Status: Aligned (after fix)**

The migration file `api/db/migrations/001_initial_schema.sql` was **updated** to match the design:

- **users**: `id`, `email`, `password_hash`, `level`, `created_at` (removed `display_name`, `updated_at`).
- **sessions**: `id`, `user_id`, `expires_at`, `created_at` (removed `token`; cookie holds session `id`).
- **documents**: `id`, `file_name`, `file_path`, `ocr_text_path`, `level`, `topic`, `status`, `uploaded_at` (no `user_id`; admin-only upload).
- **notes**: `id`, `user_id`, `title`, `content`, `created_at`, `updated_at` (no `document_id`).
- **flashcards**: `id`, `doc_id`, `level`, `topic`, `front`, `back`, `generated_at`.
- **user_saved_flashcards**: `(user_id, flashcard_id)` composite PK, `saved_at` (no separate `id`).
- **chat_sessions**: `id`, `user_id`, `title`, `created_at` (no `document_id`, no `updated_at`).
- **chat_messages**: `id`, `chat_session_id`, `role`, `content`, `created_at`.

**If you already ran the old migration:** drop the database and re-run this migration, or run a one-off migration to alter tables to match the above (e.g. add `users.level`, drop `sessions.token`, adjust `documents`/`notes`/`flashcards`/`chat_sessions` as above).

---

## 3. Node.js API

| Design endpoint | Implemented | Notes |
|-----------------|-------------|--------|
| POST /auth/signup | Yes | auth.js |
| POST /auth/login | Yes | auth.js, sets `session_id` cookie |
| POST /auth/logout | Yes | auth.js, requireAuth |
| GET /auth/me | Yes | auth.js, requireAuth |
| GET /chat/sessions | Yes | chat.js |
| POST /chat/sessions | Yes | chat.js |
| GET /chat/sessions/:id/messages | Yes | chat.js |
| POST /chat/message | Yes | chat.js, proxies to Python `/ai/chat` |
| GET /notes, POST /notes, GET/PUT/DELETE /notes/:id | No | Phase 8 |
| GET /flashcards, POST /flashcards/generate | No | Phase 9 |
| GET /flashcards/saved, POST/DELETE /flashcards/:id/save | No | Phase 9 |

---

## 4. Python AI service

| Design | Current | Notes |
|--------|---------|--------|
| POST /ai/chat | Yes (stub) | routers/chat.py — echoes question; real RAG in Phase 5 |
| POST /ai/flashcards/generate | No | Phase 9 |
| rag.py, embeddings.py, lancedb_client.py | No | Phase 4–5 |

---

## 5. Frontend

| Design | Current | Notes |
|--------|---------|--------|
| /login | Yes | (auth)/login/page.tsx |
| /signup | Yes | (auth)/signup/page.tsx |
| /chat | Yes | (app)/chat/page.tsx, shows user email, messages, stub reply |
| /notes | No | Phase 8 |
| /flashcards | No | Phase 9–10 |
| Middleware (session cookie → redirect) | Yes | middleware.ts |
| API client (credentials: include) | Yes | lib/api.ts |

Design mentions `frontend/src/app/`; this repo uses `frontend/app/` (no `src`). Both are valid in Next.js.

---

## 6. Folder structure

| Design path | Exists | Notes |
|-------------|--------|--------|
| frontend/app/(auth)/login, signup | Yes | |
| frontend/app/(app)/chat | Yes | |
| frontend/lib/api.ts | Yes | path is frontend/lib/api.ts |
| api/routes/auth.js, chat.js | Yes | |
| api/routes/notes.js, flashcards.js | No | Phase 8–9 |
| api/middleware/session.js | Yes | |
| api/db/client.js, migrations/ | Yes | |
| ai/main.py, routers/chat.py | Yes | |
| ai/rag.py, flashcards.py, embeddings.py, lancedb_client.py | No | Phase 4–5, 9 |
| scripts/ocr_ingest.py, chunk_and_index.py | No | Phase 4 |
| data/uploads, data/ocr, data/lancedb | Not committed (gitignored) | Create when needed |
| docs/SYSTEM_DESIGN.md | Yes | Updated to final design |
| docker-compose.yml, .env | Yes | |

---

## 7. Data flows

- **Signup / login / logout:** Implemented as in design (bcrypt, session row, `session_id` cookie).
- **RAG chat:** Partially implemented: Node saves messages, proxies to Python; Python stub echoes; real RAG (LanceDB + DeepSeek) not yet built.
- **Offline ingestion:** Not implemented (scripts and AI indexing in Phase 4).
- **Notes, flashcards:** Not implemented (Phases 8–10).

---

## 8. Summary

- **Aligned with design:** Auth (signup, login, logout, session middleware), chat routes and stub, frontend login/signup/chat, API client, Postgres schema (after migration fix), docs.
- **Fixed in this pass:** Postgres migration rewritten to match the final system design so auth and future phases use the correct schema.
- **Not yet implemented (by design):** Notes API + UI, flashcard API + UI, OCR + indexing scripts, real RAG (BGE-M3 + LanceDB + DeepSeek), Python modules `rag.py`, `embeddings.py`, `lancedb_client.py`, `flashcards.py`.

Running the updated migration (on a fresh DB or after dropping existing tables) will make the app consistent with the final system design for Phase 1 and set the base for Phases 4–11.
