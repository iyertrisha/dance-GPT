-- DanceGPT schema — aligned with Final System Design
-- Run against the dancegpt database after Postgres is up.
-- If you already ran an older migration, drop tables and re-run this.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- Auth
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  level         TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- Documents (managed by you via CLI only)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name      TEXT NOT NULL,
  file_path      TEXT NOT NULL,
  ocr_text_path  TEXT,
  level          TEXT,
  topic          TEXT,
  status         TEXT DEFAULT 'pending',
  uploaded_at    TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- Personal notes (per user, typed in app)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- Flashcards (global pool, generated from documents)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS flashcards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id       UUID REFERENCES documents(id) ON DELETE SET NULL,
  level        TEXT NOT NULL,
  topic        TEXT,
  front        TEXT NOT NULL,
  back         TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_saved_flashcards (
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  saved_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, flashcard_id)
);

-- ─────────────────────────────────────────
-- Chat
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_level_topic ON flashcards(level, topic);
CREATE INDEX IF NOT EXISTS idx_user_saved_flashcards_user_id ON user_saved_flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(chat_session_id);
