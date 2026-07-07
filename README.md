# DanceGPT

**DanceGPT** is an AI-powered study companion for Bharatanatyam **Gandharva Junior and Senior** theory exams. It brings syllabus-grounded tutoring, pre-made flashcards, AI-generated study cards, personal notes, and a curated notes archive into one place.

To our knowledge, this is the first attempt at a dedicated **DanceGPT-style exam helper** focused specifically on Junior and Senior Bharatanatyam Gandharva preparation.

## What it does

- **AI Tutor** — Ask exam-style questions and get answers grounded in indexed syllabus material (RAG over LanceDB + Groq LLM).
- **Syllabus Flashcards** — Pre-loaded Junior and Senior decks by topic (Adavus, Tala, Abhinaya, Navarasa, and more).
- **AI Flashcard Generator** — Create new decks from any topic using retrieved syllabus context.
- **My Notes** — Save and edit your own study notes in the app.
- **Notes Archive** — Quick access to the shared [Google Drive notes folder](https://drive.google.com/drive/folders/1CVV0buNe4DZHQJKTYr2L_2XlWP7jtioq).

## Tech stack

| Layer | Stack |
|--------|--------|
| Frontend | Next.js, React, Tailwind CSS |
| API | Node.js, Express, PostgreSQL |
| AI service | FastAPI, LanceDB, BGE-M3 embeddings, Groq (Llama 3.3 70B) |
| Data | Postgres (users, chat, flashcards) + LanceDB (syllabus chunks) |

For the full architecture, model stack, and RAG pipeline details, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **PostgreSQL** (via Docker, or a local install)
- **Groq API key** — [console.groq.com](https://console.groq.com) (required for chat and AI flashcards)

Optional (for OCR / re-indexing syllabus PDFs):

- Google Cloud Vision credentials

## Quick start

### 1. Clone and configure environment

```bash
git clone <your-repo-url>
cd danceGpt
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
GROQ_API_KEY=your_groq_key_here
DATABASE_URL=postgresql://dancegpt:dancegpt@127.0.0.1:5433/dancegpt
AI_SERVICE_URL=http://127.0.0.1:8000
```

> **Port note:** Docker Compose maps Postgres to host port **5433**. If you use a local Postgres on **5432**, change `DATABASE_URL` accordingly (e.g. `...@127.0.0.1:5432/dancegpt`).

### 2. Start PostgreSQL

**Option A — Docker (recommended)**

```bash
docker compose up -d
```

**Option B — Local Postgres**

Create the database and user, then point `DATABASE_URL` at your instance.

### 3. Run database migrations

```bash
psql "$DATABASE_URL" -f api/db/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f api/db/migrations/002_flashcard_decks.sql
psql "$DATABASE_URL" -f api/db/migrations/003_template_decks.sql
psql "$DATABASE_URL" -f api/db/migrations/004_seed_template_flashcards.sql
```

Migration `004` seeds pre-made Junior and Senior syllabus flashcard decks.

### 4. Start the AI service (Python)

```bash
cd ai
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

First run may download embedding/reranker model weights (~2 GB). Syllabus chunks should already exist under `data/lancedb/` if you cloned a populated repo.

### 5. Start the API (Node)

In a new terminal:

```bash
cd api
npm install
npm run dev
```

API listens on **http://localhost:3001**.

### 6. Start the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**, sign up, choose your exam level (**Junior** or **Senior**), and start studying.

## Running everything (summary)

You need **four processes** (or three terminals + Docker):

| Service | Command | URL |
|---------|---------|-----|
| Postgres | `docker compose up -d` | `localhost:5433` |
| AI (FastAPI) | `cd ai && source .venv/bin/activate && uvicorn main:app --host 127.0.0.1 --port 8000 --reload` | http://127.0.0.1:8000 |
| API (Express) | `cd api && npm run dev` | http://localhost:3001 |
| Frontend | `cd frontend && npm run dev` | http://localhost:3000 |

Health checks:

```bash
curl http://127.0.0.1:8000/health    # AI service
curl http://localhost:3001/health    # API + DB
```

## Optional: index syllabus PDFs

If LanceDB is empty or you add new PDFs under `data/uploads/`:

```bash
# OCR (requires Google Cloud Vision)
python scripts/ocr_ingest.py

# Chunk, embed, and index into LanceDB
python scripts/chunk_and_index.py
```

## Optional: regenerate AI template decks

Pre-made decks are seeded by migration `004`. To regenerate them with the AI pipeline instead:

```bash
cd api
npm run seed:template-decks
```

Requires `GROQ_API_KEY`, LanceDB indexed content, and migration `003` applied.

## Project layout

```
danceGpt/
├── frontend/          # Next.js app (chat, flashcards, notes)
├── api/               # Express API, auth, Postgres routes
├── ai/                # FastAPI RAG service
├── scripts/           # OCR, chunking, indexing, deck seeding
├── data/
│   ├── lancedb/       # Vector store (syllabus chunks)
│   └── uploads/       # Source PDFs
└── docs/              # Architecture and diagrams
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `502` on chat or flashcards | Ensure the AI service is running on port 8000 and `GROQ_API_KEY` is set in `.env`. |
| API cannot reach AI | Use `AI_SERVICE_URL=http://127.0.0.1:8000` (not `localhost`) if Docker also uses port 8000. |
| No syllabus flashcards | Run migration `004_seed_template_flashcards.sql`. |
| Empty / weak tutor answers | Confirm `data/lancedb/` has indexed chunks; re-run `chunk_and_index.py` if needed. |
| Postgres connection failed | Check `DATABASE_URL` port (`5433` for Docker, `5432` for local). |

## License

Academic / project use — adjust as needed for your submission or deployment.
